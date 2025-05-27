import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
	doc,
	getDoc,
	collection,
	query,
	where,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import MemberSidebar from "../components/membersidebar";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

interface Task {
	id: string;
	taskName: string;
	description: string;
	dueDate: string;
	priority: string;
	assignedMembers: string[];
	completed: boolean;
	organizationId: string;
	organizationName: string;
}

const MemberViewTasks: React.FC = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<string>("All");
	const [currentPage, setCurrentPage] = useState(1);
	const tasksPerPage = 8;
	const [modalOpen, setModalOpen] = useState(false);
	const [editTask, setEditTask] = useState<Task | null>(null);
	const [formState, setFormState] = useState({
		taskName: "",
		description: "",
		dueDate: "",
		priority: "Medium",
	});
	const [formError, setFormError] = useState<string | null>(null);

	const fetchTasks = async () => {
		setLoading(true);
		setError(null);

		const user = auth.currentUser;
		if (!user) {
			setError("You must be logged in to view tasks.");
			setLoading(false);
			return;
		}

		try {
			// Fetch user's organizations
			const membersRef = collection(db, "Members");
			const membersQuery = query(
				membersRef,
				where("uid", "==", user.uid),
				where("status", "==", "approved")
			);
			const membersSnapshot = await getDocs(membersQuery);
			const userOrganizations = membersSnapshot.docs.map(
				(doc) => doc.data().organizationId
			);

			// Fetch user's name for personal tasks
			const userDoc = await getDoc(doc(db, "Users", user.uid));
			const userData = userDoc.exists() ? userDoc.data() : null;
			const memberName = userData?.fullName || user.uid;

			// Fetch org tasks
			let orgTasks: Task[] = [];
			if (userOrganizations.length > 0) {
				const orgTasksQuery = query(
					collection(db, "tasks"),
					where("organizationId", "in", userOrganizations),
					where("assignedMembers", "array-contains", user.uid)
				);
				const orgTasksSnapshot = await getDocs(orgTasksQuery);
				orgTasks = await Promise.all(
					orgTasksSnapshot.docs.map(async (taskDoc) => {
						const data = taskDoc.data();
						let organizationName = "Unknown Organization";
						if (data.organizationId) {
							const orgDocRef = doc(db, "Organizations", data.organizationId);
							const orgDoc = await getDoc(orgDocRef);
							if (orgDoc.exists()) {
								const orgData = orgDoc.data();
								organizationName = orgData.name || "Unknown Organization";
							}
						}
						const memberNames = await Promise.all(
							(data.assignedMembers || []).map(async (uid: string) => {
								const userDocRef = doc(db, "Users", uid);
								const userDoc = await getDoc(userDocRef);
								if (userDoc.exists()) {
									const userData = userDoc.data();
									return userData.fullName || "Unknown Member";
								}
								return "Unknown Member";
							})
						);
						return {
							id: taskDoc.id,
							taskName: data.taskName || "Untitled Task",
							description: data.description || "",
							dueDate: data.dueDate
								? new Date(data.dueDate.seconds * 1000).toLocaleString()
								: "No due date",
							priority: data.priority || "Medium",
							assignedMembers: memberNames,
							completed: data.completed || false,
							organizationId: data.organizationId || "",
							organizationName: organizationName,
						} as Task;
					})
				);
			}

			const personalTasksQuery = query(
				collection(db, "tasks"),
				where("organizationId", "==", ""),
				where("assignedMembers", "array-contains", user.uid)
			);
			const personalTasksSnapshot = await getDocs(personalTasksQuery);
			const personalTasks = await Promise.all(
				personalTasksSnapshot.docs.map(async (taskDoc) => {
					const data = taskDoc.data();
					const memberNames = await Promise.all(
						(data.assignedMembers || []).map(async (uid: string) => {
							const userDocRef = doc(db, "Users", uid);
							const userDoc = await getDoc(userDocRef);
							if (userDoc.exists()) {
								const userData = userDoc.data();
								return userData.fullName || "Unknown Member";
							}
							return "Unknown Member";
						})
					);
					return {
						id: taskDoc.id,
						taskName: data.taskName || "Untitled Task",
						description: data.description || "",
						dueDate: data.dueDate
							? new Date(data.dueDate.seconds * 1000).toLocaleString()
							: "No due date",
						priority: data.priority || "Medium",
						assignedMembers: memberNames || [],
						completed: data.completed || false,
						organizationId: data.organizationId || "",
						organizationName: "Self Task",
					} as Task;
				})
			);

			// Combine and sort
			const allTasks = [...orgTasks, ...personalTasks];
			allTasks.sort((a, b) => {
				const dateA =
					a.dueDate === "No due date" ? new Date(0) : new Date(a.dueDate);
				const dateB =
					b.dueDate === "No due date" ? new Date(0) : new Date(b.dueDate);
				return dateA.getTime() - dateB.getTime();
			});

			setTasks(allTasks);
		} catch (error) {
			console.error("Error fetching tasks:", error);
			setError("Error fetching tasks. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTasks();
	}, []);

	// Filter tasks based on active tab
	const filteredTasks = tasks.filter((task) => {
		if (activeTab === "All") return true;
		if (activeTab === "Completed") return task.completed;
		if (activeTab === "Not Completed") return !task.completed;
		return true;
	});

	// Calculate pagination
	const indexOfLastTask = currentPage * tasksPerPage;
	const indexOfFirstTask = indexOfLastTask - tasksPerPage;
	const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
	const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber);
	};

	// CRUD Handlers
	const handleOpenModal = (task?: Task) => {
		if (task) {
			setEditTask(task);
			setFormState({
				taskName: task.taskName,
				description: task.description,
				dueDate: task.dueDate
					? new Date(task.dueDate).toISOString().slice(0, 16)
					: "",
				priority: task.priority,
			});
		} else {
			setEditTask(null);
			setFormState({
				taskName: "",
				description: "",
				dueDate: "",
				priority: "Medium",
			});
		}
		setFormError(null);
		setModalOpen(true);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
		setEditTask(null);
		setFormError(null);
	};

	const handleFormChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		setFormState({ ...formState, [e.target.name]: e.target.value });
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);
		const user = auth.currentUser;
		if (!user) return;
		if (!formState.taskName || !formState.dueDate) {
			setFormError("Task name and due date are required.");
			return;
		}
		try {
			// Fetch user's name for personal tasks
			const userDoc = await getDoc(doc(db, "Users", user.uid));
			const userData = userDoc.exists() ? userDoc.data() : null;
			const memberName = userData?.fullName || user.uid;
			const assignedMembers = [user.uid];
			const dueDate = new Date(formState.dueDate);
			const dueDateObj = {
				seconds: Math.floor(dueDate.getTime() / 1000),
				nanoseconds: 0,
			};
			if (editTask) {
				// Update
				const taskRef = doc(db, "tasks", editTask.id);
				await updateDoc(taskRef, {
					taskName: formState.taskName,
					description: formState.description,
					dueDate: dueDateObj,
					priority: formState.priority,
				});
			} else {
				// Create personal task with organizationId as member's name
				await addDoc(collection(db, "tasks"), {
					taskName: formState.taskName,
					description: formState.description,
					dueDate: dueDateObj,
					priority: formState.priority,
					assignedMembers,
					completed: false,
					organizationId: "",
				});
			}
			setModalOpen(false);
			setEditTask(null);
			setFormState({
				taskName: "",
				description: "",
				dueDate: "",
				priority: "Medium",
			});
			setCurrentPage(1);
			await fetchTasks(); // Use the real fetchTasks function!
		} catch (err) {
			setFormError("Error saving task. Please try again.");
		}
	};

	const handleCheckbox = async (taskId: string, completed: boolean) => {
				try {
					const taskRef = doc(db, "tasks", taskId);
					await updateDoc(taskRef, { completed: !completed });
		
					setTasks((prevTasks) =>
						prevTasks.map((task) =>
							task.id === taskId ? { ...task, completed: !completed } : task
						)
					);
				} catch (err) {
					setError("Error updating status for task");
				}
			};

	const handleDeleteTask = async (taskId: string) => {
		if (!window.confirm("Are you sure you want to delete this task?")) return;
		try {
			await deleteDoc(doc(db, "tasks", taskId));
			// Refresh tasks
			setTasks(tasks.filter((t) => t.id !== taskId));
		} catch (err) {
			alert("Error deleting task.");
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<MemberSidebar />
			<main className="ml-64 p-8">
				{/* Back to Dashboard Link */}
				<div className="mb-6 flex justify-end items-center">
		
					<Button
					variant="contained"
                sx={{
                    backgroundColor: '#9333ea',
                    '&:hover': {
                        backgroundColor: '#7e22ce'
                    },
					textTransform: 'none'
                }}
                onClick={() => handleOpenModal()}
            >
						Add Task
					</Button>
				</div>

				{/* Modal for Add/Edit Task */}
				<Modal
					open={modalOpen}
					onClose={handleCloseModal}
				>
					<div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center z-50">
						<div
							className="bg-white p-6 rounded w-96 border-2 border-purple-500 relative"
							style={{
								boxShadow:
									"rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
							}}
						>
							{/* Close Button */}
							<button
								type="button"
								onClick={handleCloseModal}
								className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
							>
								<svg
									className="w-6 h-6 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>

							<h2 className="text-xl font-semibold mb-4">
								{editTask ? "Edit Task" : "Add Task"}
							</h2>
							<form
								onSubmit={handleFormSubmit}
								className="space-y-4"
							>
								<div>
									<label className="block text-sm font-medium text-gray-700">
										Task Name
									</label>
									<input
										type="text"
										name="taskName"
										value={formState.taskName}
										onChange={handleFormChange}
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Description
									</label>
									<textarea
										name="description"
										value={formState.description}
										onChange={handleFormChange}
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Due Date
									</label>
									<input
										type="datetime-local"
										name="dueDate"
										value={formState.dueDate}
										onChange={handleFormChange}
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										Priority
									</label>
									<select
										name="priority"
										value={formState.priority}
										onChange={handleFormChange}
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
									>
										<option value="Low">Low</option>
										<option value="Medium">Medium</option>
										<option value="High">High</option>
									</select>
								</div>

								{formError && <p className="text-red-500 mb-2">{formError}</p>}

								<div className="flex justify-end space-x-3">
									<button
										type="button"
										onClick={handleCloseModal}
										className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
									>
										{editTask ? "Update" : "Add"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</Modal>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex justify-between items-center mb-6">
						<h1 className="text-2xl font-bold text-purple-700">All Tasks</h1>
						<select
							className="border border-purple-700 rounded p-2"
							value={activeTab}
							onChange={(e) => setActiveTab(e.target.value)}
						>
							<option value="All">All Tasks</option>
							<option value="Completed">Completed</option>
							<option value="Not Completed">Not Completed</option>
						</select>
					</div>

					{error && <p className="text-red-500 mb-4">{error}</p>}

					{filteredTasks.length === 0 ? (
						<p className="text-gray-500 text-center py-4">No tasks found.</p>
					) : (
						<>
							<div className="space-y-4">
								{currentTasks.map((task) => (
									<div
										key={task.id}
										className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
										style={{
											textDecoration: task.completed ? "line-through" : "none",
											opacity: task.completed ? 0.6 : 1,
										}}
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<input
													type="checkbox"
													checked={task.completed}
													onChange={() =>
														handleCheckbox(task.id, task.completed)
													}
													className="cursor-pointer transform scale-125"
												/>
												<h3 className="font-semibold text-lg text-purple-700">
													{task.taskName}
												</h3>
											</div>
											<span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
												{task.organizationName == "Unknown Organization"
													? "Self Task"
													: task.organizationName}
											</span>
										</div>

										<div className="flex gap-4 text-sm text-gray-500 mb-2">
											<div className="flex items-center gap-2">
												<CalendarTodayIcon className="text-purple-700" />
												<span>Due: {task.dueDate}</span>
											</div>
											<div className="flex items-center gap-2">
												<GroupIcon className="text-purple-700" />
												<span>
													Assigned to: {task.assignedMembers.join(", ")}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<PriorityHighIcon className="text-purple-700" />
												<span>Priority: {task.priority}</span>
											</div>
										</div>

										<p className="text-gray-600">{task.description}</p>
										{task.organizationId == "" && (
											<div className="flex gap-2 justify-end mt-2">
												<Button
													size="small"
													color="primary"
													onClick={() => handleOpenModal(task)}
													className="!bg-purple-600 !text-white !px-4 !py-1 !rounded hover:!bg-purple-700 transition-colors duration-200"
												>
													Edit
												</Button>
												<Button
													size="small"
													color="error"
													onClick={() => handleDeleteTask(task.id)}
													className="!bg-red-500 !text-white !px-4 !py-1 !rounded hover:!bg-red-600 transition-colors duration-200"
												>
													Delete
												</Button>
											</div>
										)}
									</div>
								))}
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex justify-center mt-6 space-x-2">
									<button
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
										className="px-3 py-1 rounded border border-purple-700 text-purple-700 disabled:opacity-50"
									>
										Previous
									</button>
									{[...Array(totalPages)].map((_, index) => (
										<button
											key={index + 1}
											onClick={() => handlePageChange(index + 1)}
											className={`px-3 py-1 rounded ${
												currentPage === index + 1
													? "bg-purple-700 text-white"
													: "border border-purple-700 text-purple-700"
											}`}
										>
											{index + 1}
										</button>
									))}
									<button
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={currentPage === totalPages}
										className="px-3 py-1 rounded border border-purple-700 text-purple-700 disabled:opacity-50"
									>
										Next
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</main>
		</div>
	);
};

export default MemberViewTasks;