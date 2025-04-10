import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import MemberSidebar from "../components/membersidebar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MemberProfileSettings: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Get member data if available
            if (userData.memberId) {
              const memberDoc = await getDoc(doc(db, "members", userData.memberId));
              if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                setFirstName(memberData.firstName || "");
                setLastName(memberData.lastName || "");
                setPhone(memberData.phone || "");
              }
            }
            
            setEmail(user.email || "");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load profile data");
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to update your profile");
        return;
      }

      // Get user data to find memberId
      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.memberId) {
          // Update member data
          await updateDoc(doc(db, "members", userData.memberId), {
            firstName,
            lastName,
            phone,
          });
          
          toast.success("Profile updated successfully");
        } else {
          toast.error("Member profile not found");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <MemberSidebar />
        <div className="flex-grow p-6 bg-white overflow-y-auto">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <MemberSidebar />
      <div className="flex-grow p-6 bg-white overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-center" style={{ color: "#333399" }}>
            Profile Settings
          </h2>
          
          <form onSubmit={handleSubmit} className="bg-gray-100 p-8 rounded-lg shadow-xl" style={{ backgroundColor: "#f9f9f9" }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium" style={{ color: "#333399" }}>
                  First Name
                </label>
                <input
                  className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium" style={{ color: "#333399" }}>
                  Last Name
                </label>
                <input
                  className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium" style={{ color: "#333399" }}>
                  Email
                </label>
                <input
                  className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300 bg-gray-100"
                  type="email"
                  value={email}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium" style={{ color: "#333399" }}>
                  Phone Number
                </label>
                <input
                  className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full p-3 text-white font-semibold rounded-md transition-colors duration-200 mr-2"
                  style={{ backgroundColor: "red" }}
                >
                  Logout
                </button>
                <button
                  type="submit"
                  className="w-full p-3 text-white font-semibold rounded-md transition-colors duration-200 ml-2"
                  style={{ backgroundColor: "#8736EA" }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileSettings; 