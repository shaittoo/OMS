import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, addDoc, doc, getDoc } from "firebase/firestore";
import CloseIcon from "@mui/icons-material/Close";
import { getAuth } from "firebase/auth";
import { createUserWithEmailAndPassword } from "firebase/auth";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

interface OfficerAddTaskProps {
  close: () => void; // Prop to handle form closure
}

interface Member {
  uid: string;
  fullName: string;
  email: string;
}

const OfficerAddTask: React.FC<OfficerAddTaskProps> = ({ close }) => {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("low");
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [approvedMembers, setApprovedMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Fetch approved members from Firestore
  useEffect(() => {
    const fetchApprovedMembers = async () => {
      try {
        // Fetch members with status 'approved' from the 'Members' collection
        const membersQuery = query(collection(db, "Members"), where("status", "==", "approved"));
        const membersSnapshot = await getDocs(membersQuery);

        // Create a Set to track unique member UIDs
        const uniqueMemberUids = new Set<string>();

        // For each approved member, fetch their fullName and email from the 'Users' collection
        const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          
          // Skip if we've already processed this member
          if (uniqueMemberUids.has(memberData.uid)) {
            return null;
          }
          uniqueMemberUids.add(memberData.uid);

          const userDoc = await getDoc(doc(db, "Users", memberData.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          return {
            uid: memberData.uid,
            fullName: userData?.fullName || "Unknown Member",
            email: userData?.email || "No email"
          };
        });

        // Resolve all promises and filter out null values
        const resolvedMembers = (await Promise.all(memberPromises)).filter(Boolean) as Member[];
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

  // Filter members based on search term
  const filteredMembers = approvedMembers.filter(member => 
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        organizationId,
        memberId: selectedMember.uid,
      });
      console.log("Task added successfully!");
      alert("Task added successfully!");
      close(); // Close the form upon successful submission
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[15.25%] top-[8%] z-50 shadow-md">
      <div className="bg-white p-6 rounded shadow-lg w-96 border-2 border-purple-500 relative">
        {/* Close Button */}
        <button
          onClick={close}
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

        <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Assign Member</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search member by name or email"
                className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredMembers.map((member) => (
                  <div
                    key={member.uid}
                    onClick={() => {
                      setAssignedOfficer(member.fullName);
                      setSearchTerm(member.fullName);
                      setShowDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-purple-100 cursor-pointer"
                  >
                    <div className="font-medium">{member.fullName}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
