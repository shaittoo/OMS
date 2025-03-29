import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import CloseIcon from "@mui/icons-material/Close";

interface ProfileSettingsProps {
  close: () => void; // Prop to handle form closure
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ close }) => {
  const [userType, setUserType] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      // check what type of user, either officer, member or guest
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserType(data?.role || null);
            setUserData(data);
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      } else {
        setUserType("guest");
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  // save the updated profile
  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        await updateDoc(doc(db, "Users", user.uid), userData);
        alert("Profile updated successfully!");
      } catch (error) {
        console.error("Error updating profile: ", error);
      }
    }
  };

  // logout
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        alert("Logged out successfully!");
        close();
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
      });
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[18%] z-50"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      <div
        className="bg-gray-100 p-8 rounded-lg w-full max-w-md shadow-xl relative"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        {/* Close Button */}
        <button
          onClick={close}
          className="absolute top-2 right-2 p-2 rounded-md hover:bg-gray-200 transition duration-200"
          style={{ backgroundColor: "#e8e8e8" }}
        >
          <CloseIcon className="h-5 w-5 text-[#8736EA]" />
        </button>
        <h2
          className="text-2xl font-semibold mb-4 text-center"
          style={{ color: "#333399" }}
        >
          Profile Settings
        </h2>

        {userType === "organization" && ( // for officers or organization
          <form className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Change Logo
              </label>
              <input
                type="file"
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Organization Name
              </label>
              <input
                type="text"
                value={userData.name || ""}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Description
              </label>
              <textarea
                value={userData.description || ""}
                onChange={(e) =>
                  setUserData({ ...userData, description: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Type of Organization
              </label>
              <input
                type="text"
                value={userData.type || ""}
                onChange={(e) =>
                  setUserData({ ...userData, type: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Email
              </label>
              <input
                type="email"
                value={userData.email || ""}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Password
              </label>
              <input
                type="password"
                value={userData.password || ""}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full p-3 bg-red-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white"
                style={{ backgroundColor: "#c6a6ed" }}
              >
                Logout
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="w-full p-3 bg-purple-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white"
                style={{ backgroundColor: "#8736EA" }}
              >
                Save
              </button>
            </div>
          </form>
        )}
        {userType === "member" && (
          <form className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Change Profile Photo
              </label>
              <input
                type="file"
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Name
              </label>
              <input
                type="text"
                value={userData.name || ""}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Email
              </label>
              <input
                type="email"
                value={userData.email || ""}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "#333399" }}
              >
                Password
              </label>
              <input
                type="password"
                value={userData.password || ""}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full p-3 bg-red-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white"
                style={{ backgroundColor: "#8736EA" }}
              >
                Logout
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="w-full p-3 bg-purple-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white"
                style={{ backgroundColor: "#8736EA" }}
              >
                Save
              </button>
            </div>
          </form>
        )}
        {userType === "guest" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => alert("Sign In")}
              className="w-full p-3 bg-blue-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white"
              style={{ backgroundColor: "#8736EA" }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => alert("Login")}
              className="w-full p-3 bg-green-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white"
              style={{ backgroundColor: "#8736EA" }}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
