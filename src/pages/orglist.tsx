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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const Header: React.FC = () => {
  return (

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
};

const SearchAndFilter: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  const filters = ["Active", "Joined"];

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
        {filters.map((filter) => (
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

        <DropdownMenu title="Category" options={["Category 1", "Category 2", "Category 3"]} />
        <DropdownMenu
          title="Application"
          options={["Accepted", "Ongoing", "Rejected"]}
          links={["/membershipstatus"]}
        />
      </div>
    </div>
  );
};

const DropdownMenu: React.FC<{
  title: string;
  options: string[];
  links?: string[];
}> = ({ title, options, links }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="inline-flex px-4 py-2 border rounded-md text-sm font-medium">
          {title}
          <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-gray-400" />
        </MenuButton>
      </div>
      <MenuItems
        className="absolute right-0 z-10 mt-2 w-auto origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
      >
        <div className="py-1">
          {options.map((option, index) => (
            <MenuItem key={option}>
              {links && links.length > 0 ? (
                <Link href={`${links[0]}=${option.toLowerCase()}`} passHref>
                  <button className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none">
                    {option}
                  </button>
                </Link>
              ) : (
                <button className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none">
                  {option}
                </button>
              )}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
};


const OrgList: React.FC = () => {
  const [organizations, setOrganizations] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    photo?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const usersRef = collection(db, "Users");
        const orgQuery = query(usersRef, where("role", "==", "organization"));
        const querySnapshot = await getDocs(orgQuery);

        const organizationPromises = querySnapshot.docs.map(async (userDoc) => {
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
              };
            }
          }
          return null;
        });

        const resolvedOrganizations = (await Promise.all(organizationPromises)).filter(Boolean);
        setOrganizations(resolvedOrganizations as Array<{
          id: string;
          name: string;
          description?: string;
          photo?: string;
        }>);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleJoinOrganization = async (organizationId: string) => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      alert("You must be logged in to join an organization.");
      return;
    }

    try {
      const membersRef = collection(db, "members");
      const memberQuery = query(
        membersRef,
        where("uid", "==", userId),
        where("organizationId", "==", organizationId)
      );
      const memberSnapshot = await getDocs(memberQuery);

      if (!memberSnapshot.empty) {
        alert("You have already requested to join or are already a member of this organization.");
        return;
      }

      await setDoc(doc(db, "Members", `${userId}_${organizationId}`), {
        uid: userId,
        organizationId,
        status: "pending",
        joinedAt: new Date().toISOString(),
        approvalDate: null,
      });

      alert("Request to join the organization has been sent for approval.");
    } catch (error) {
      console.error("Error joining organization:", error);
      alert("There was an error while sending your request.");
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
    <div className="flex min-h-screen ">
      <MemberSidebar/>
      <div className="flex-grow p-6 bg-white">
        <Header />
        <SearchAndFilter/>
        <div className="space-y-4 mt-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="flex items-center p-4 border rounded-md hover:shadow-md transition duration-200"
            >
              <img
                src={org.photo}
                alt={org.name}
                className="w-16 h-16 rounded mr-4 object-cover"
              />
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-gray-800">{org.name}</h3>
                <p className="text-sm text-gray-600">{org.description}</p>
              </div>
              <button
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                onClick={() => handleJoinOrganization(org.id)}
              >
                Join Organization
              </button>
            </div>
          ))}
          {organizations.length === 0 && (
            <div className="text-center text-gray-600 mt-6">
              No organizations found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgList;
