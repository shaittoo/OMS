import React, { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import EventIcon from "@mui/icons-material/Event";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InfoIcon from "@mui/icons-material/Info";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import ProfileSettings from './profilesetting';

const OfficerSidebar: React.FC = () => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  return (
    <aside className="w-64 h-screen bg-gray-100 shadow-lg flex flex-col">
      {/* Sidebar Title with Logo */}
      <div className="p-6 bg-gray-100 flex justify-center items-center">
        <Link href="/orgpage">
          <img src="/assets/OMSLOGO.png" alt="OMS Logo" className="h-12 mt-4" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-grow mt-4">
        <a
          href="/orgpage"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <DashboardIcon />
          <span className="ml-3 text-md font-medium">Dashboard</span>
        </a>

        <a
          href="/memberspageofficerview"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <GroupIcon />
          <span className="ml-3 text-md font-medium">Members</span>
        </a>

        <a
          href="/events"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <EventIcon />
          <span className="ml-3 text-md font-medium">All Events</span>
        </a>

        <a
          href="/orgcalendarsidebar"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <CalendarTodayIcon />
          <span className="ml-3 text-md font-medium">Calendar</span>
        </a>

        <hr className="my-4 border-gray-300" />

        <a
          href="/aboutuspage"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
        >
          <InfoIcon />
          <span className="ml-3 text-md font-medium">Information</span>
        </a>

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

      {showProfileSettings && (
        <ProfileSettings close={() => setShowProfileSettings(false)} />
      )}
    </aside>
  );
};

export default OfficerSidebar;
