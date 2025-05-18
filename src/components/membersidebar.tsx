import React, { useEffect, useState } from "react";
import InfoIcon from "@mui/icons-material/Info";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from "@mui/icons-material/Settings";
import { auth, db } from "../firebaseConfig"; 
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import MemberProfileSettings from "./memberprofilesettings";
import ApplicationStatusLink from "./AppStatusLink";

const MemberSidebar: React.FC = () => {
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
    const fetchUnreadCount = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "notifications"),
        where("recipientUid", "==", user.uid),
        where("read", "==", false)
      );
      const snapshot = await getDocs(q);
      setUnreadCount(snapshot.size);
    };

    fetchUnreadCount();
  }, []);

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
          orgs.push({
            ...orgData,
            id: orgId,
          });
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

  const handleOrgClick = (orgId: string) => {
    router.push(`/membervieworg?orgId=${orgId}`);
  };

  return (
    <aside className="w-64 h-auto bg-gray-100 shadow-lg flex flex-col w-100">
      <div className="p-6 bg-gray-100 flex justify-center items-center">
        <Link href="/memberpage">
          <img src="/assets/OMSLOGO.png" alt="OMS Logo" className="h-12 mt-4" />
        </Link>
      </div>

      <nav className="flex-grow mt-4">
        <Link
          href="/memberpage"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <DashboardIcon />
          <span className="ml-3 text-md font-medium">Dashboard</span>
        </Link>

        <Link
          href="/membernotifs"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors relative"
        >
          <NotificationsIcon />
          <span className="ml-3 text-md font-medium">Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute right-4 top-2 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>


        {/* Application Status */}
        <ApplicationStatusLink />

        {/* My Events */}
        <Link
          href="/myevents"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <AssignmentIndIcon />
          <span className="ml-3 text-md font-medium">My Events</span>
        </Link>

        {/* User Organizations */}
        {userOrganizations.map((org, index) => (
          <div
            key={index}
            onClick={() => handleOrgClick(org.id)}
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer"
          >
            <img
              src={org.photo || "/assets/default.jpg"} // Use org.photo for the organization's photo
              alt={org.name}
              className="h-8 w-8 rounded-full" // Circular image style
            />
            <span className="ml-3 text-md font-medium">{org.name}</span>
          </div>
        ))}

        <hr className="my-4 border-gray-300" />
        <Link
          href="/memberaboutus"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <InfoIcon />
          <span className="ml-3 text-md font-medium">Information</span>
        </Link>

        <div
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer"
          onClick={() => setIsProfileOpen(true)}
        >
          <SettingsIcon />
          <span className="ml-3 text-md font-medium">Profile Settings</span>
        </div>
      </nav>

      <div className="p-4 text-sm text-gray-500 border-t border-gray-300">
        © 2024 OMS Platform
      </div>

      {isProfileOpen && (
        <MemberProfileSettings close={() => setIsProfileOpen(false)} />
      )}
    </aside>
  );
};

export default MemberSidebar;
