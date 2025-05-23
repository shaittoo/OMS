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
  const [hasOrganizations, setHasOrganizations] = useState(false);

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
    <div
      className="grid lg:grid-cols-3 bg-white"
      style={{ gridTemplateColumns: "20% 40% 40%" }}
    >
      <div className="flex lg:col-start-1">
        <MemberSidebar />
      </div>
      <div className="lg:col-start-2 mt-8">
        <div className="welcome-message ml-auto" style={{ fontSize: "24px", fontFamily: "Arial", fontWeight: "bold" }}>
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

        <div className="mt-8">
          <div
          className=" text-black bg-gray-100 h-34 w-full rounded-lg shadow-lg">
          <MemTaskList />
        </div>
        </div>
        {/* <p
          className="my-2 text-right hover:text-purple-700"
          style={{ fontSize: "13px", fontFamily: "Arial" }}
        >
          {" "}
          View More
        </p> */}
      </div>
      <div className="lg:col-start-3 mt-8 ml-6">
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
  );
};

export default MemberDashboard;
