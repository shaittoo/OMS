import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig"; // Import the firebase config
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

// Define the task type based on the fields in the tasks collection
type Task = {
  assignedOfficer: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
  taskName: string;
  organizationId: string; // Adding organizationId to tasks for easier filtering
};

const OfficerTasks: React.FC<{ userId: string }> = ({ userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]); // Store the tasks
  const [loading, setLoading] = useState<boolean>(true); // Loading state for tasks
  const [error, setError] = useState<string | null>(null); // Error state for handling fetch errors
  const [organizationId, setOrganizationId] = useState<string | null>(null); // Store the user's organizationId

  // Function to fetch the user's organizationId based on userId
  const fetchUserOrganization = async () => {
    try {
      const userDocRef = doc(db, "users", userId); // Reference to the user's document
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const orgId = userData?.organizationId; // Assuming the user's organizationId is stored here
        setOrganizationId(orgId);
      } else {
        console.error("User not found!");
      }
    } catch (error) {
      console.error("Error fetching user organization:", error);
      setError("Failed to load user organization. Please try again later.");
    }
  };

  // Function to fetch tasks for the current user and their organization
  const fetchTasks = async () => {
    if (!organizationId) return; // Don't fetch tasks if no organizationId is set
    try {
      // Query the tasks collection for tasks assigned to the current userId and their organizationId
      const tasksRef = collection(db, "tasks");
      const q = query(
        tasksRef,
        where("assignedOfficer", "==", userId), // Filter by userId (assigned officer)
        where("organizationId", "==", organizationId) // Filter by organizationId
      );
      const querySnapshot = await getDocs(q);

      // Store the fetched tasks
      const fetchedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTasks.push(doc.data() as Task); // Add task to the list
      });

      setTasks(fetchedTasks); // Set tasks to state
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks. Please try again later.");
    } finally {
      setLoading(false); // Set loading to false once data is fetched
    }
  };

  // Fetch the user's organizationId when the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      setLoading(true); // Set loading to true when fetching starts
      setError(null); // Reset error state
      fetchUserOrganization(); // Fetch the user's organizationId
    }
  }, [userId]); // Only fetch organization when userId changes

  // Fetch tasks once the organizationId is set
  useEffect(() => {
    if (organizationId) {
      fetchTasks(); // Fetch tasks for the given userId and organizationId
    }
  }, [organizationId]); // Only re-fetch tasks when organizationId changes

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Display error message if there was an issue fetching the tasks
  if (error) return <div className="error-message text-red-500">{error}</div>;

  return (
    <div className="tasks-container mt-6">
      <h2 className="text-2xl font-semibold mb-4">Assigned Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks available for this officer in your organization.</p>
      ) : (
        <div className="tasks-list space-y-4">
          {tasks.map((task, index) => (
            <div key={index} className="task-item p-4 border rounded shadow">
              <h3 className="text-xl font-bold">{task.taskName}</h3>
              <p className="text-gray-600">{task.description}</p>
              <p className="text-gray-500">Assigned Officer: {task.assignedOfficer}</p>
              <p className="text-gray-500">Due Date: {task.dueDate}</p>
              <p className="text-gray-500">Priority: {task.priority}</p>
              <p className="text-gray-500">Status: {task.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficerTasks;
