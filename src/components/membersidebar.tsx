import React, { useEffect, useState } from "react";
import InfoIcon from "@mui/icons-material/Info";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { auth, db } from "../firebaseConfig"; 
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, getAuth } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import MemberProfileSettings from "./memberprofilesettings";
import ApplicationStatusLink from "./AppStatusLink";
import AssignmentIcon from "@mui/icons-material/Assignment"; // Optional: for a tasks icon

const MemberSidebar: React.FC = () => {
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [orgsOpen, setOrgsOpen] = useState(false);
  const [orgsExpanded, setOrgsExpanded] = useState(false);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 z-30 bg-gray-100 bg-opacity-80 flex flex-col overflow-y-hidden hover:overflow-y-auto">
      <div className="p-6 bg-gray-100 flex justify-center items-center">
        <Link href="/memberpage">
          <img src="/assets/OMSLOGO.png" alt="OMS Logo" className="h-12 mt-4" />
        </Link>
      </div>

      <nav className="flex-1">
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
            <span className="absolute right-4 top-3 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
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

        {/* My Tasks */}
        <Link
          href="/memberowntasks"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <AssignmentIcon className="mr-3" />
          <span>My Tasks</span>
        </Link>

        {/* Divider before organizations */}
        <hr className="my-2 border-gray-300" />

        {/* Your Organization Vertical Shortcuts */}
        <div className="px-6 pt-3 pb-1">
          <span className="text-md font-medium text-gray-500 tracking-wide block mb-1">Your Organizations</span>
        </div>
        
        {userOrganizations.slice(0, orgsExpanded ? undefined : 3).map((org, index) => (
          <div
            key={index}
            onClick={() => handleOrgClick(org.id)}
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer"
          >
            <img
              src={org.photo || "/assets/default.jpg"}
              alt={org.name}
              className="h-7 w-7 rounded-full flex-shrink-0"
            />
            <span className="ml-3 text-sm font-medium truncate max-w-[140px]">{org.name}</span>
          </div>
        ))}
        {userOrganizations.length > 3 && (
          <div
            className="flex items-center px-6 py-3 text-purple-700 hover:bg-purple-100 hover:text-purple-900 transition-colors cursor-pointer select-none"
            onClick={() => setOrgsExpanded((prev) => !prev)}
          >
            <span className="text-sm font-medium">
              {orgsExpanded ? 'See less' : 'See more'}
            </span>
          </div>
        )}

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

        <div
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-red-100 hover:text-red-600  transition-colors cursor-pointer"
          onClick={() => setShowLogoutModal(true)}
        >
          <LogoutIcon />
          <span className="ml-3 text-md font-medium">Log Out</span>
        </div>
      </nav>

      <div className="p-4 text-sm text-gray-500 border-t border-gray-300">
        © 2024 OMS Platform
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Log out of your account?</h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {isProfileOpen && (
        <MemberProfileSettings close={() => setIsProfileOpen(false)} />
      )}
    </aside>
  );
};

export default MemberSidebar;
