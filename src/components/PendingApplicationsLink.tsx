import React, { useEffect, useState } from "react";
import Link from "next/link";
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const PendingApplicantsLink: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingApplications = async () => {
      const user = auth.currentUser;
      console.log("Current user:", user);
      if (!user || !user.email) {
        console.log("User or user.email is null.");
        return;
      }
  
      const userDocRef = doc(db, "Users", user.email); 
      const userDocSnap = await getDoc(userDocRef);
  
      if (!userDocSnap.exists()) {
        console.log("User document not found.");
        return;
      }
  
      const orgId = userDocSnap.data().organizationId;
      console.log("Org ID from user doc:", orgId);
  
      const membersQuery = query(
        collection(db, "Members"),
        where("organizationId", "==", orgId),
        where("status", "==", "pending")
      );
  
      const membersSnapshot = await getDocs(membersQuery);
      console.log("Pending members count:", membersSnapshot.size);
      setPendingCount(membersSnapshot.size);
    };
  
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed. User is:", user);
      if (user) fetchPendingApplications();
    });
  
    return () => unsubscribe();
  }, []);
  

  return (
    <Link href="/acceptmembers" className="relative flex items-center px-6 py-3 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors">
      <HowToRegIcon />
      <span className="ml-3 text-md font-medium">Pending Applicants</span>
      {pendingCount > 0 && (
        <span className="absolute top-3 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {pendingCount}
        </span>
      )}
    </Link>
  );
};

export default PendingApplicantsLink;
