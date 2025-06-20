import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Link from "next/link";
import MemberSidebar from "../components/membersidebar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { writeBatch } from "firebase/firestore";

const markAllAsSeen = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "Members"),
    where("uid", "==", user.uid),
    where("status", "in", ["approved", "rejected"]),
    where("seenByUser", "==", false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.forEach(docSnap => {
    batch.update(doc(db, "Members", docSnap.id), { seenByUser: true });
  });

  await batch.commit();
};

const rejectionReasons = {
  low_grades: "Low Grades",
  incomplete_documents: "Incomplete Documents",
  bad_moral_record: "Bad Moral Record",
  lack_of_commitment: "Lack of Commitment",
  disciplinary_action: "Disciplinary Action",
  attendance_issues: "Attendance Issues",
  failed_interview: "Failed Interview",
  not_meet_requirements: "Does Not Meet Requirements",
  other: "Other",
};

const getRejectionReasonLabel = (reason: keyof typeof rejectionReasons) => {
  return rejectionReasons[reason] || "Unknown Reason"; 
};


const ApplicationStatus: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        alert("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const memberQuery = query(
          collection(db, "Members"),
          where("uid", "==", userId)
        );
        const querySnapshot = await getDocs(memberQuery);
        const applicationsList = [];

        for (const docSnapshot of querySnapshot.docs) {
          const memberData = docSnapshot.data();
          const organizationDoc = await getDoc(doc(db, "Organizations", memberData.organizationId));
          if (organizationDoc.exists()) {

            const rejectionReason = memberData.status === "rejected"
            ? (Object.prototype.hasOwnProperty.call(rejectionReasons, memberData.rejectionReason)
                ? rejectionReasons[memberData.rejectionReason as keyof typeof rejectionReasons]
                : memberData.rejectionReason)
            : null;
          

            const rejectionDetails = memberData.status === "rejected"
              ? memberData.rejectionDetails || ""
              : "";


              applicationsList.push({
                organizationId: memberData.organizationId,
                organizationName: organizationDoc.data().name,
                status: memberData.status,
                rejectionReason,
                rejectionDetails,
                photo: organizationDoc.data().photo || "/assets/default.jpg",
              });
              
          }
        }

        setApplications(applicationsList);

        await markAllAsSeen(); //call this for notification purposes
      } catch (error) {
        console.error("Error fetching application statuses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-400 text-yellow-800";
      case "approved":
        return "bg-green-400 text-green-800";
      case "rejected":
        return "bg-red-400 text-red-800";
      default:
        return "bg-gray-400 text-gray-800";
    }
  };

  //for capitilzation purposes only LOLOLOLOL
  const capitalizeStatus = (status: string) => {
    if (!status) return status; 
    return status.charAt(0).toUpperCase() + status.slice(1); 
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-white">
      <MemberSidebar />
      <main className="ml-64 p-4">
        <div className="p-4">
          <div className="mt-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Application Status</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${statusFilter === "all" 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${statusFilter === "pending" 
                    ? "bg-yellow-400 text-yellow-800" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${statusFilter === "approved" 
                    ? "bg-green-400 text-green-800" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter("rejected")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${statusFilter === "rejected" 
                    ? "bg-red-400 text-red-800" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Rejected
              </button>
            </div>
          </div>

            {loading && (
              <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
           {!loading && applications.length === 0 && (
              <div className="text-center text-gray-600 mt-6">
                <p>You haven't applied to any organizations.</p>
                <Link href="/orglist">
                  <span className="text-blue-600 hover:underline mt-2 inline-block">View Organizations</span>
                </Link>
              </div>
            )}

            <div className="space-y-4 mt-6">
              {!loading && filteredApplications.length === 0 && (
                <div className="text-center text-gray-600 mt-6">
                  <p>{statusFilter === "all" 
                    ? "You haven't applied to any organizations." 
                    : `No ${statusFilter} applications found.`}</p>
                  {statusFilter === "all" && (
                    <Link href="/orglist">
                      <span className="text-blue-600 hover:underline mt-2 inline-block">
                        View Organizations
                      </span>
                    </Link>
                  )}
                </div>
              )}

              {filteredApplications.map((app) => (
                <div
                  key={app.organizationId}
                  className="flex items-center p-4 border rounded-md"
                >
                  <img
                    src={app.photo}
                    alt={app.organizationName}
                    className="w-16 h-16 rounded mr-4 object-cover"
                  />
                  <div className="flex-grow">
                  <h3 className="text-lg font-medium text-gray-800">
                    {app.organizationName}{" "}
                    <span className={`text-sm px-2 py-1 rounded-sm ${getStatusColor(app.status)}`}>
                      {capitalizeStatus(app.status)}
                    </span>
                  </h3>

                    <div className="flex items-center ">

                      {app.status === "rejected" && app.rejectionReason && (
                        <p className="text-xs text-red-600 whitespace-nowrap">
                        Reason: {app.rejectionReason}
                        </p>
                      )}

                    </div>

                    {app.status === "rejected" && app.rejectionDetails && (
                      <p className="text-xs italic text-gray-600">
                        More Details: {app.rejectionDetails}
                      </p>
                    )}
                    

                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationStatus;