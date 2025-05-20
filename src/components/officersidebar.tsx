import React, { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import EventIcon from "@mui/icons-material/Event";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InfoIcon from "@mui/icons-material/Info";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import ProfileSettings from './profilesetting';
import { createPortal } from 'react-dom';
import PendingApplicantsLink from "./PendingApplicationsLink";

const OfficerSidebar: React.FC = () => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);

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
        </nav>

        {/* Footer */}
        <div className="p-4 text-sm text-gray-500 border-t border-gray-300">
          © 2024 OMS Platform
        </div>
      </aside>

      {showProfileSettings && typeof window !== 'undefined' && createPortal(
        <ProfileSettings close={() => setShowProfileSettings(false)} />,
        document.body
      )}
    </>
  );
};

export default OfficerSidebar;
