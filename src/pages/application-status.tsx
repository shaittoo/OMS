import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Link from "next/link";
import MemberSidebar from "../components/membersidebar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const AppHeader: React.FC = () => (
  <div className="flex flex-col md:flex-col justify-between pb-4 border-b border-gray-200">
    <div className="py-2">
      <Link href="/orglist" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
        <ArrowBackIcon />
        <span>Back to Org List</span>
      </Link>
    </div>
  </div>
);

const ApplicationStatus: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        // Fetch the applications from the "Members" collection
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
            applicationsList.push({
              organizationId: memberData.organizationId,
              organizationName: organizationDoc.data().name,
              status: memberData.status, 
              photo: organizationDoc.data().photo || "/assets/default.jpg", 
            });
          }
        }

        setApplications(applicationsList);
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
        return "bg-red-400text-red-800";
      default:
        return "bg-gray-400 text-gray-800";
    }
  };

  //for capitilzation purposes only LOLOLOLOL
  const capitalizeStatus = (status: string) => {
    if (!status) return status; 
    return status.charAt(0).toUpperCase() + status.slice(1); 
  };

  return (
    <div className="flex min-h-screen">
      <MemberSidebar />
      <div className="flex-grow p-6 bg-white">
        <AppHeader />
        <div className="p-6">
          <div className="mt-1">
            <h2 className="text-2xl font-semibold">Your Application Status</h2>
            {loading && (
              <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            {!loading && applications.length === 0 && (
              <div className="text-center text-gray-600 mt-6">
                You haven't applied to any organizations.
              </div>
            )}
            <div className="space-y-4 mt-6">
              {applications.map((app) => (
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
                    <h3 className="text-lg font-medium text-gray-800">{app.organizationName}</h3>
                    <p className="text-sm text-gray-600">Status: 
                      <span className={`px-2 py-1 ml-1 rounded-sm ${getStatusColor(app.status)}`}>
                      {capitalizeStatus(app.status)} 
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
