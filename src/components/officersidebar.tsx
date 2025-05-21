import React, { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import EventIcon from "@mui/icons-material/Event";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InfoIcon from "@mui/icons-material/Info";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import ProfileSettings from './profilesetting';
import { createPortal } from 'react-dom';
import PendingApplicantsLink from "./PendingApplicationsLink";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useRouter } from "next/router";

const OfficerSidebar: React.FC = () => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };


  return (
    <>
          <aside className="w-64 h-screen fixed top-0 left-0 z-30 bg-gray-100 bg-opacity-80 flex flex-col overflow-y-hidden hover:overflow-y-auto">
        {/* Sidebar Title with Logo */}
        <div className="p-6 bg-gray-100 flex justify-center items-center">
          <Link href="/orgpage" legacyBehavior>
            <a>
              <img src="/assets/OMSLOGO.png" alt="OMS Logo" className="h-12 mt-4" />
            </a>
          </Link>
        </div>

        {/* Navigation */}
       <nav className="flex-grow mt-4">
          <Link href="/orgpage" legacyBehavior>
            <a className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
              <DashboardIcon />
              <span className="ml-3 text-md font-medium">Dashboard</span>
            </a>
          </Link>

          <Link href="/memberspageofficerview" legacyBehavior>
            <a className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
              <GroupIcon />
              <span className="ml-3 text-md font-medium">Members</span>
            </a>
          </Link>

          <Link href="/events" legacyBehavior>
            <a className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
              <EventIcon />
              <span className="ml-3 text-md font-medium">All Events</span>
            </a>
          </Link>

          <Link href="/orgcalendarsidebar" legacyBehavior>
            <a className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
              <CalendarTodayIcon />
              <span className="ml-3 text-md font-medium">Calendar</span>
            </a>
          </Link>
          
          <PendingApplicantsLink/>

          <hr className="my-4 border-gray-300" />

          <Link href="/aboutuspage" legacyBehavior>
            <a className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
              <InfoIcon />
              <span className="ml-3 text-md font-medium">Information</span>
            </a>
          </Link>

          <button
            onClick={() => setShowProfileSettings(true)}
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors w-full"
          >
            <SettingsIcon />
            <span className="ml-3 text-md font-medium">Profile Settings</span>
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors w-full"
          >
            <LogoutIcon />
            <span className="ml-3 text-md font-medium">Log Out</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 text-sm text-gray-500 border-t border-gray-300">
          © 2024 OMS Platform
        </div>
      </aside>

      {showLogoutModal && typeof window !== 'undefined' && createPortal(
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
        </div>,
        document.body
      )}

      {showProfileSettings && typeof window !== 'undefined' && createPortal(
        <ProfileSettings close={() => setShowProfileSettings(false)} />,
        document.body
      )}
    </>
  );
};

export default OfficerSidebar;
