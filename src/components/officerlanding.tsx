import React, { useEffect, useState } from "react";
import OfficerAddTask from "../components/officeraddtask"; // Import the OfficerAddTask component
import OfficerAddEvent from "./officeraddevent";
import OfficerSidebar from "./officersidebar";
import { auth, db } from "../firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
//import OfficerTasksListPage from "../pages/officertaskspage";
import Link from 'next/link';
import TaskList from './tasklist';
import Calendar from "./calendar";

const OfficerDashboard: React.FC = () => {
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [isAddEventOpen, setAddEventOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [organizationData, setOrganizationData] = useState<{
    organizationName: string;
    organizationLogo: string;
    organizationDescription: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvedMemberCount, setApprovedMemberCount] = useState<number>(0);
  const [completedEventCount, setCompletedEventCount] = useState<number>(0);

  // Open/close the add task form
  const handleAddTaskClick = () => setAddTaskOpen(true);
  const handleCloseTaskForm = () => setAddTaskOpen(false);

  // Open/close the event task form
  const handleAddEventClick = () => setAddEventOpen(true);
  const handleCloseEventForm = () => setAddEventOpen(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to fetch organization data
  const fetchOrganizationData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "Users", userId));
      const userData = userDoc.data();

      // Ensure that user is part of an organization
      if (userData?.organizationId) {
        const orgDoc = await getDoc(doc(db, "Organizations", userData.organizationId));
        const orgData = orgDoc.data();

        if (orgData) {
          setOrganizationData({
            organizationName: orgData.name || "No Name",
            organizationLogo: orgData.photo || "",
            organizationDescription: orgData.description || "No description available.",
          });

          // Fetch approved members for this organization
          fetchApprovedMembers(userData.organizationId);
          fetchCompletedEvents(userData.organizationId)
        }
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch approved members count
  const fetchApprovedMembers = async (organizationId: string) => {
    try {
      const membersQuery = query(
        collection(db, "Members"),
        where("organizationId", "==", organizationId),
        where("status", "==", "approved")
      );
      const memberSnapshot = await getDocs(membersQuery);
      setApprovedMemberCount(memberSnapshot.size); // Set the count
    } catch (error) {
      console.error("Error fetching approved members:", error);
    }
  };

  const fetchCompletedEvents = async (organizationId: string) => {
    try {
      const eventsQuery = query(
        collection(db, "events"),
        where("organizationId", "==", organizationId),
        where("status", "==", "Upcoming") // Assuming the status for completed events is 'completed'
      );
      const eventSnapshot = await getDocs(eventsQuery);
      setCompletedEventCount(eventSnapshot.size); // Set the count after fetching the events
    } catch (error) {
      console.error("Error fetching completed events:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        fetchOrganizationData(user.uid); // Fetch organization data when the user logs in
      } else {
        setLoading(false); // Handle user being logged out
      }
    });

    return () => unsubscribe();
  }, []); 

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
    // Calendar Logic
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
  
    const firstDay = (new Date(currentYear, currentMonth)).getDay();
    const daysInMonth = 32 - new Date(currentYear, currentMonth, 32).getDate();
  
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }
  
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

  return (
    <>
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Log out of your account?</h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        <div className="sticky left-0 top-0 h-screen overflow-y-auto shadow-md">
        {/* Sidebar */}
        <OfficerSidebar /></div> 
        {/* Main content */}
        <main className="main-content flex-grow p-6 relative bg-white">
          <header className="header mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {organizationData?.organizationName || "Your Organization"}!
              </h1>
              <p className="text-gray-600">What would you like to do?</p>
            </div>
            <button
              className="logout-button text-sm px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 absolute right-[1.5rem] top-[2rem]"
              onClick={() => setShowLogoutModal(true)}
            >
              Log Out
            </button>
          </header>

          {/* Officer Action Buttons */}
          <div className="flex gap-4 mb-6 w-full">
            <button className="officer-action-buttons flex-grow" onClick={handleAddTaskClick}>
              Add Task
            </button>
            <button className="officer-action-buttons flex-grow" onClick={handleAddEventClick}>
              Add Event
            </button>
            <Link href="/viewOfficers">
            <button className="officer-action-buttons flex-grow">View Officers</button>
            </Link>
            <Link href="/userevents">
               <button className="officer-action-buttons flex-grow">View My Events</button>
            </Link>
           
          </div>

          {/* Add Task Form */}
          {isAddTaskOpen && <OfficerAddTask close={handleCloseTaskForm} />}

          {/* Add Event Form */}
          {isAddEventOpen && <OfficerAddEvent close={handleCloseEventForm} />}

          {/* Organization Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <div className="org-overview flex flex-col gap-0">
              <div className="org-logo-container flex items-center gap-3 bg-transparent">
                {organizationData?.organizationLogo ? (
                  <img
                    src={organizationData.organizationLogo}
                    alt="Organization Logo"
                    className="org-logo-img w-36 h-36 rounded-full object-cover shadow"
                  />
                ) : (
                  <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center shadow">
                    <span className="text-gray-400">No Logo</span>
                  </div>
                )}
              </div>

              <div className="absolute left ml-52 my-5">
                <h2 className="text-xl font-semibold">
                  {organizationData?.organizationName || "Organization Name"}
                </h2>
                <p className="text-gray-600 text-justify">
                  {organizationData?.organizationDescription || "No description available."}
                </p>
              </div>
              
              <div className="text-black rounded-lg shadow-lg pending-tasks bg-gray-100 col-span-2 p-4 flex flex-col gap-2" style={{ height: "305px" }}>
                <div className="pending-tasks-container bg-gray-100 p-4 rounded w-full h-64 overflow-auto">
                  <TaskList />
                </div>
                <div className="flex justify-end">
                  <Link href="/orgviewtasks">
                    <p className="text-purple-700 underline text-sm hover:text-purple-800" style={{ fontSize: "16px", fontFamily: "Arial" }}>
                      View More
                    </p>
                  </Link>
                </div>
              </div>
            </div>
            <div className="text-black relative flex flex-col w-full justify-end">
              <div className="-mt-6 text-black calendar h-96 bg-white self-end">
                <div className="calendar-container -mr-4 p-6 rounded-lg shadow-md bg-white self-end transition-shadow duration-200 hover:shadow-lg hover:shadow-purple-300">
                  <div className="calendar-header text-purple-700 font-bold">
                    <h3 className="text-lg">{monthNames[currentMonth]} {currentYear}</h3>
                  </div>
                  <div className="calendar-grid grid grid-cols-7 gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-purple-600 font-medium">
                        {day}
                      </div>
                    ))}

                    {daysArray.map((day, index) => (
                      <div key={index} className={`text-center h-10 border border-purple-300 rounded-md flex flex-col justify-center items-center relative ${day === date.getDate() ? 'bg-purple-300' : ''}`}>
                        <span className="text-lg">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            {/* <div className="text-black relative flex flex-col gap-4 w-full justify-end">
              <div className="ml-72 h-auto w-auto max-w-xs">
                <Calendar />
              </div> */}
              <div className="memberstats -mt-2 text-purple-700 h-16 w-full max-w-xs bg-gray-100 p-4 self-end flex items-center rounded-lg shadow-md justify-center transition-shadow duration-200 hover:shadow-lg hover:shadow-purple-300">
                <span className="text-lg font-semibold">
                  {approvedMemberCount} total members
                </span>
              </div>
              <div className="eventstats text-purple-700  h-16 w-full max-w-xs bg-gray-100 p-4 self-end rounded-lg shadow-md transition-shadow duration-200 hover:shadow-lg hover:shadow-purple-300">
                <span className="text-lg font-semibold">
                  {completedEventCount} events this year
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default OfficerDashboard;


