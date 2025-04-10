import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CloseIcon from "@mui/icons-material/Close";

interface ProfileSettingsProps {
  close: () => void;
}

const MemberProfileSettings: React.FC<ProfileSettingsProps> = ({ close }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
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
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to update your profile");
        return;
      }

      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.memberId) {
          await updateDoc(doc(db, "members", userData.memberId), {
            firstName,
            lastName,
            phone,
            lastUpdated: new Date()
          });
          
          toast.success("Profile updated successfully");
          close(); // Close the modal after successful update
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
      <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[17%] z-50">
        <div className="bg-gray-100 p-12 rounded-lg w-full max-w-md shadow-xl relative">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[17%] z-50">
      <div className="bg-gray-100 p-12 rounded-lg w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-200 transition duration-200"
        >
          <CloseIcon className="h-5 w-5 text-purple-700" />
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-center text-purple-700">
          Profile Settings
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-700">
              First Name
            </label>
            <input
              className="mt-1 block w-full px-4 py-2 border rounded-md border-gray-300"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700">
              Last Name
            </label>
            <input
              className="mt-1 block w-full px-4 py-2 border rounded-md border-gray-300"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700">
              Email
            </label>
            <input
              className="mt-1 block w-full px-4 py-2 border rounded-md border-gray-300 bg-gray-100"
              type="email"
              value={email}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700">
              Phone Number
            </label>
            <input
              className="mt-1 block w-full px-4 py-2 border rounded-md border-gray-300"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full p-3 bg-red-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-red-700 mr-2"
            >
              Logout
            </button>
            <button
              type="submit"
              className="w-full p-3 bg-purple-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-purple-700 ml-2"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberProfileSettings; 