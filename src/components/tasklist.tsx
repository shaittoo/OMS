import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";
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
  completed: boolean;
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All"); 
  

  useEffect(() => {
    const fetchUserTasks = async () => {
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

        // Fetch user document to get organizationId
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

        // Fetch tasks belonging to the organization
        const tasksRef = collection(db, "tasks");
        const tasksQuery = query(tasksRef, where("organizationId", "==", organizationId));
        const tasksSnapshot = await getDocs(tasksQuery);

        const taskList = tasksSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            taskName: data.taskName,
            description: data.description,
            dueDate: new Date(data.dueDate.seconds * 1000).toLocaleString(),
            priority: data.priority,
            assignedOfficer: data.assignedOfficer,
            completed: data.completed || false,
          } as Task;
        });

        setTasks(taskList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError("Error fetching tasks: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTasks();
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
      setError("error updating status for task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "All") return true;
    if (activeTab === "Completed") return task.completed;
    if (activeTab === "Not Completed") return !task.completed;
    return true;
  });

  const noTasksMessage = () => {
    if (activeTab === "Completed" && filteredTasks.length === 0) {
      return <p className="text-gray-700">No completed tasks yet.</p>;
    }
    if (activeTab === "Not Completed" && filteredTasks.length === 0) {
      return <p className="text-gray-700">All tasks completed.</p>;
    }
    if (activeTab === "All" && filteredTasks.length === 0) {
      return <p className="text-gray-700">No tasks assigned yet.</p>;
    }
  };

  return (
    <div
      className="pending-tasks-container bg-gray-100 p-4 rounded w-full h-64 overflow-auto"
      style={{
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
        <div className="header flex justify-between items-center mb-4" style={{ position: 'relative' }}>
        <h1 className="font-bold text-2xl text-purple-700 bg-gray-100 z-10">
          Assigned Tasks
        </h1>
 
        {/* Filter Dropdown */}
        <div
          className="filter-dropdown"
          style={{
            position: 'absolute',
            right: 0, 
            zIndex: 20,  
          }}
        >
          <select
            className="border border-purple-700 rounded p-2"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            style={{ padding: "8px", width: "auto" }}
          >
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Not Completed">Not Completed</option>
          </select>
        </div>
      </div>


      <hr className="border-purple-700 border-1" />
      <div className="task-list flex flex-col gap-2">
        {loading && 
                    <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>}
        {error && <p className="text-gray-700">{error}</p>}
        {noTasksMessage()}
        {!loading && filteredTasks.length === 0 && <p className="text-gray-700">No tasks available.</p>}
        {!loading && !error && filteredTasks.map((task) => (
          <div
            key={task.id}
            className="task-item bg-gray-100 p-3 rounded transition-shadow duration-200 hover:shadow-lg hover:shadow-purple-300"
            style={{
              wordWrap: "break-word",
              textDecoration: task.completed ? "line-through" : "none", //strike through
              opacity: task.completed ? 0.6 : 1
            }}
          >
            {/* Task Name and Checkbox */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleCheckbox(task.id, task.completed)}
                className="cursor-pointer transform scale-125"
              />
              <h3 className="font-semibold text-md text-purple-700">{task.taskName}</h3>
            </div>

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

export default TaskList;