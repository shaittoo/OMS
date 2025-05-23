import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
	doc,
	getDoc,
	collection,
	getDocs,
	query,
	where,
	updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import Link from "next/link";
import { useRouter } from "next/router";

interface Task {
	id: string;
	taskName: string;
	description: string;
	dueDate: string;
	priority: string;
	assignedMembers: string[];
	completed: boolean;
}

interface TaskListProps {
	showBackButton?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ showBackButton = false }) => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<string>("All");
	const [displayedTasks, setDisplayedTasks] = useState<Task[]>([]);
	const router = useRouter();

	useEffect(() => {
		const fetchOrganizationTasks = async () => {
			setLoading(true);
			setError(null);

			try {
				const auth = getAuth();
				const user = auth.currentUser;

				if (!user) {
					setError("You must be logged in to view tasks.");
					setLoading(false);
					return;
				}

				const userDocRef = doc(db, "Users", user.uid);
				const userDoc = await getDoc(userDocRef);

				if (!userDoc.exists()) {
					setError("User not found.");
					setLoading(false);
					return;
				}

				const userData = userDoc.data();
				const organizationId = userData?.organizationId;

				if (!organizationId) {
					setError("Organization ID not found for the user.");
					setLoading(false);
					return;
				}

				const tasksRef = collection(db, "tasks");
				const tasksQuery = query(
					tasksRef,
					where("organizationId", "==", organizationId)
				);

				const tasksSnapshot = await getDocs(tasksQuery);

				const taskList = await Promise.all(
					tasksSnapshot.docs.map(async (taskDoc) => {
						const data = taskDoc.data();

						const memberNames = await Promise.all(
							(data.assignedMembers || []).map(async (uid: string) => {
								try {
									const userDocRef = doc(db, "Users", uid);
									const userDoc = await getDoc(userDocRef);
									if (userDoc.exists()) {
										const userData = userDoc.data();
										return userData.fullName || "Unknown Member";
									}
								} catch (error) {
									console.error("Error fetching member details:", error);
								}
								return "Unknown Member";
							})
						);

						return {
							id: taskDoc.id,
							taskName: data.taskName,
							description: data.description,
							dueDate: data.dueDate
								? new Date(data.dueDate.seconds * 1000).toLocaleString()
								: "No due date",
							priority: data.priority,
							assignedMembers: memberNames,
							completed: data.completed || false,
						} as Task;
					})
				);

				setTasks(taskList);
				setDisplayedTasks(taskList.slice(0, 4)); // Display only the first 4 tasks
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "An unknown error occurred.";
				setError("Error fetching tasks: " + errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchOrganizationTasks();
	}, []);

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

	useEffect(() => {
		const filteredTasks = tasks.filter((task) => {
			if (activeTab === "All") return true;
			if (activeTab === "Completed") return task.completed;
			if (activeTab === "Not Completed") return !task.completed;
			return true;
		});
		setDisplayedTasks(filteredTasks.slice(0, 4)); // Display only the first 4 tasks
	}, [activeTab, tasks]);

	const noTasksMessage = () => {
		if (loading) return null;
		if (error) return null;
		if (activeTab === "Completed" && tasks.length === 0) {
			return <p className="text-gray-700">No completed tasks yet.</p>;
		}
		if (activeTab === "Not Completed" && tasks.length === 0) {
			return <p className="text-gray-700">All tasks completed.</p>;
		}
		if (activeTab === "All" && tasks.length === 0) {
			return (
				<p className="text-gray-700">
					No tasks available for this organization.
				</p>
			);
		}
	};

	return (
		<div
			className={`pending-tasks-container bg-white rounded-lg shadow-lg p-4 w-full mb-12`}
			style={{
				maxWidth: "100%",
				display: "flex",
				flexDirection: "column",
				gap: "8px",
			}}
		>
			<div
				className="header flex justify-between items-center mb-4"
				style={{ position: "relative" }}
			>
				<div className="flex items-center">
					{showBackButton && (
						<button
							onClick={() => router.back()}
							className="mr-4 text-purple-700 hover:text-purple-900 font-bold"
						>
							&#8592;
						</button>
					)}
					<h1 className="font-bold text-2xl text-purple-700 z-10">
						Assigned Tasks
					</h1>
				</div>
				<div className="filter-dropdown">
					<select
						className="border border-purple-700 rounded p-2"
						value={activeTab}
						onChange={(e) => setActiveTab(e.target.value)}
					>
						<option value="All">All</option>
						<option value="Completed">Completed</option>
						<option value="Not Completed">Not Completed</option>
					</select>
				</div>
			</div>

			<hr className="border-purple-700 border-1" />
			<div className="task-list flex flex-col gap-2">
				{loading && (
					<div className="flex justify-center items-center py-4">
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
					</div>
				)}
				{error && <p className="text-red-500">{error}</p>}
				{noTasksMessage()}
				{!loading &&
					!error &&
					displayedTasks.map((task) => (
						<div
							key={task.id}
							className={`task-item bg-white p-4 rounded shadow-md transition-shadow duration-200 hover:shadow-lg hover:shadow-purple-300`}
							style={{
								wordWrap: "break-word",
								textDecoration: task.completed ? "line-through" : "none",
								opacity: task.completed ? 0.6 : 1,
							}}
						>
							{/* Task Name, Checkbox */}
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={task.completed}
										onChange={() => handleCheckbox(task.id, task.completed)}
										className="cursor-pointer transform scale-125"
									/>
									<h3 className="font-semibold text-md text-purple-700">
										{task.taskName}
									</h3>
								</div>
								<span
									className={`text-xs font-semibold px-2 py-1 rounded ${
										(task.priority || "").toLowerCase() === "high"
											? "bg-red-100 text-red-600"
											: (task.priority || "").toLowerCase() === "medium"
												? "bg-yellow-100 text-yellow-700"
												: "bg-green-100 text-green-700"
									}`}
								>
									{task.priority}
								</span>
							</div>

							{/* Due Date and Assigned Members */}
							<div className="flex flex-wrap items-center gap-2 text-gray-500 text-sm mb-3">
								<div className="flex items-center gap-1">
									<CalendarTodayIcon
										className="text-purple-700"
										style={{ fontSize: 18 }}
									/>
									<span>Due: {task.dueDate}</span>
								</div>
								<span className="mx-1">|</span>
								<div className="flex items-center gap-1">
									<GroupIcon
										className="text-purple-700"
										style={{ fontSize: 18 }}
									/>
									<span>
										Assigned to:{" "}
										{task.assignedMembers.length > 0
											? task.assignedMembers.join(", ")
											: "No members assigned"}
									</span>
								</div>
							</div>

							{/* Task Description */}
							<p className="mt-2 text-gray-500 text-sm">{task.description}</p>

							{/* Purple Horizontal Line */}
							<hr className="mt-2 border-purple-700 border-2" />
						</div>
					))}
			</div>
			{/* View More Link */}
			{tasks.length > 4 && (
				<div className="mt-4 text-right">
					<Link href="/orgviewtasks">
						<p className="text-sm text-purple-700 hover:text-purple-900 cursor-pointer">
							View More
						</p>
					</Link>
				</div>
			)}
		</div>
	);
};

export default TaskList;
