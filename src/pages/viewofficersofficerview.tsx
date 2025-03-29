import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../firebaseConfig"; // Assuming you use Firebase Auth
import OfficerSidebar from "../components/officersidebar";

const OfficerEditForm: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [officerPositions, setOfficerPositions] = useState({
    president: '',
    vicePresident: '',
    secretary: '',
    treasurer: '',
    auditor: ''
  });
  const [organizationId, setOrganizationId] = useState<string>("");

  // Fetch the current user and their organization details
  useEffect(() => {
    const getUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid) {
        try {
          // Get user document directly using uid
          const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const orgId = userData.organizationId;
            setOrganizationId(orgId);

            // Get organization name
            const orgDoc = await getDoc(doc(db, "Organizations", orgId));
            if (orgDoc.exists()) {
              setOrganizationName(orgDoc.data().name);
            }

            // Get existing officers data if any
            const officersDoc = await getDoc(doc(db, "officers", orgId));
            if (officersDoc.exists()) {
              const officersData = officersDoc.data();
              setOfficerPositions({
                president: officersData.president || '',
                vicePresident: officersData.vicePresident || '',
                secretary: officersData.secretary || '',
                treasurer: officersData.treasurer || '',
                auditor: officersData.auditor || ''
              });
            }
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load data");
        } finally {
          setLoading(false);
        }
      } else {
        setError("You must be logged in to view this page");
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        throw new Error("No user logged in");
      }

      // Get user's organization ID
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("email", "==", currentUser.email));
      const userDocs = await getDocs(userQuery);

      if (userDocs.empty) {
        throw new Error("User not found");
      }

      const organizationId = userDocs.docs[0].data().organizationId;
      
      // Prepare the data
      const officerData = {
        president: officerPositions.president,
        vicePresident: officerPositions.vicePresident,
        secretary: officerPositions.secretary,
        treasurer: officerPositions.treasurer,
        auditor: officerPositions.auditor,
        organizationId: organizationId,
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const officerRef = doc(db, "officers", organizationId);
      await setDoc(officerRef, officerData);

      console.log("Officers data saved successfully:", officerData);
      alert("Officers updated successfully!");
    } catch (err) {
      console.error("Error saving officers:", err);
      setError(err instanceof Error ? err.message : "Failed to update officers");
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold mb-2 text-black">
            Edit Officers of {organizationName}
          </h1>
          <hr className="border-t-2 border-gray mb-6" />
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          {Object.entries({
            'President': 'president',
            'Vice President': 'vicePresident',
            'Secretary': 'secretary',
            'Treasurer': 'treasurer',
            'Auditor': 'auditor'
          }).map(([label, key]) => (
            <div key={key} className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {label}:
              </label>
              <input
                type="text"
                value={officerPositions[key as keyof typeof officerPositions]}
                onChange={(e) => setOfficerPositions(prev => ({
                  ...prev,
                  [key]: e.target.value
                }))}
                className="w-full p-2 border rounded-md"
                placeholder={`Enter ${label}'s Name`}
              />
            </div>
          ))}
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Save All Changes
          </button>
        </form>
      </main>
    </div>
  );
};

export default OfficerEditForm;
