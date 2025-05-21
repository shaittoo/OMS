import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import MemberSidebar from "../components/membersidebar";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Header: React.FC = () => (
  <div className="flex flex-col md:flex-col justify-between pb-4 border-b border-gray-200">
    <div className="py-2">
      <Link href="/memberpage" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
        <ArrowBackIcon />
        <span>Back to Dashboard</span>
      </Link>
    </div>
    <div>
      <p className="text-lg text-gray-500">What organization would you like to join?</p>
    </div>
  </div>
);

const SearchAndFilter: React.FC<{
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (filter: string | null) => void;
  onCategoryFilterChange: (filter: string | null) => void;
}> = ({ searchTerm, onSearchChange, onStatusFilterChange, onCategoryFilterChange }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filters = ["Active", "Joined"];

  const handleStatusClick = (filter: string) => {
    const newFilter = activeFilter === filter ? null : filter;
    setActiveFilter(newFilter);
    onStatusFilterChange(newFilter);
  };

  return (
    <div className="relative flex items-center bg-white p-4 rounded-md mt-6 shadow-lg border border-gray-300 justify-center">
      <div className="relative flex-grow">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-gray-600 placeholder-gray-400 bg-white rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="Search..."
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <SearchIcon className="h-5 w-5" />
        </span>
      </div>
      <div className="ml-4 flex items-center space-x-4">
        <span className="text-gray-600 text-sm">Filter by:</span>
        {filters.map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 border rounded-md text-sm font-medium ${
              activeFilter === filter
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => handleStatusClick(filter)}
          >
            {filter}
          </button>
        ))}
        <DropdownMenu
          title="Category"
          options={["All", "Academic", "Sports", "Interest", "Others"]}
          onSelect={onCategoryFilterChange}
        />
      </div>
    </div>
  );
};

const DropdownMenu: React.FC<{
  title: string;
  options: string[];
  onSelect?: (value: string) => void;
}> = ({ title, options, onSelect }) => (
  <Menu as="div" className="relative inline-block text-left">
    <div>
      <MenuButton className="inline-flex px-4 py-2 border rounded-md text-sm font-medium">
        {title}
        <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-gray-400" />
      </MenuButton>
    </div>
    <MenuItems className="absolute right-0 z-10 mt-2 w-auto origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
      <div className="py-1">
        {options.map((option) => (
          <MenuItem key={option}>
            {({ active }) => (
              <button
                onClick={() => onSelect?.(option)}
                className={`flex px-4 py-2 text-sm w-full text-left ${
                  active ? "bg-gray-100 text-gray-800" : "text-gray-700"
                }`}
              >
                {option}
              </button>
            )}
          </MenuItem>
        ))}
      </div>
    </MenuItems>
  </Menu>
);

const OrgList: React.FC = () => {
  const [organizations, setOrganizations] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    photo?: string;
    tags?: string[];
  }>>([]);
  const [joinedOrgs, setJoinedOrgs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>("All");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const auth = getAuth();

      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          console.error("User not authenticated.");
          setLoading(false);
          return;
        }
  
        const userId = user.uid;
        try {
          const memberSnapshot = await getDocs(query(
            collection(db, "Members"),
            where("uid", "==", userId)
          ));
          const joined = memberSnapshot.docs.map((doc) => doc.data().organizationId);
          setJoinedOrgs(joined);  

          const usersRef = collection(db, "Users");
          const orgQuery = query(usersRef, where("role", "==", "organization"));
          const querySnapshot = await getDocs(orgQuery);
  
          const orgs = await Promise.all(
            querySnapshot.docs.map(async (userDoc) => {
              const userData = userDoc.data();
              const orgId = userData.organizationId;
              if (orgId) {
                const orgDoc = await getDoc(doc(db, "Organizations", orgId));
                if (orgDoc.exists()) {
                  const orgData = orgDoc.data();
                  return {
                    id: orgId,
                    name: orgData.name || "Unnamed Organization",
                    description: orgData.description || "No description available.",
                    photo: orgData.photo || "/assets/default.jpg",
                    tags: orgData.tags || [],
                  };
                }
              }
              return null;
            })
          );
  
          setOrganizations(orgs.filter(Boolean) as any);
        } catch (error) {
          console.error("Error fetching organizations:", error);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    };
  
    fetchData();
  }, []); 

  const handleJoinOrganization = async (organizationId: string) => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      alert("You must be logged in to join an organization.");
      return;
    }

    try {
      const memberQuery = query(
        collection(db, "Members"),
        where("uid", "==", userId),
        where("organizationId", "==", organizationId)
      );
      const snapshot = await getDocs(memberQuery);
      if (!snapshot.empty) {
        alert("You’ve already requested to join this organization.");
        return;
      }

      await setDoc(doc(db, "Members", `${userId}_${organizationId}`), {
        uid: userId,
        organizationId,
        status: "pending",
        joinedAt: new Date().toISOString(),
        approvalDate: null,
      });

      setJoinedOrgs((prev) => [...prev, organizationId]);
      alert("Request sent for approval.");
    } catch (err) {
      console.error(err);
      alert("Failed to send join request.");
    }
  };

  const filteredOrgs = organizations.filter((organizations) => {
    const matchesSearch = organizations.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
    !categoryFilter || categoryFilter === "All"
      ? true
      : categoryFilter === "Others"
      ? !["academic", "sports", "interest"].some((cat) =>
        organizations.tags?.map((t) => t.toLowerCase()).includes(cat)
        )
      : organizations.tags?.map((t) => t.toLowerCase()).includes(categoryFilter.toLowerCase());  
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "Joined"
        ? joinedOrgs.includes(organizations.id)
        : !joinedOrgs.includes(organizations.id));

    return matchesSearch && matchesCategory && matchesStatus;
  });

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
          <main className="ml-64 p-2">
      <div className="flex-grow p-6 bg-white">
        <Header />

        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onCategoryFilterChange={(value) => setCategoryFilter(value)}      
        />
        <div className="space-y-4 mt-6">
          {filteredOrgs.map((organizations) => (
            <div
              key={organizations.id}
              className="flex items-center p-4 border rounded-md hover:shadow-md transition duration-200"
            >
              <img
                src={organizations.photo}
                alt={organizations.name}
                className="w-16 h-16 rounded mr-4 object-cover"
              />
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-gray-800">{organizations.name}</h3>
                <p className="text-sm text-gray-600">{organizations.description}</p>
              </div>
              <button
                className={`px-4 py-2 text-white text-sm rounded ${
                  joinedOrgs.includes(organizations.id)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
                onClick={() => handleJoinOrganization(organizations.id)}
                disabled={joinedOrgs.includes(organizations.id)}
              >
                {joinedOrgs.includes(organizations.id) ? "Joined" : "Join Organization"}
              </button>
            </div>
          ))}
          {filteredOrgs.length === 0 && (
            <div className="text-center text-gray-600 mt-6">
              No organizations match your search or filters.
            </div>
          )}
        </div>
        
      </div>
      </main>
    </div>
  );
};

export default OrgList;