import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import MemberSidebar from "./membersidebar";
import Link from 'next/link';
import MemTaskList from "./memtasklist"
import MemberEventList from "./membereventlist";
import Calendar from "./calendar";

const MemberDashboard: React.FC = () => {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasOrganizations, setHasOrganizations] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to fetch user's first name from the 'members' collection
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch the user's data from the 'Users' collection
      const userDoc = await getDoc(doc(db, "Users", userId));
      const userData = userDoc.data();

      // Ensure the user exists and has a memberId
      if (userData?.memberId) {
        // Fetch the user details from the 'members' collection using memberId
        const memberDoc = await getDoc(doc(db, "members", userData.memberId));
        const memberData = memberDoc.data();

        if (memberData) {
          // Set the first name from the 'members' collection
          setFirstName(memberData.firstName);
        }

        // Check if user has any approved organizations
        const membersRef = collection(db, "Members");
        const q = query(
          membersRef,
          where("uid", "==", userId),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(q);
        setHasOrganizations(!querySnapshot.empty);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        fetchUserData(user.uid); // Fetch user data when the user logs in
      } else {
        setLoading(false); // Handle user being logged out
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleOrgListRedirect = () => {
    window.location.href = "/orglist"; // Redirect to orglist.tsx
  };

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

      <div
        className="grid lg:grid-cols-3 bg-white"
        style={{ gridTemplateColumns: "20% 40% 40%" }}
      >
        <div className="flex lg:col-start-1">
          <MemberSidebar />
        </div>
        <div className="lg:col-start-2 mt-8">
          <div className="welcome-message ml-auto">
            Welcome back, {firstName || "User"}! {/* Display first name */}
          </div>
          <p style={{ fontSize: "16px", fontFamily: "Arial" }}>
            {" "}
            How are we doing today?
          </p>
          <hr className="my-4 border-black" />
          <div className="text-black rounded-lg shadow-lg bg-white relative">
            <div className="ml-6 py-6" style={{width: '90%'}}>
              <Calendar />
            </div>
          </div>

          <div className="mt-8 rounded-lg shadow-lg gap-2 p-4">
            <div
            className="pending-tasks-container w-full overflow-auto">
            <MemTaskList />
            </div>
          </div>
          <div className="text-right mt-2 mb-2">
            <p
              className="text-purple-700 underline text-sm hover:text-purple-800" style={{ fontSize: "16px", fontFamily: "Arial" }}
            >
              <Link href="/memviewtasks">
                View More
              </Link>
            </p>
          </div>
        </div>
        <div className="lg:col-start-3 mt-8 ml-6">
          <button 
            className="logout-button text-sm px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 absolute right-[1.5rem] top-[2rem]"
            onClick={() => setShowLogoutModal(true)}
          >
            Log Out
          </button>
          <p className="pt-7" style={{ fontSize: "16px", fontFamily: "Arial" }}>
            {" "}
            What else would you like to do?
          </p>
          <div className="flex py-4 gap-4 w-min">
            <button 
              className="officer-action-buttons flex-grow"
              onClick={handleOrgListRedirect}>
              {hasOrganizations ? "View All Orgs" : "Apply to Orgs"}
            </button>
            <Link href="/memberviewevents" >
            <button className="officer-action-buttons flex-grow">
              View All Events
            </button>
            </Link>
          </div>
          <p
            className="pt-2 pb-2"
            style={{ fontSize: "16px", fontFamily: "Arial" }}
          >
            {" "}
            Trending Events
          </p>
          <div style={{width: '90%'}}>
            <MemberEventList/>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberDashboard;
