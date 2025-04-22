import React, { useEffect, useState } from "react";
import Link from "next/link";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

const ApplicationStatusLink: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const membersRef = collection(db, "Members");
      const q = query(
        membersRef,
        where("uid", "==", user.uid),
        where("status", "in", ["approved", "rejected"]),
        where("seenByUser", "==", false)
      );

      const snapshot = await getDocs(q);
      setUnreadCount(snapshot.size);
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) checkNotifications();
    });

    return () => unsubscribe();
  }, []);

  return (
    <Link href="/application-status" className="relative flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
      <AssignmentIndIcon />
      <span className="ml-3 text-md font-medium">Application Status</span>
      {unreadCount > 0 && (
        <span className="absolute top-3 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Link>
  );
};

export default ApplicationStatusLink;
