import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth } from "../firebaseConfig";
import OfficerSidebar from "../components/officersidebar";
import Select from "react-select";

const OfficerEditForm: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [officerPositions, setOfficerPositions] = useState<{
    president: string;
    vicePresident: string;
    secretary: string;
    treasurer: string;
    auditor: string;
  }>({
    president: '',
    vicePresident: '',
    secretary: '',
    treasurer: '',
    auditor: ''
  });
  const [organizationId, setOrganizationId] = useState<string>("");
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid) {
        try {
          const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const orgId = userData.organizationId;
            setOrganizationId(orgId);

            const orgDoc = await getDoc(doc(db, "Organizations", orgId));
            if (orgDoc.exists()) {
              setOrganizationName(orgDoc.data().name);
            }

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

            const membersQuery = query(collection(db, "Members"), where("organizationId", "==", orgId));
            const membersSnapshot = await getDocs(membersQuery);

            const memberList: { id: string; name: string }[] = [];
            for (const memberDoc of membersSnapshot.docs) {
              const memberData = memberDoc.data();
              const userUid = memberData.uid;

              const userDoc = await getDoc(doc(db, "Users", userUid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                memberList.push({
                  id: userUid,
                  name: userData.fullName || userData.email || "Unnamed User",
                });
              }
            }
            setMembers(memberList);
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

      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("email", "==", currentUser.email));
      const userDocs = await getDocs(userQuery);

      if (userDocs.empty) {
        throw new Error("User not found");
      }

      const organizationId = userDocs.docs[0].data().organizationId;

      const officerData = {
        president: officerPositions.president,
        vicePresident: officerPositions.vicePresident,
        secretary: officerPositions.secretary,
        treasurer: officerPositions.treasurer,
        auditor: officerPositions.auditor,
        organizationId: organizationId,
        updatedAt: serverTimestamp()
      };

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
      <div className="flex h-screen">
    <div className="w-64 flex-shrink-0">
      <OfficerSidebar />
    </div>
      <main className="main-content flex-grow p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 text-purple-700 hover:text-purple-900 font-bold"
          >
            &#8592;
          </button>
          <h1 className="text-3xl font-bold text-black">
            Edit Officers of {organizationName}
          </h1>
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
              <Select
                options={members.map((m) => ({ label: m.name, value: m.id }))}  // Use 'id' (UID) as value
                value={{
                  label: members.find((m) => m.id === officerPositions[key as keyof typeof officerPositions])?.name || '',
                  value: officerPositions[key as keyof typeof officerPositions]
                }}
                onChange={(option) =>
                  setOfficerPositions((prev) => ({
                    ...prev,
                    [key]: option?.value || '',  // Save 'uid' as value
                  }))
                }
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
