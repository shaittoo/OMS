import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import OfficerSidebar from "../components/officersidebar";
import Link from "next/link"

const ViewOfficers: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [officers, setOfficers] = useState({
    president: '',
    vicePresident: '',
    secretary: '',
    treasurer: '',
    auditor: ''
  });

  useEffect(() => {
    const fetchOfficers = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        try {
          // Get user's organization ID
          const usersRef = collection(db, "Users");
          const userQuery = query(usersRef, where("email", "==", currentUser.email));
          const userDocs = await getDocs(userQuery);

          if (!userDocs.empty) {
            const userData = userDocs.docs[0].data();
            const orgId = userData.organizationId;

            // Fetch organization name
            const orgDoc = await getDoc(doc(db, "Organizations", orgId));
            if (orgDoc.exists()) {
              setOrganizationName(orgDoc.data()?.name || "Unknown Organization");
            }

            // Fetch officers data
            const officerDoc = await getDoc(doc(db, "officers", orgId));
            if (officerDoc.exists()) {
              const data = officerDoc.data();
              setOfficers({
                president: data.president || 'Not assigned',
                vicePresident: data.vicePresident || 'Not assigned',
                secretary: data.secretary || 'Not assigned',
                treasurer: data.treasurer || 'Not assigned',
                auditor: data.auditor || 'Not assigned'
              });
            }
          }
        } catch (err) {
          console.error("Error fetching officers:", err);
          setError("Failed to load officers data");
        } finally {
          setLoading(false);
        }
      } else {
        setError("You must be logged in to view this page");
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  // Add this function for generating random gradients
  const generateRandomGradient = () => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
      'linear-gradient(135deg, #FF61D2 0%, #FE9090 100%)',
      'linear-gradient(135deg, #40E0D0 0%, #FF8C00 100%)',
      'linear-gradient(135deg, #5E5AEC 0%, #3F9EFC 100%)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex bg-white">
      <OfficerSidebar />
      <main className="main-content flex-grow p-6">
      <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-black">
              Officers of {organizationName}
            </h1>
            <Link href="/viewofficersofficerview">
              <button
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <span>Edit Officers</span>
                <svg 
                  className="w-5 h-5 ml-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                  />
                </svg>
              </button>
            </Link>
          </div>
          <hr className="border-t-2 border-gray-200" />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries({
            'President': officers.president,
            'Vice President': officers.vicePresident,
            'Secretary': officers.secretary,
            'Treasurer': officers.treasurer,
            'Auditor': officers.auditor
          }).map(([position, name]) => (
            <div
              key={position}
              className="p-4 rounded shadow transition-all duration-300 ease-linear hover:scale-105 group"
              style={{ background: generateRandomGradient() }}
            >
              <div className="officer-card relative overflow-hidden">
                <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl text-white">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-white">{name}</h2>
                  <p className="text-gray-200">{position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ViewOfficers;