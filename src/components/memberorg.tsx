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
import { useRouter } from "next/router";

const MemberOrg: React.FC = () => {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const router = useRouter();
  const { orgId } = router.query;

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

  // Fetch organization data if orgId is provided
  const fetchOrganizationData = async (orgId: string) => {
    try {
      const orgDoc = await getDoc(doc(db, "Organizations", orgId));
      if (orgDoc.exists()) {
        setOrganizationData(orgDoc.data());
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
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
      setCurrentDateTime(
        current.toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      ); // Update every minute, remove seconds
    });

    return () => unsubscribe();
  }, []);

  // Fetch organization data when orgId changes
  useEffect(() => {
    if (orgId && typeof orgId === 'string') {
      fetchOrganizationData(orgId);
    }
  }, [orgId]);

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
      <div className="flex lg:col-start-1 h-auto">
        <MemberSidebar />
      </div>

      {/* Main Content - Events */}
      <div className="lg:col-start-2 mt-4 px-6">
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

        {/* Organization Header */}
        {organizationData && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{organizationData.name}</h1>
            <p className="text-gray-600">{organizationData.description}</p>
          </div>
        )}

        {/* Events Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Events</h2>
          <MemberEventList organizationId={orgId as string} />
        </div>
      </div>

      {/* Right Content - Calendar and Tasks */}
      <div className="lg:col-start-3 mt-4 px-6">
        {/* Logout Button */}
        <button
          className="logout-button text-sm px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 absolute right-6 top-6"
          onClick={handleLogout}
        >
          Log Out
        </button>

        {/* Calendar Section */}
        <div className="mt-16 mb-8">
          <Calendar organizationId={orgId as string} />
        </div>

        {/* Tasks Section */}
        <div className="mb-8">
          <MemTaskList organizationId={orgId as string} />
        </div>
        
        <Link href="./memberviewtasks">
          <p className="mx-16 my-2 text-right hover:text-purple-700 text-sm font-light">
            View More
          </p>
        </Link>
      </div>
    </div>
  );
};

export default MemberOrg;
