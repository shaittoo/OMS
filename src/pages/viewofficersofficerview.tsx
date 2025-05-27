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
import { ToastContainer, toast } from 'react-toastify';

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

  // Additional officer state
  const [additionalOfficerPosition, setAdditionalOfficerPosition] = useState("");
  const [additionalOfficerName, setAdditionalOfficerName] = useState("");
  const [showAdditionalOfficer, setShowAdditionalOfficer] = useState(false);
  const [additionalOfficers, setAdditionalOfficers] = useState<{ position: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

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
              // Load additional officers array if present
              if (Array.isArray(officersData.additionalOfficers)) {
                setAdditionalOfficers(officersData.additionalOfficers);
              } else {
                setAdditionalOfficers([]);
              }
              if (officersData.additionalOfficerPosition && officersData.additionalOfficerName) {
                setAdditionalOfficerPosition(officersData.additionalOfficerPosition);
                setAdditionalOfficerName(officersData.additionalOfficerName);
              }
            }

            const membersQuery = query(
              collection(db, "Members"),
              where("organizationId", "==", orgId),
              where("status", "==", "approved")
            );
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
    setSaving(true);

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

      const officerData: any = {
        president: officerPositions.president,
        vicePresident: officerPositions.vicePresident,
        secretary: officerPositions.secretary,
        treasurer: officerPositions.treasurer,
        auditor: officerPositions.auditor,
        organizationId: organizationId,
        updatedAt: serverTimestamp(),
        additionalOfficers, // Save the array
      };

      // Add additional officer if both fields are filled
      if (additionalOfficerPosition && additionalOfficerName) {
        officerData.additionalOfficerPosition = additionalOfficerPosition;
        officerData.additionalOfficerName = additionalOfficerName;
      }

      const officerRef = doc(db, "officers", organizationId);
      await setDoc(officerRef, officerData);

      for (const officer of additionalOfficers) {
        if (officer.name) {
          const userRef = doc(db, "Users", officer.name);
          await setDoc(
            userRef,
            { position: officer.position },
            { merge: true }
          );
        }
      }

      toast.success("Edited officers successfully", {
          style: {
            backgroundColor: "rgba(243, 232, 255, 0.95)",
            color: "#374151",
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
            fontSize: "14px",
            padding: "12px 16px",
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            margin: "0 0 16px 0",
          },
          icon: false,
          });
         
     
    } catch (err) {
      toast.error("Error saving officers.", {
          style: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            color: "#DC2626", // Red text for error
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
            fontSize: "14px",
            padding: "12px 16px",
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            margin: "0 0 16px 0",
          },
          icon: false,
          });
      setError(err instanceof Error ? err.message : "Failed to update officers");
    } finally {
      setSaving(false);
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
          {/* Main Officers */}
          {Object.entries({
            'President': 'president',
            'Vice President': 'vicePresident',
            'Secretary': 'secretary',
            'Treasurer': 'treasurer',
            'Auditor': 'auditor'
          }).map(([label, key]) => {
            // Get all selected member IDs except for this field
            const selectedIds = Object.values(officerPositions).filter((v, _, arr) => v && arr.indexOf(v) !== arr.lastIndexOf(v) ? false : true && v !== officerPositions[key as keyof typeof officerPositions]);
            const additionalSelectedIds = additionalOfficers.map(o => o.name);
            const excludeIds = [...selectedIds, ...additionalSelectedIds].filter(id => id && id !== officerPositions[key as keyof typeof officerPositions]);
            return (
              <div key={key} className="mb-4 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {label}:
                  </label>
                  <Select
                    options={members
                      .filter((m) => !excludeIds.includes(m.id))
                      .map((m) => ({ label: m.name, value: m.id }))}
                    value={
                      members.find((m) => m.id === officerPositions[key as keyof typeof officerPositions])
                        ? {
                            label: members.find((m) => m.id === officerPositions[key as keyof typeof officerPositions])?.name || "",
                            value: officerPositions[key as keyof typeof officerPositions],
                          }
                        : null
                    }
                    onChange={(option) =>
                      setOfficerPositions((prev) => ({
                        ...prev,
                        [key]: option?.value || "",
                      }))
                    }
                    isClearable
                    placeholder="Select member"
                  />
                </div>
              </div>
            );
          })}

          {/* Additional Officers Section */}
          {additionalOfficers.map((officer, idx) => {
            // Exclude all selected IDs except for this officer's own
            const mainSelectedIds = Object.values(officerPositions);
            const additionalSelectedIds = additionalOfficers
              .map((o, i) => (i !== idx ? o.name : null))
              .filter(Boolean);
            const excludeIds = [...mainSelectedIds, ...additionalSelectedIds].filter(id => id && id !== officer.name);
            return (
              <div key={idx} className="mb-4 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Additional Officer Position:
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={officer.position}
                    onChange={e => {
                      const updated = [...additionalOfficers];
                      updated[idx].position = e.target.value;
                      setAdditionalOfficers(updated);
                    }}
                    placeholder="e.g. PRO, Business Manager"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Additional Officer Name:
                  </label>
                  <Select
                    options={members
                      .filter((m) => !excludeIds.includes(m.id))
                      .map((m) => ({ label: m.name, value: m.id }))}
                    value={
                      members.find((m) => m.id === officer.name)
                        ? {
                            label: members.find((m) => m.id === officer.name)?.name || "",
                            value: officer.name,
                          }
                        : null
                    }
                    onChange={(option) => {
                      const updated = [...additionalOfficers];
                      updated[idx].name = option?.value || "";
                      setAdditionalOfficers(updated);
                    }}
                    isClearable
                    placeholder="Select member"
                  />
                </div>
                <button
                  type="button"
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 font-semibold ml-2"
                  onClick={() => {
                    setAdditionalOfficers(additionalOfficers.filter((_, i) => i !== idx));
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}

          {/* Add Additional Officer Button and Fields */}
          {!showAdditionalOfficer && (
            <div className="mb-4">
              <button
                type="button"
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 font-semibold"
                onClick={() => setShowAdditionalOfficer(true)}
              >
                + Add Additional Officer
              </button>
            </div>
          )}

          {showAdditionalOfficer && (
            <div className="mb-4 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Additional Officer Position:
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={additionalOfficerPosition}
                  onChange={(e) => setAdditionalOfficerPosition(e.target.value)}
                  placeholder="e.g. PRO, Business Manager"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Additional Officer Name:
                </label>
                <Select
                  options={members
                    // Exclude members already assigned as main or additional officers
                    .filter(
                      (m) =>
                        !Object.values(officerPositions).includes(m.id) &&
                        !additionalOfficers.some((o) => o.name === m.id)
                    )
                    .map((m) => ({ label: m.name, value: m.id }))}
                  value={
                    members.find((m) => m.id === additionalOfficerName)
                      ? {
                          label: members.find((m) => m.id === additionalOfficerName)?.name || "",
                          value: additionalOfficerName,
                        }
                      : null
                  }
                  onChange={(option) => setAdditionalOfficerName(option?.value || "")}
                  placeholder="Select member"
                />
              </div>
              <button
                type="button"
                className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-500 font-semibold ${
                  additionalOfficerPosition && additionalOfficerName ? "" : "opacity-50 cursor-not-allowed"
                }`}
                disabled={!(additionalOfficerPosition && additionalOfficerName)}
                onClick={() => {
                  setAdditionalOfficers((prev) => [
                    ...prev,
                    { position: additionalOfficerPosition, name: additionalOfficerName },
                  ]);
                  setAdditionalOfficerPosition("");
                  setAdditionalOfficerName("");
                  setShowAdditionalOfficer(false);
                }}
              >
                Add
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 font-semibold"
                onClick={() => {
                  setAdditionalOfficerPosition("");
                  setAdditionalOfficerName("");
                  setShowAdditionalOfficer(false);
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="submit"
            className={`w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-blue-600 ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </form>
        
      </main>
      <ToastContainer
                  position="bottom-right"
                  autoClose={2000}
                  hideProgressBar
                  closeButton={false}
                  closeOnClick
                  pauseOnHover={false}
                  draggable={false}
                  toastStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  color: "#374151",
                  borderRadius: "12px",
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
                  fontSize: "14px",
                  padding: "12px 16px",
                  minHeight: "48px",
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  margin: "0 0 16px 0",
                  }}
                  />
    </div>
  );
};

export default OfficerEditForm;
