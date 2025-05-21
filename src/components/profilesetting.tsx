import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import CloseIcon from "@mui/icons-material/Close";
import AWS from 'aws-sdk';

interface ProfileSettingsProps {
  close: () => void; // Prop to handle form closure
}

// Add this modal component at the top of your file
const InfoModal: React.FC<{ open: boolean; onClose: () => void; message: string }> = ({ open, onClose, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-4 text-purple-700">Notice</h2>
        <p className="mb-6">{message}</p>
        <button
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 font-semibold"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ close }) => {
  const [userType, setUserType] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [infoModal, setInfoModal] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  // Configure AWS
  AWS.config.update({
    region: 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
    }
  });

  const s3 = new AWS.S3();

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    const fileName = `organization-logos/${Date.now()}-${file.name}`;
    
    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'oms-128',
      Key: fileName,
      Body: file,
      ContentType: file.type
    };

    try {
      const upload = s3.upload(params);
      
      upload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        setUploadProgress(percentage);
      });

      const result = await upload.promise();
      const region = 'ap-southeast-1';
      const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'oms-128';
      const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
      return publicUrl;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        let updatedData = { ...userData };

        if (selectedFile) {
          try {
            const logoUrl = await uploadToS3(selectedFile);
            updatedData.photo = logoUrl; // Change logoUrl to photo to match the data structure
          } catch (error) {
            console.error("Error uploading logo:", error);
            alert("Failed to upload logo. Please try again.");
            return;
          }
        }

        // Update both Users and Organizations collections
        await updateDoc(doc(db, "Users", user.uid), updatedData);
        
        if (userType === "organization") {
          // Get the organization ID from user data
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          const userData = userDoc.data();
          const organizationId = userData?.organizationId;

          if (organizationId) {
            await updateDoc(doc(db, "Organizations", organizationId), {
              ...updatedData,
              lastUpdated: new Date()
            });
          }
        }

        setUserData(updatedData);
        setInfoModal({ open: true, message: "Profile updated successfully!" });
        setUploadProgress(0);
        setSelectedFile(null);
        //window.location.reload(); // Reload the page to show updated logo
      } catch (error) {
        console.error("Error updating profile: ", error);
        setInfoModal({ open: true, message: "Failed to update profile. Please try again." });
      }
    }
  };

  // logout
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setInfoModal({ open: true, message: "Logged out successfully!" });
        close();
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
      });
  };
  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[17%] z-50"
        style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
      >
        <div
          className="bg-gray-100 p-12 rounded-lg w-full max-w-md shadow-xl relative max-h-[90vh] flex justify-center items-center overflow-y-auto"
          style={{ backgroundColor: "#f9f9f9", minHeight: "300px" }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: "#8736EA" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[17%] z-50"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Log out of your account?</h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      <InfoModal
        open={infoModal.open}
        onClose={() => {
          setInfoModal({ open: false, message: "" });
          if (infoModal.message === "Profile updated successfully!") {
            window.location.reload();
          }
        }}
        message={infoModal.message}
      />

      <div
        className="bg-gray-100 p-12 rounded-lg w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        {/* Close Button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-200 transition duration-200"
          style={{ backgroundColor: "#e8e8e8" }}
        >
          <CloseIcon className="h-5 w-5 text-[#8736EA]" />
        </button>
        <h2
          className="text-2xl font-semibold mb-6 text-center"
          style={{ color: "#333399" }}
        >
          Profile Settings
        </h2>

        {userType === "organization" && ( // for officers or organization
          <form className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Change Logo
              </label>
              {/* Show current logo if it exists */}
              {userData.photo && (
                <div className="mb-3 flex flex-col items-center">
                  <img
                    src={userData.photo}
                    alt="Current Logo"
                    className="h-24 w-24 object-contain rounded-full border mb-2"
                  />
                  <span className="text-xs text-gray-500">Current Logo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Organization Name
              </label>
              <input
                type="text"
                placeholder={userData.name || "Enter organization name"}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Description
              </label>
              <textarea
                placeholder={userData.description || "Enter organization description"}
                onChange={(e) =>
                  setUserData({ ...userData, description: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Type of Organization
              </label>
              <input
                type="text"
                placeholder={userData.type || "Enter organization type"}
                onChange={(e) =>
                  setUserData({ ...userData, type: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder={userData.email || "Enter email"}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder={userData.password || "Enter password"}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border rounded-md border-gray-300"
              />
            </div>
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full p-3 bg-red-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white mr-2"
                style={{ backgroundColor: "#dc2626" }}
              >
                Logout
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="w-full p-3 bg-purple-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white ml-2"
                style={{ backgroundColor: "#8736EA" }}
              >
                Save
              </button>
            </div>
          </form>
        )}
        {userType === "member" && (
          <form className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Change Profile Photo
              </label>
              <input
                type="file"
                className="mt-1 block w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Name
              </label>
              <input
                type="text"
                placeholder={userData.name || "Enter name"}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder={userData.email || "Enter email"}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#333399" }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder={userData.password || "Enter password"}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border rounded-md border-gray-300"
              />
            </div>
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full p-3 bg-red-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white mr-2"
                style={{ backgroundColor: "#dc2626" }}
              >
                Logout
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="w-full p-3 bg-purple-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white ml-2"
                style={{ backgroundColor: "#8736EA" }}
              >
                Save
              </button>
            </div>
          </form>
        )}
        {userType === "guest" && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setInfoModal({ open: true, message: "Sign In" })}
              className="w-full p-3 bg-blue-600 text-white font-semibold rounded-md transition-colors duration-200 hover:bg-white focus:ring-2 focus:ring-white mb-4"
              style={{ backgroundColor: "#8736EA" }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setInfoModal({ open: true, message: "Login" })}
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
