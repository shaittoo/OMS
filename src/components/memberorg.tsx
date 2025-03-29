import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import MemberSidebar from "./membersidebar";
import Link from "next/link";
import MemTaskList from "./memtasklist";
import MemberEventList from "./membereventlist";
import Calendar from "./calendar";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const MemberOrg: React.FC = () => {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  // Handles user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Fetch user's first name from the Firestore 'members' collection
  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "Users", userId));
      const userData = userDoc.data();

      if (userData?.memberId) {
        const memberDoc = await getDoc(doc(db, "members", userData.memberId));
        const memberData = memberDoc.data();

        if (memberData) {
          setFirstName(memberData.firstName);
        }
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
        fetchUserData(user.uid);
      } else {
        setLoading(false);
      }
    });

    const interval = setInterval(() => {
      const current = new Date();
      setCurrentDateTime(current.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })); // Update every minute, remove seconds
    })

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="grid lg:grid-cols-3 bg-white"
      style={{ gridTemplateColumns: "20% 40% 40%" }}
    >
      {/* Sidebar */}
      <div className="flex lg:col-start-1">
        <MemberSidebar />
      </div>

      {/* Main Content */}
      <div className="lg:col-start-2 mt-4">
        {/* Back to Dashboard Link */}
        <div className="py-2">
          <Link
            href="/memberpage"
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            <ArrowBackIcon />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Welcome Message */}
        <div className="lg:col-start-2 ml-auto">
          <div className="welcome-message ml-auto">
            Welcome back, {firstName || "User"}!
          </div>
          <hr className="my-4 border-black" />
          <p className="text-sm font-light">
            Check out what's happening...
          </p>
          {/* Events Section */}
          <MemberEventList />
          <Link href="/memberviewevents">
          <p className="my-2 text-right hover:text-purple-700 text-sm font-light">
            View More
          </p></Link>

          {/* Actions */}
          <p className="pt-1 text-sm font-light">
            What else would you like to do?
          </p>
          <div className="flex py-4 gap-4">
            <Link href="/memberviewevents">
              <button className="officer-action-buttons">View Events</button>
            </Link>
            <button
              className="officer-action-buttons"
              onClick={() => (window.location.href = "/orglist")}
            >
              View Members
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-start-3 mt-8 ml-6">
        {/* Logout Button */}
        <button
          className="logout-button text-sm px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 absolute right-6 top-6"
          onClick={handleLogout}
        >
          Log Out
        </button>

        {/* Calendar */}
        <div className="mx-4 mt-16 h-60 max-w-lg">
          <Calendar />
        </div>

        {/* Current Date and Time */}
        <div className="mx-28 mt-56 text-black memberstats h-4 max-w-xs bg-gray-300 p-4 bg-white shadow-md">
          {currentDateTime}
        </div>

        {/* Pending Tasks */}
        <div className="ml-0 text-black pending-tasks max-w-full p-5 flex justify-start">
          <MemTaskList />
        </div>
        <p
          className="mx-16 my-2 text-right hover:text-purple-700 text-sm font-light"
        >
          View More
        </p>
      </div>
    </div>
  );
};

export default MemberOrg;
