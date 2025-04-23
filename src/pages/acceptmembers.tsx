import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import OfficerSidebar from "../components/officersidebar";

const AcceptMembers: React.FC = () => {
  const [members, setMembers] = useState<
    Array<{
      id: string;
      uid: string;
      fullName: string;
      joinedAt: string;
      status: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);

  // Modal states
  const [showRejectionReasonModal, setShowRejectionReasonModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDetails, setRejectionDetails] = useState("");
  const [customOtherReason, setCustomOtherReason] = useState("");


  const fetchPendingMembers = async () => {
    while (!user){
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for user to be defined
    }
    try {
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

      const membersRef = collection(db, "Members");
      const pendingQuery = query(
        membersRef,
        where("organizationId", "==", organizationId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(pendingQuery);

      const memberPromises = querySnapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        const memberId = memberData.uid;

        const userDoc = await getDoc(doc(db, "Users", memberId));
        const fullName = userDoc.exists()
          ? userDoc.data().fullName || "Unknown"
          : "Unknown";

        return {
          id: memberDoc.id,
          uid: memberId,
          fullName,
          joinedAt: memberData.joinedAt || "N/A",
          status: memberData.status || "pending",
        };
      });

      const resolvedMembers = await Promise.all(memberPromises);
      setMembers(resolvedMembers);
    } catch (error) {
      console.error("Error fetching pending members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMembers();
  }, [user]);

  const handleApproval = async (memberId: string, newStatus: "approved" | "rejected") => {
    try {
      const memberDocRef = doc(db, "Members", memberId);
      await updateDoc(memberDocRef,
         { status: newStatus,
          seenByUser: false //for notification purposes
          });

      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== memberId)
      );

      alert(`Member has been ${newStatus}.`);
    } catch (error) {
      console.error(`Error updating member status:`, error);
    }
  };

  const handleReject = (memberId: string) => {
    setSelectedMemberId(memberId);
    setShowRejectionReasonModal(true);
  };

  const handleRejectionReasonSubmit = async () => {
    try {
      const memberDocRef = doc(db, "Members", selectedMemberId);

      const updatedRejectionReason = rejectionReason === "other" && customOtherReason.trim() === "" 
      ? "Other"  
      : rejectionReason === "other"
      ? customOtherReason 
      : rejectionReason; 


      await updateDoc(memberDocRef, {
        status: "rejected",
        rejectionReason: updatedRejectionReason,
        rejectionDetails: rejectionDetails,
        seenByUser: false //for notification purposes
      });

      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== selectedMemberId)
      );

      setShowRejectionReasonModal(false);
      setRejectionReason("");
      setRejectionDetails("");
      alert("Member has been rejected.");
    } catch (error) {
      console.error(`Error rejecting member:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex">
      <OfficerSidebar />

      <div className="flex flex-col bg-[#F3E8FF] min-h-screen w-full bg-white ">
        <header className="bg-white p-7 text-black ">
          <h1 className="text-3xl font-bold">Manage Member Requests</h1>
        </header>

        <main className="p-6 flex flex-col gap-6">
          <section className="bg-white shadow rounded p-6">
            <h2 className="text-2xl font-semibold text-purple-700">Pending Members</h2>
            {members.filter((member) => member.status === "pending").length > 0 ? (
              <ul className="mt-4 space-y-4">
                {members
                  .filter((member) => member.status === "pending")
                  .map((member) => (
                    <li
                      key={member.id}
                      className="p-4 bg-purple-100 shadow rounded flex justify-between items-center"
                    >
                      <div>
                        <p className="text-black">
                          <strong>Name:</strong> {member.fullName || "N/A"}
                        </p>
                        <p className="text-black">
                          <strong>Joined At:</strong> {member.joinedAt}
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                          onClick={() => handleApproval(member.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                          onClick={() => handleReject(member.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-black mt-4">No pending member requests.</p>
            )}
          </section>
        </main>
      </div>

      {showRejectionReasonModal && (
        <div
          className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[15.25%] top-[8%] z-50 shadow-md"
        >
          <div className="bg-white p-6 rounded shadow-lg w-96 border-2 border-purple-500">
            <div className="bg-red-100 p-4 rounded-t">
              <h2 className="text-xl font-semibold text-red-600">
                Rejection Notice for{" "}
                {members.find((m) => m.id === selectedMemberId)?.fullName}
              </h2>
            </div>
            <div className="mt-4">
              <label
                htmlFor="rejectionReason"
                className="block text-sm font-medium text-gray-700"
              >
                Reason for Rejection:
              </label>
              <select
                id="rejectionReason"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 border-purple-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="low_grades">Low Grades</option>
                <option value="incomplete_documents">
                  Incomplete Documents
                </option>
                <option value="bad_moral_record">Bad Moral Record</option>
                <option value="lack_of_commitment">Lack of Commitment</option>
                <option value="disciplinary_action">Disciplinary Action</option>
                <option value="attendance_issues">Attendance Issues</option>
                <option value="failed_interview">Failed Interview</option>
                <option value="not_meet_requirements">
                  Does Not Meet Requirements
                </option>
                <option value="other">Other</option>
              </select>

              {rejectionReason === "other" && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700">
                  Specify Other Reason:
                </label>
                <textarea
                  className="w-full border-purple-500 rounded p-2"
                  placeholder="Please specify the reason..."
                  value={customOtherReason}
                  onChange={(e) => setCustomOtherReason(e.target.value)}
                />
              </div>
            )}

              <label
                htmlFor="rejectionDetails"
                className="block text-sm font-medium text-gray-700 mt-4"
              >
                More Details About Rejection:
              </label>
              <textarea
                id="rejectionDetails"
                className="mt-1 block w-full border-purple-500 border-2 rounded p-2"
                placeholder="Enter more details about the rejection (optional)"
                value={rejectionDetails}
                onChange={(e) => setRejectionDetails(e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="mr-4 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowRejectionReasonModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                onClick={handleRejectionReasonSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptMembers;
