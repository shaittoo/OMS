import React, { useEffect, useState } from "react";
import OfficerSidebar from "./officersidebar";
import TaskList from "./tasklist";

interface OrgViewTaskProps {
    showBackButton?: boolean; // Optional prop to show the Back button
}

const OrgViewTask: React.FC<OrgViewTaskProps> = ({ showBackButton = false }) => {
    return (
        <div className="flex">
            <div className="sticky left-0 top-0 h-screen overflow-y-auto shadow-md">
                <OfficerSidebar />
            </div>
            <main className="main-content flex-grow p-6 relative bg-white">
                <TaskList showBackButton={showBackButton}/>
            </main>
        </div>
    );
  };
  
export default OrgViewTask;