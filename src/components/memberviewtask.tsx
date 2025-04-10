import React from "react";
import MemberSidebar from "./membersidebar";
import MemTaskList from "./memtasklist";

const MemberViewTask = () => {
  return (
    <div className="flex">
      <MemberSidebar />
      <main className="main-content flex-grow p-6 relative h-screen overflow-y-auto bg-white">
        <MemTaskList />
      </main>
    </div>
  );
}

export default MemberViewTask;