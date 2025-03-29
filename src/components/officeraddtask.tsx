import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, addDoc, doc, getDoc } from "firebase/firestore";
import CloseIcon from "@mui/icons-material/Close";
import { getAuth } from "firebase/auth";

interface OfficerAddTaskProps {
  close: () => void; // Prop to handle form closure
}

const OfficerAddTask: React.FC<OfficerAddTaskProps> = ({ close }) => {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("low");
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [approvedMembers, setApprovedMembers] = useState<Array<{ uid: string; fullName: string }>>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Fetch approved members from Firestore
  useEffect(() => {
    const fetchApprovedMembers = async () => {
      try {
        // Fetch members with status 'approved' from the 'Members' collection
        const membersQuery = query(collection(db, "Members"), where("status", "==", "approved"));
        const membersSnapshot = await getDocs(membersQuery);

        // For each approved member, fetch their fullName from the 'Users' collection
        const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          const userDoc = await getDoc(doc(db, "Users", memberData.uid));
          const fullName = userDoc.exists() ? userDoc.data()?.fullName || "Unknown Member" : "Unknown Member";

          return { uid: memberData.uid, fullName };
        });

        // Resolve all promises to get the list of approved members
        const resolvedMembers = await Promise.all(memberPromises);
        setApprovedMembers(resolvedMembers);
      } catch (error) {
        console.error("Error fetching approved members: ", error);
      }
    };

    // Fetch the logged-in user's organizationId
    const fetchUserOrganizationId = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setOrganizationId(userData?.organizationId || null);
          }
        } catch (error) {
          console.error("Error fetching user organizationId: ", error);
        }
      }
    };

    fetchApprovedMembers();
    fetchUserOrganizationId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      if (!organizationId) {
        alert("Organization ID not found for the logged-in user.");
        return;
      }
  
      // Find the selected officer's memberId (uid)
      const selectedMember = approvedMembers.find(
        (member) => member.fullName === assignedOfficer
      );
  
      if (!selectedMember) {
        alert("No member selected.");
        return;
      }
  
      // Add the task to Firestore
      await addDoc(collection(db, "tasks"), {
        taskName,
        description,
        dueDate: new Date(dueDate),
        priority,
        assignedOfficer,
        organizationId, // Include organizationId
        memberId: selectedMember.uid, // Add memberId (uid)
      });
      console.log("Task added successfully!");
      alert("Task added successfully!");
      close(); // Close the form upon successful submission
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  };
  

  return (
    <div
      className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[18%] z-50"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      <div
        className="bg-gray-100 p-8 rounded-lg w-full max-w-md shadow-xl relative"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        {/* Close Button */}
        <button
          onClick={close}
          className="absolute top-2 right-2 p-2 rounded-md hover:bg-gray-200 transition duration-200"
          style={{ backgroundColor: "#e8e8e8" }}
        >
          <CloseIcon className="h-5 w-5 text-[#8736EA]" />
        </button>

        <h2
          className="text-2xl font-semibold mb-4 text-center"
          style={{ color: "#333399" }}
        >
          Add New Task
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium"
              style={{ color: "#333399" }}
            >
              Task Name
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500"
              style={{ borderColor: "#cccccc" }}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              style={{ color: "#333399" }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500"
              style={{ borderColor: "#cccccc" }}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              style={{ color: "#333399" }}
            >
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500"
              style={{ borderColor: "#cccccc" }}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              style={{ color: "#333399" }}
            >
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500"
              style={{ borderColor: "#cccccc" }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              style={{ color: "#333399" }}
            >
              Assign Officer
            </label>
            <select
              value={assignedOfficer}
              onChange={(e) => setAssignedOfficer(e.target.value)}
              className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500"
              style={{ borderColor: "#cccccc" }}
              required
            >
              <option value="" disabled>
                Select a member
              </option>
              {approvedMembers.length > 0 ? (
                approvedMembers.map((member) => (
                  <option key={member.uid} value={member.fullName}>
                    {member.fullName}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No approved members found
                </option>
              )}
            </select>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full p-3 bg-purple-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white"
              style={{ backgroundColor: "#8736EA" }}
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfficerAddTask;
