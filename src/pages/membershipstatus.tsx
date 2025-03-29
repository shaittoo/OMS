import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDocs, collection, query, where, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import MemberSidebar from "../components/membersidebar"; // Import MemberSidebar
import { onAuthStateChanged } from "firebase/auth";

interface MembershipStatus {
  organizationId: string;
  organizationName?: string; // Will be fetched later
  status: "pending" | "approved" | "rejected" | null;
  rejectionReason?: string;
  rejectionDetails?: string;
}

const MembershipStatuses: React.FC = () => {
  const [user] = useAuthState(auth); // Retrieve the logged-in user
  const [membershipStatuses, setMembershipStatuses] = useState<MembershipStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserOrganizations = async (userId: string) => {
    try {
      const membersRef = collection(db, "Members");
      const q = query(
        membersRef,
        where("uid", "==", userId),
        where("status", "==", "rejected") // Fetch rejected memberships
      );
      const querySnapshot = await getDocs(q);

      const orgs: MembershipStatus[] = [];
      for (const docSnapshot of querySnapshot.docs) {
        const memberData = docSnapshot.data();
        const orgId = memberData.organizationId;

        const orgDocRef = doc(db, "Organizations", orgId);
        const orgDoc = await getDoc(orgDocRef);
        const orgData = orgDoc.data();

        if (orgData) {
          orgs.push({
            organizationId: orgId,
            status: "rejected", // Set the status to 'rejected'
            organizationName: orgData.name || "Unknown Organization",
            rejectionReason: memberData.rejectionReason || "No reason provided",
            rejectionDetails: memberData.rejectionDetails || "No details available",
          });
        }
      }

      setMembershipStatuses(orgs);
    } catch (error) {
      console.error("Error fetching rejected user organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserOrganizations(user.uid);
      } else {
        setMembershipStatuses([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const renderStatusMessages = () => {
    return membershipStatuses.map((membership, index) => (
      <div key={index} className="shadow-md rounded-md overflow-hidden mb-4">
        {membership.status === "rejected" && (
          <div className="p-4 rounded bg-red-100 text-red-800">
            <p>
              Your membership request for {membership.organizationName || "Unknown Organization"} has been rejected.
            </p>
            {membership.rejectionReason && (
              <p>
                <strong>Reason:</strong> {membership.rejectionReason}
              </p>
            )}
            {membership.rejectionDetails && (
              <p>
                <strong>Details:</strong> {membership.rejectionDetails}
              </p>
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex bg-white min-h-screen w-full">
      <MemberSidebar /> {/* Sidebar for navigation */}
      <div className="p-6 w-full bg-white">
        <h2 className="text-xl font-semibold text-purple-600 mb-4 bg-white">Rejected Memberships</h2>
        {loading ? (
          <div className="p-4 rounded bg-gray-100 text-gray-600">Loading...</div>
        ) : membershipStatuses.length > 0 ? (
          renderStatusMessages()
        ) : (
          <div className="p-4 rounded bg-gray-100 text-gray-600">
            You have no rejected membership statuses.
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipStatuses;
