import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";

const FinalMembers: React.FC = () => {
  const [members, setMembers] = useState<
    Array<{ uid: string; fullName: string; joinedAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);

  // Fetch approved members for the logged-in user's organization
  const fetchApprovedMembers = async () => {
    try {
      if (!user) {
        alert("You must be logged in to view this page.");
        return;
      }

      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("email", "==", user.email));
      const userDocs = await getDocs(userQuery);

      if (userDocs.empty) {
        alert("You are not authorized to access this page.");
        return;
      }

      const userData = userDocs.docs[0]?.data();
      if (userData.role !== "organization") {
        alert("You are not authorized to access this page.");
        return;
      }

      const organizationId = userData.organizationId;

      // Fetch approved member requests
      const membersRef = collection(db, "Members");
      const approvedQuery = query(
        membersRef,
        where("organizationId", "==", organizationId),
        where("status", "==", "approved")
      );
      const querySnapshot = await getDocs(approvedQuery);

      // Map member details to display
      const memberPromises = querySnapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        const memberId = memberData.uid;

        // Fetch member's fullName from the `Users` collection
        const userDoc = await getDoc(doc(db, "Users", memberId));
        const fullName = userDoc.exists() ? userDoc.data().fullName || "Unknown" : "Unknown";

        return {
          uid: memberId,
          fullName,
          joinedAt: memberData.joinedAt || "N/A",
        };
      });

      const resolvedMembers = await Promise.all(memberPromises);
      setMembers(resolvedMembers);
    } catch (error) {
      console.error("Error fetching approved members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedMembers();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="final-members-container p-4">
      <h1 className="text-2xl font-semibold mb-4">Approved Members</h1>
      {members.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {members.map((member) => (
            <li key={member.uid} className="p-2 bg-gray-100 rounded flex justify-between items-center">
              <div>
                <p>
                  <strong>Name:</strong> {member.fullName || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Joined At:</strong> {member.joinedAt}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No approved members yet.</p>
      )}
    </div>
  );
};

export default FinalMembers;
