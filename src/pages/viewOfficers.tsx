import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db, auth } from "../firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import OfficerSidebar from "../components/officersidebar";
import Link from "next/link";

const ViewOfficers: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [officers, setOfficers] = useState<{
    [key: string]: { name: string; email: string }
  }>({
    president: { name: "", email: "" },
    vicePresident: { name: "", email: "" },
    secretary: { name: "", email: "" },
    treasurer: { name: "", email: "" },
    auditor: { name: "", email: "" }
  });

  const router = useRouter();

  useEffect(() => {
    const fetchOfficers = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        try {
          const usersRef = collection(db, "Users");
          const userQuery = query(usersRef, where("email", "==", currentUser.email));
          const userDocs = await getDocs(userQuery);

          if (!userDocs.empty) {
            const userData = userDocs.docs[0].data();
            const orgId = userData.organizationId;

            const orgDoc = await getDoc(doc(db, "Organizations", orgId));
            if (orgDoc.exists()) {
              setOrganizationName(orgDoc.data()?.name || "Unknown Organization");
            }

            const officerDoc = await getDoc(doc(db, "officers", orgId));
            const officerData = officerDoc.exists() ? officerDoc.data() : {};

            const officerUids = {
              president: officerData.president || "",
              vicePresident: officerData.vicePresident || "",
              secretary: officerData.secretary || "",
              treasurer: officerData.treasurer || "",
              auditor: officerData.auditor || ""
            };

            // Fetch main officers
            const memberPromises = Object.entries(officerUids).map(async ([position, uid]) => {
              if (uid) {
                const memberDoc = await getDoc(doc(db, "Users", uid));
                if (memberDoc.exists()) {
                  const memberData = memberDoc.data();
                  return {
                    position,
                    name: memberData?.fullName || "Full name not available",
                    email: memberData?.email || "Email not available"
                  };
                } else {
                  return {
                    position,
                    name: "Member document not found",
                    email: ""
                  };
                }
              } else {
                return { position, name: "Not assigned", email: "" };
              }
            });

            // Fetch additional officers
            let additionalOfficerCards: any[] = [];
            if (Array.isArray(officerData.additionalOfficers)) {
              additionalOfficerCards = await Promise.all(
                officerData.additionalOfficers.map(async (addOfficer: any, idx: number) => {
                  if (addOfficer.name) {
                    const memberDoc = await getDoc(doc(db, "Users", addOfficer.name));
                    if (memberDoc.exists()) {
                      const memberData = memberDoc.data();
                      return {
                        position: addOfficer.position || `Additional Officer ${idx + 1}`,
                        name: memberData?.fullName || "Full name not available",
                        email: memberData?.email || "Email not available"
                      };
                    } else {
                      return {
                        position: addOfficer.position || `Additional Officer ${idx + 1}`,
                        name: "Member document not found",
                        email: ""
                      };
                    }
                  } else {
                    return {
                      position: addOfficer.position || `Additional Officer ${idx + 1}`,
                      name: "Not assigned",
                      email: ""
                    };
                  }
                })
              );
            }

            const officerList = await Promise.all(memberPromises);

            // Combine main and additional officers
            const officerMap: any = {};
            officerList.forEach(({ position, name, email }) => {
              officerMap[position] = { name, email };
            });
            additionalOfficerCards.forEach(({ position, name, email }) => {
              officerMap[position] = { name, email };
            });

            setOfficers(officerMap);
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

  const capitalizePosition = (position: string) => {
    return position.replace(/([A-Z])/g, ' $1').toUpperCase(); 
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
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <button
              onClick={() => router.back()}
              className="mr-4 text-purple-700 hover:text-purple-900 font-bold"
            >
              &#8592;
            </button>
            <h1 className="text-3xl font-bold text-black">
              Officers of {organizationName}
            </h1>
            <Link href="/viewofficersofficerview" className="ml-auto">
              <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {Object.entries(officers).map(([position, officer]) => (
            <div
              key={position}
              className="flex flex-col items-center bg-[#f8fafc] rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-transform duration-300 hover:-translate-y-2 relative"
            >
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg mb-4 border-4 border-blue-400 ring-4 ring-blue-200">
                {officer.name && officer.name !== "Not assigned" && officer.name !== "Member document not found" ? (
                  <span className="text-4xl font-extrabold text-blue-600">
                    {officer.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full shadow">
                {capitalizePosition(position)}
              </span>
              <h2 className="text-xl font-bold text-gray-800 mb-1 text-center mt-2">{officer.name}</h2>
              <p className="text-sm text-gray-500 font-medium text-center tracking-wide">
                {officer.name === "Not assigned" || officer.name === "Member document not found"
                  ? "Vacant"
                  : officer.email}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ViewOfficers;
