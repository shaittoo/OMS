import React, { useEffect, useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import OfficerSidebar from "../components/officersidebar";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";

interface Member {
  uid: string;
  fullName: string;
  course: string;
  yearLevel: string;
  contact: string;
  email: string;
  joinedAt: string;
}

const Header: React.FC = () => {
  const handleRedirect = () => {
    window.location.href = "/acceptmembers";
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">
          Organization's Approved Members
        </h1>
        <p className="text-lg text-gray-500">What would you like to do?</p>
      </div>
      <div className="flex items-center space-x-4 mt-4 md:mt-0">
        <button
          className="text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200"
          onClick={handleRedirect}
        >
          Pending Requests
        </button>
      </div>
    </div>
  );
};


const SearchAndFilter: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  return (
    <div className="relative flex items-center bg-white p-4 rounded-md mt-6 shadow-lg border border-gray-300 justify-center">
      <div className="relative flex-grow">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 text-gray-600 placeholder-gray-400 bg-white rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="Search..."
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <SearchIcon className="h-5 w-5" />
        </span>
      </div>
      <div className="ml-4 flex items-center space-x-4">
        <span className="text-gray-600 text-sm">Filter by:</span>
        {["All", "Members", "Officers", "Alumni"].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 border rounded-md text-sm font-medium ${
              activeFilter === filter
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => handleFilterClick(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

const MembersPageOfficerView: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);

  useEffect(() => {
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

          // Fetch member's additional details from the `Users` collection
          const userDoc = await getDoc(doc(db, "Users", memberId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          return {
            uid: memberId,
            fullName: userData.fullName || "Unknown",
            course: userData.course || "Unknown",
            yearLevel: userData.yearLevel || "Unknown",
            contact: userData.contact || "Unknown",
            email: userData.email || "Unknown",
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

    fetchApprovedMembers();
  }, [user]);

  return (
    <div className="flex">
      <OfficerSidebar />
      <div className="flex-grow p-6 bg-white">
        <Header />
        <SearchAndFilter />
        <div className="mt-6">
          {loading ? (

      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
          ) : (
            <table className="table-auto w-full rounded-lg overflow-hidden shadow-lg border border-gray-300 text-left">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="px-4 py-2">
                    <PersonIcon sx={{ color: "white" }} /> Name
                  </th>
                  <th className="px-4 py-2">
                    <SchoolIcon sx={{ color: "white" }} /> Course
                  </th>
                  <th className="px-4 py-2">
                    <CalendarTodayIcon sx={{ color: "white" }} /> Year Level
                  </th>
                  <th className="px-4 py-2">
                    <PhoneIcon sx={{ color: "white" }} /> Contact
                  </th>
                  <th className="px-4 py-2">
                    <EmailIcon sx={{ color: "white" }} /> Email
                  </th>
                  <th className="px-4 py-2">
                    <CalendarTodayIcon sx={{ color: "white" }} /> Joined At
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.length > 0 ? (
                  members.map((member) => (
                    <tr key={member.uid} className="even:bg-gray-50">
                      <td className="px-4 py-2">{member.fullName}</td>
                      <td className="px-4 py-2">{member.course}</td>
                      <td className="px-4 py-2">{member.yearLevel}</td>
                      <td className="px-4 py-2">{member.contact}</td>
                      <td className="px-4 py-2">{member.email}</td>
                      <td className="px-4 py-2">{member.joinedAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-4">
                      No approved members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPageOfficerView;