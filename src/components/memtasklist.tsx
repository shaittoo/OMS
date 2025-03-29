import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

interface Task {
  id: string;
  taskName: string;
  description: string;
  dueDate: string;
  priority: string;
  assignedOfficer: string;
}

const MemTaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("You must be logged in to view tasks.");
        setLoading(false);
        return;
      }

      try {
        const tasksQuery = query(
          collection(db, "tasks"),
          where("memberId", "==", user.uid) // Assuming user.uid is used as memberId
        );
        const tasksSnapshot = await getDocs(tasksQuery);

        const memTaskList = tasksSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            taskName: data.taskName,
            description: data.description,
            dueDate: new Date(data.dueDate.seconds * 1000).toLocaleString(),
            priority: data.priority,
            assignedOfficer: data.assignedOfficer || "N/A",
          } as Task;
        });

        setTasks(memTaskList);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setError("Error fetching tasks: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div
      className="pending-tasks-container bg-gray-100 p-4 rounded w-full h-64 overflow-auto"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <h1 className="font-bold text-2xl text-purple-700 bg-gray-100 z-10">
        Assigned Tasks
      </h1>
      <hr className="border-purple-700 border-1" />
      <div className="task-list flex flex-col gap-2">
        {loading &&
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>}
        {error && <p className="text-gray-700">{error}</p>}
        {!loading && tasks.length === 0 && <p className="text-gray-700">No tasks assigned yet.</p>}
        {!loading && !error && tasks.map((task) => (
          <div
            key={task.id}
            className="task-item bg-gray-100 p-3 rounded shadow-md transition-shadow duration-200 hover:shadow-lg hover:shadow-purple-300"
            style={{
              wordWrap: "break-word",
            }}
          >
            {/* Task Name */}
            <h3 className="font-semibold text-md text-purple-700 mb-1">{task.taskName}</h3>

            {/* Due Date, Assigned Officer, and Priority */}
            <div className="flex gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CalendarTodayIcon className="text-purple-700" />
                <span>Due: {task.dueDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <GroupIcon className="text-purple-700" />
                <span>Assigned to: {task.assignedOfficer}</span>
              </div>
              <div className="flex items-center gap-2">
                <PriorityHighIcon className="text-purple-700" />
                <span>Priority: {task.priority}</span>
              </div>
            </div>

            {/* Task Description */}
            <p className="mt-2 text-gray-500 text-sm">{task.description}</p>

            {/* Purple Horizontal Line */}
            <hr className="mt-2 border-purple-700 border-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemTaskList;
