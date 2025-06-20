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
import MemberSidebar from "../components/membersidebar";
import Link from "next/link";

interface Task {
  id: string;
  taskName: string;
  description: string;
  dueDate: string;
  priority: string;
  assignedMembers: string[];
  completed: boolean;
}

const MemberOwnTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [displayedTasks, setDisplayedTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const tasksPerPage = 4;


  useEffect(() => {
    const fetchMemberTasks = async () => {
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

        // Fetch tasks where the current user is assigned
        const tasksRef = collection(db, "tasks");
        const tasksQuery = query(
          tasksRef,
          where("assignedMembers", "array-contains", user.uid)
        );

        const tasksSnapshot = await getDocs(tasksQuery);

        const taskList = await Promise.all(
          tasksSnapshot.docs.map(async (taskDoc) => {
            const data = taskDoc.data();

            // Fetch member names for assignedMembers
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

    fetchMemberTasks();
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

    const startIdx = (currentPage - 1) * tasksPerPage;
    const endIdx = startIdx + tasksPerPage;

    setDisplayedTasks(filteredTasks.slice(startIdx, endIdx));
    }, [activeTab, tasks, currentPage]);

    const filteredTasks = tasks.filter((task) => {
        if (activeTab === "All") return true;
        if (activeTab === "Completed") return task.completed;
        if (activeTab === "Not Completed") return !task.completed;
        return true;
        });
        const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);


  const noTasksMessage = () => {
    if (loading) return null;
    if (error) return null;
    if (activeTab === "Completed" && displayedTasks.length === 0) {
      return <p className="text-gray-700">No completed tasks yet.</p>;
    }
    if (activeTab === "Not Completed" && displayedTasks.length === 0) {
      return <p className="text-gray-700">All tasks completed.</p>;
    }
    if (activeTab === "All" && displayedTasks.length === 0) {
      return (
        <p className="text-gray-700">
          No tasks assigned to you.
        </p>
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-64 flex-shrink-0">
        <MemberSidebar />
      </div>
      <main className="flex-grow p-8">
        {/* Header and filter */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-bold text-2xl text-black-700 z-10">My Tasks</h1>
          <div>
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

        {/* Task List */}
        <div className="task-list flex flex-col gap-2 mt-4">
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
                <hr className="mt-2 border-purple-700 border-2" />
              </div>
            ))}
        </div>

        {/* View More Link */}
        {!loading && !error && totalPages > 1 && (
            <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
                {/* Previous Button */}
                <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-1 border rounded-md font-semibold transition ${
                    currentPage === 1
                    ? "text-purple-300 border-purple-300 cursor-not-allowed"
                    : "text-purple-700 border-purple-700 hover:bg-purple-50"
                }`}
                >
                Previous
                </button>

                {/* Leading Ellipsis if needed */}
                {currentPage > 2 && totalPages > 3 && (
                <>
                    <button
                    onClick={() => setCurrentPage(1)}
                    className={`w-9 h-9 text-sm font-medium rounded-md text-purple-700 border border-purple-700 bg-white hover:bg-purple-50`}
                    >
                    1
                    </button>
                    <span className="text-purple-500 font-semibold px-1">...</span>
                </>
                )}

                {/* Dynamic Page Buttons */}
                {Array.from({ length: 3 }, (_, i) => {
                const startPage = Math.min(
                    Math.max(currentPage - 1, 1),
                    totalPages - 2
                );
                const pageNumber = startPage + i;

                if (pageNumber > totalPages) return null;

                return (
                    <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-9 h-9 text-sm font-medium rounded-md transition ${
                        pageNumber === currentPage
                        ? "bg-purple-700 text-white border-2 border-blue-300"
                        : "text-purple-700 border border-purple-700 bg-white hover:bg-purple-50"
                    }`}
                    >
                    {pageNumber}
                    </button>
                );
                })}

                {/* Trailing Ellipsis if needed */}
                {currentPage < totalPages - 1 && totalPages > 3 && (
                <>
                    <span className="text-purple-500 font-semibold px-1">...</span>
                    <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-9 h-9 text-sm font-medium rounded-md text-purple-700 border border-purple-700 bg-white hover:bg-purple-50`}
                    >
                    {totalPages}
                    </button>
                </>
                )}

                {/* Next Button */}
                <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-1 border rounded-md font-semibold transition ${
                    currentPage === totalPages
                    ? "text-purple-300 border-purple-300 cursor-not-allowed"
                    : "text-purple-700 border-purple-700 hover:bg-purple-50"
                }`}
                >
                Next
                </button>
            </div>
        )}
      </main>
    </div>
  );
};

export default MemberOwnTasks;