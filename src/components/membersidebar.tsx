import React, { useEffect, useState } from "react";
import InfoIcon from "@mui/icons-material/Info";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import { auth, db } from "../firebaseConfig"; // Import your firebase config
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

const MemberSidebar: React.FC = () => {
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserOrganizations = async (userId: string) => {
    try {
      const membersRef = collection(db, "Members");
      const q = query(
        membersRef,
        where("uid", "==", userId),
        where("status", "==", "approved")
      );
      const querySnapshot = await getDocs(q);

      const orgs = [];
      for (const docSnapshot of querySnapshot.docs) {
        const memberData = docSnapshot.data();
        const orgId = memberData.organizationId;

        const orgDocRef = doc(db, "Organizations", orgId);
        const orgDoc = await getDoc(orgDocRef);
        const orgData = orgDoc.data();

        if (orgData) {
          orgs.push(orgData);
        }
      }

      setUserOrganizations(orgs);
    } catch (error) {
      console.error("Error fetching user organizations:", error);
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
        setUserOrganizations([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <aside className="w-64 h-auto bg-gray-100 shadow-lg flex flex-col">
      <div className="p-6 bg-gray-100 flex justify-center items-center">
        <Link href="/memberpage">
          <img src="/assets/OMSLOGO.png" alt="OMS Logo" className="h-12 mt-4" />
        </Link>
      </div>

      <nav className="flex-grow mt-4">
        <a
          href="/memberpage"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <DashboardIcon />
          <span className="ml-3 text-md font-medium">Dashboard</span>
        </a>
        {userOrganizations.map((org, index) => (
          <a
            key={index}
            href="/membervieworg"
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
          >
            <img
              src={org.photo || "/assets/default.jpg"} // Use org.photo for the organization's photo
              alt={org.name}
              className="h-8 w-8 rounded-full" // Circular image style
            />
            <span className="ml-3 text-md font-medium">{org.name}</span>
          </a>
        ))}

        <hr className="my-4 border-gray-300" />
        <Link href="/memberaboutus">
          <a className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
            <InfoIcon />
            <span className="ml-3 text-md font-medium">Information</span>
          </a>
        </Link>

        <Link href="/">
          <a className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
            <SettingsIcon />
            <span className="ml-3 text-md font-medium">Profile Settings</span>
          </a>
        </Link>
      </nav>

      <div className="p-4 text-sm text-gray-500 border-t border-gray-300">
        © 2024 OMS Platform
      </div>
    </aside>
  );
};

export default MemberSidebar;
