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
    <div className="min-h-screen bg-white">
      <MemberSidebar />
      <main className="ml-64 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* Main Content - Events */}
          <div className="w-full flex flex-col h-full">
            {/* Back to Dashboard Link */}
            <div className="py-2">
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
              <div className="max-h-[900px] overflow-y-auto hover:scrollbar-thin hover:scrollbar-thumb-gray-400 hover:scrollbar-track-gray-100 rounded transition-all duration-200">
                <MemberEventList organizationId={orgId as string} />
              </div>
            </div>
          </div>

          {/* Right Content - Calendar and Tasks */}
          <div className="w-full">
            {/* Calendar Section */}
            <div className="mt-16 mb-8">
              <Calendar organizationId={orgId as string} />
            </div>

            {/* Tasks Section */}
            <div className="mb-8">
              <MemTaskList organizationId={orgId as string} />
              <div className="mt-4 text-right">
                <Link href={`/memberviewtasks?orgId=${orgId}`}>
                  <p className="text-sm text-purple-700 hover:text-purple-900 cursor-pointer">
                    View More
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemberOrg;
