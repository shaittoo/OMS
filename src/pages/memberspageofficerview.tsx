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
import WorkIcon from '@mui/icons-material/Work';

interface Member {
  uid: string;
  fullName: string;
  course: string;
  yearLevel: string;
  contactNumber: string;
  email: string;
  joinedAt: string;
  role: string; 
  position: string;
}

const Header: React.FC = () => {
  const handleRedirect = () => {
    window.location.href = "/acceptmembers";
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">Organization's Approved Members</h1>
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

const SearchAndFilter: React.FC<{
  onSearch: (searchTerm: string) => void;
  onRoleFilter: (role: string) => void;
  onYearFilter: (year: string) => void;
  onCourseFilter: (course: string) => void;
}> = ({ onSearch, onRoleFilter, onYearFilter, onCourseFilter }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    onSearch(event.target.value);
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onRoleFilter(event.target.value);
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onYearFilter(event.target.value);
  };

  const handleCourseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onCourseFilter(event.target.value);
  };

  return (
    <div className="relative flex flex-col md:flex-row items-center bg-white p-4 rounded-md mt-6 shadow-lg border border-gray-300 justify-between">
      <div className="relative flex-grow mb-4 md:mb-0">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 text-gray-600 placeholder-gray-400 bg-white rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="Search..."
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <SearchIcon className="h-5 w-5" />
        </span>
      </div>
      <div className="flex flex-wrap items-center space-x-4">
        <div>
          <label className="text-gray-600 text-sm mr-2">Role:</label>
          <select
            onChange={handleRoleChange}
            className="px-4 py-2 border rounded-md text-sm bg-white text-gray-600"
          >
            <option value="All">All</option>
            <option value="Members">Members</option>
            <option value="Officers">Officers</option>
          </select>
        </div>
        <div>
          <label className="text-gray-600 text-sm mr-2">Year:</label>
          <select
            onChange={handleYearChange}
            className="px-4 py-2 border rounded-md text-sm bg-white text-gray-600"
          >
            <option value="All">All</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Nth Year">Nth Year</option>
          </select>
        </div>
        <div>
          <label className="text-gray-600 text-sm mr-2">Course:</label>
          <select
            onChange={handleCourseChange}
            className="px-4 py-2 border rounded-md text-sm bg-white text-gray-600"
          >
            <option value="All">All</option>
            <option value="BS in Accountancy (5 yrs)">BS Accountancy</option>
            <option value="BS in Business Administration (Marketing)">BS Business Administration (Marketing)</option>
            <option value="BS in Management">BS Management</option>
            <option value="BS in Applied Mathematics">BS Applied Mathematics</option>
            <option value="BS in Computer Science">BS Computer Science</option>

          </select>
        </div>
      </div>
    </div>
  );
};

const MembersPageOfficerView: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]); 
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [yearFilter, setYearFilter] = useState<string>("All");
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchApprovedMembers = async () => {
      try {
        if (!user) {
          alert("You must be logged in to view this page.");
          return;
        }
  
        // Get current user's document
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
  
        // Fetch officer UID mapping once
        let officerUids: Record<string, string> = {};
        const officerDoc = await getDoc(doc(db, "officers", organizationId));
        if (officerDoc.exists()) {
          officerUids = officerDoc.data() || {};
        }
  
        // Fetch approved members
        const membersRef = collection(db, "Members");
        const approvedQuery = query(
          membersRef,
          where("organizationId", "==", organizationId),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(approvedQuery);
  
        const memberPromises = querySnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          const memberId = memberData.uid;
  
          // Filter logic for Officers and Members
          if (roleFilter === "Officers" && !Object.values(officerUids).includes(memberId)) {
            return null; // Skip non-officers if "Officers" filter is selected
          }
          if (roleFilter === "Members" && Object.values(officerUids).includes(memberId)) {
            return null; // Skip officers if "Members" filter is selected
          }
  
          // Fetch full user data
          const userDoc = await getDoc(doc(db, "Users", memberId));
          const memberUserData = userDoc.exists() ? userDoc.data() : {};
  
          // Apply course and year filters
          if (courseFilter !== "All" && memberUserData.course !== courseFilter) {
            return null; // Skip members not matching the selected course
          }
          if (yearFilter !== "All" && memberUserData.yearLevel !== yearFilter) {
            return null; // Skip members not matching the selected year
          }
  
          // Determine position by matching UID
          let position = "Member";

          // 1. Check main officer positions
          for (const [key, value] of Object.entries(officerUids)) {
            if (value === memberId) {
              position = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (c) => c.toUpperCase());
              break;
            }
          }

          // 2. Check additional officers array
          if (officerDoc.exists()) {
            const officerData = officerDoc.data();
            if (Array.isArray(officerData.additionalOfficers)) {
              const found = officerData.additionalOfficers.find(
                (o: any) => o.name === memberId
              );
              if (found && found.position) {
                position = found.position;
              }
            }
          }
  
          return {
            uid: memberId,
            fullName: memberUserData.fullName || "Unknown",
            course: memberUserData.course || "Unknown",
            yearLevel: memberUserData.yearLevel || "Unknown",
            contactNumber: memberUserData.contactNumber || "Unknown",
            email: memberUserData.email || "Unknown",
            joinedAt: memberData.joinedAt || "N/A",
            role: memberData.role || "Member",
            position: position,
          };
        });
  
        const resolvedMembers = (await Promise.all(memberPromises)).filter(
          (member): member is Member => member !== null
        ); // Remove null values with type guard
        setMembers(resolvedMembers);
        setFilteredMembers(resolvedMembers);
      } catch (error) {
        console.error("Error fetching approved members:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchApprovedMembers();
  }, [user, roleFilter, courseFilter, yearFilter]); // Add courseFilter and yearFilter as dependencies
  

  const handleSearch = (searchTerm: string) => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = members.filter(
      (member) =>
        member.fullName.toLowerCase().includes(lowercasedSearchTerm) ||
        member.email.toLowerCase().includes(lowercasedSearchTerm) ||
        member.contactNumber.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredMembers(filtered);
  };

  const handleFilter = (filter: string) => {
    if (filter === "All") {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter((member) => member.role === filter);
      setFilteredMembers(filtered);
    }
  };

  return (
      <div className="flex h-screen">
    <div className="w-64 flex-shrink-0">
      <OfficerSidebar />
    </div>
      <div className="flex-grow p-6 bg-white">
        <Header />
        <SearchAndFilter
          onSearch={handleSearch}
          onRoleFilter={setRoleFilter}
          onYearFilter={setYearFilter}
          onCourseFilter={setCourseFilter}
        />
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
                  <th className="px-4 py-2">
                  <WorkIcon sx={{ color: "white" }} />Position</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <tr key={member.uid} className="even:bg-gray-50">
                      <td className="px-4 py-2">{member.fullName}</td>
                      <td className="px-4 py-2">{member.course}</td>
                      <td className="px-4 py-2">{member.yearLevel}</td>
                      <td className="px-4 py-2">{member.contactNumber}</td>
                      <td className="px-4 py-2">{member.email}</td>
                      <td className="px-4 py-2">{member.joinedAt}</td>
                      <td className="px-4 py-2">{member.position}</td> 
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-4">
                      No members found.
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
