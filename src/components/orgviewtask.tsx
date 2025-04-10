import React, { useEffect, useState } from "react";
import OfficerSidebar from "./officersidebar";
import TaskList from "./tasklist";

const OrgViewTask = () => {
    return (
        <div className="flex">
            <div className="sticky left-0 top-0 h-screen overflow-y-auto shadow-md">
                <OfficerSidebar />
            </div>
            <main className="main-content flex-grow p-6 relative bg-white">
                <TaskList />
            </main>
        </div>
    );
  };
  
export default OrgViewTask;