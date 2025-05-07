import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, doc, getDocs, query, updateDoc, where, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import { useRouter } from "next/router";

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

interface MemTaskListProps {
  organizationId?: string;
  showBackButton?: boolean; // Optional prop to show the Back button
}

const MemTaskList: React.FC<MemTaskListProps> = ({ organizationId, showBackButton = false }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");
  const router = useRouter(); // Initialize useRouter
  const [userOrganizations, setUserOrganizations] = useState<string[]>([]);
  const auth = getAuth();

  // Fetch user's organizations
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const membersRef = collection(db, "Members");
        const q = query(
          membersRef,
          where("uid", "==", user.uid),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(q);

        const orgIds: string[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.organizationId) {
            orgIds.push(data.organizationId);
          }
        });

        setUserOrganizations(orgIds);
      } catch (error) {
        console.error("Error fetching user organizations:", error);
      }
    };

    fetchUserOrganizations();
  }, [auth]);

  useEffect(() => {
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
        let tasksQuery;
  
        if (organizationId) {
          tasksQuery = query(
            collection(db, "tasks"),
            where("organizationId", "==", organizationId),
            where("assignedMembers", "array-contains", user.uid)
          );
        } else if (userOrganizations.length > 0) {
          tasksQuery = query(
            collection(db, "tasks"),
            where("organizationId", "in", userOrganizations),
            where("assignedMembers", "array-contains", user.uid)
          );
        } else {
          setTasks([]);
          setLoading(false);
          return;
        }
  
        const tasksSnapshot = await getDocs(tasksQuery);
  
        const memTaskList = tasksSnapshot.docs.map(async (taskDoc) => {
          const data = taskDoc.data();
  
          // Fetch organization name if organizationId exists
          let organizationName = "Unknown Organization";
          if (data.organizationId) {
            try {
              const orgDocRef = doc(db, "Organizations", data.organizationId);
              const orgDoc = await getDoc(orgDocRef);
              if (orgDoc.exists()) {
                const orgData = orgDoc.data();
                organizationName = orgData.name || "Unknown Organization";
              }
            } catch (error) {
              console.error("Error fetching organization:", error);
            }
          }
  
          // Fetch full names of assigned members
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
            taskName: data.taskName || "Untitled Task",
            description: data.description || "",
            dueDate: data.dueDate ? new Date(data.dueDate.seconds * 1000).toLocaleString() : "No due date",
            priority: data.priority || "Medium",
            assignedMembers: memberNames, // Use full names instead of UIDs
            completed: data.completed || false,
            organizationId: data.organizationId || "",
            organizationName: organizationName,
          } as Task;
        });
  
        // Wait for all organization names and member names to be fetched
        const resolvedTasks = await Promise.all(memTaskList);
  
        // Sort tasks by due date
        resolvedTasks.sort((a, b) => {
          const dateA = a.dueDate === "No due date" ? new Date(0) : new Date(a.dueDate);
          const dateB = b.dueDate === "No due date" ? new Date(0) : new Date(b.dueDate);
          return dateA.getTime() - dateB.getTime();
        });
  
        setTasks(resolvedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Error fetching tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchTasks();
  }, [organizationId, userOrganizations, auth]);

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
      setError("Error updating task status");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "All") return true;
    if (activeTab === "Completed") return task.completed;
    if (activeTab === "Not Completed") return !task.completed;
    return true;
  });

  const noTasksMessage = () => {
    if (loading) return null;
    if (error) return null;
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
      className=""
      style={{
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div className="header flex justify-between items-center mb-4" style={{ position: "relative" }}>
        <div className="flex items-center">
          {/* Conditionally render the Back Button */}
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

        {/* Filter Dropdown */}
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
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="task-item bg-white p-3 rounded shadow-md transition-shadow duration-200 hover:shadow-lg hover:shadow-purple-300"
              style={{
                wordWrap: "break-word",
                textDecoration: task.completed ? "line-through" : "none",
                opacity: task.completed ? 0.6 : 1,
              }}
            >
              {/* Task Name, Checkbox, and Organization */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleCheckbox(task.id, task.completed)}
                    className="cursor-pointer transform scale-125"
                  />
                  <h3 className="font-semibold text-md text-purple-700">{task.taskName}</h3>
                </div>
                {!organizationId && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {task.organizationName}
                  </span>
                )}
              </div>

              {/* Due Date, Assigned Members, and Priority */}
              <div className="flex gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CalendarTodayIcon className="text-purple-700" />
                  <span>Due: {task.dueDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GroupIcon className="text-purple-700" />
                  <span>
                    Assigned to:{" "}
                    {task.assignedMembers.length > 0
                      ? task.assignedMembers.join(", ")
                      : "No members assigned"}
                  </span>
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