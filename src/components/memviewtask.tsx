import React, { useEffect, useState } from "react";
import MemberSidebar from "./membersidebar";
import MemTaskList from "./memtasklist";

interface MemViewTaskProps {
    showBackButton?: boolean; // Optional prop to show the Back button
}

const MemViewTask: React.FC<MemViewTaskProps> = ({ showBackButton = false }) => {
    return (
        <div className="flex">
            <div className="sticky left-0 top-0 h-screen overflow-y-auto shadow-md">
                <MemberSidebar />
            </div>
            <main className="main-content flex-grow p-6 relative bg-white">
                <MemTaskList showBackButton={showBackButton}/>
            </main>
        </div>
    );
  };
  
export default MemViewTask;