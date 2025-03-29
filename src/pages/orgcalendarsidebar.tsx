import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom"; // Use Navigate for redirection in React Router v6
import OfficerSidebar from "../components/officersidebar"; // Assuming you have this component
import OrgCalendar from "../components/orgcalendar"; // The OrgCalendar component from previous example
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const OrgCalendarSidebar = () => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be logged in to view the calendar.");
        setLoading(false);
        return;
      }

      try {
        const orgRef = doc(db, "Users", user.uid);
        const orgSnapshot = await getDoc(orgRef);
        const organizationId = orgSnapshot.data()?.organizationId;

        if (!organizationId) {
          setError("User is not associated with an organization.");
        } else {
          setOrganizationId(organizationId);
        }
      } catch (error) {
        setError("Error fetching organization details.");
      } finally {
        setLoading(false);
      }
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) return <p>{error}</p>;

  // Redirect to login if not logged in or no organizationId
  if (!organizationId) {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar on the left */}
        <div style={{ width: "250px", backgroundColor: "#f4f4f4", padding: "2px", boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)" }}>
          <OfficerSidebar />
        </div>
  
        {/* Calendar on the right */}
        <div style={{ flexGrow: 1, padding: "18px", overflowY: "auto", backgroundColor: "white"}}>
          <OrgCalendar />
        </div>
      </div>
    </div>
  );
};


export default OrgCalendarSidebar;
