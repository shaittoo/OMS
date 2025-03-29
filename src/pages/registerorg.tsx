import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState, FormEvent } from "react";
import { auth, db, storage } from "../firebaseConfig";
import { setDoc, doc, where, collection, query, getDocs } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import s3 from "../components/awsConfig";

function RegisterOrg() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [oname, setOname] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [otherTag, setOtherTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const validateInputs = (): boolean => {
    if (oname.trim().length < 3) {
      setErrorMessage("Organization name must be at least 3 characters.");
      setTimeout(() => setErrorMessage(null), 3000);
      return false;
    }
    if (description.trim().length < 10) {
      setErrorMessage("Organization description must be at least 10 characters.");
      setTimeout(() => setErrorMessage(null), 3000);
      return false;
    }
    if (!email.includes("@")) {
      setErrorMessage("Enter a valid email address.");
      setTimeout(() => setErrorMessage(null), 3000);
      return false;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setTimeout(() => setErrorMessage(null), 3000);
      return false;
    }
    return true;
  };

  const isOrganizationNameUnique = async (oname: string): Promise<boolean> => {
    const orgQuery = query(collection(db, "Organizations"), where("name", "==", oname));
    const snapshot = await getDocs(orgQuery);
    return snapshot.empty;
  };

  const uploadImage = async (file: File, organizationId: string): Promise<string> => {
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME ?? "";
    if (!bucketName) {
      throw new Error("S3_BUCKET_NAME is not defined");
    }

    const params = {
      Bucket: bucketName,
      Key: `logos/${organizationId}`,
      Body: file,
      ContentType: file.type,
    };

    await s3.upload(params).promise();

    const downloadURL = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
    return downloadURL;
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    try {
      if (!(await isOrganizationNameUnique(oname))) {
        setErrorMessage("Organization name already exists. Please choose another.");
        setTimeout(() => setErrorMessage(null), 3000);
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const organizationId = uuidv4();
        let photoURL = "";

        if (logo) {
          photoURL = await uploadImage(logo, organizationId);
        }

        await setDoc(doc(db, "Organizations", organizationId), {
          name: oname,
          email: user.email,
          photo: photoURL,
          description: description,
          members: [user.uid],
          createdAt: new Date(),
          tags: tags,
        });

        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          organizationId: organizationId,
          role: "organization",
        });

        setSuccessMessage("User Registered Successfully! Redirecting...");
        setTimeout(() => (window.location.href = "/login"), 3000);
      }

    } catch (error) {
      const errorMessage = (error as Error).message || "An unexpected error occurred.";
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedTag(value);

    if (value === "other" && otherTag.trim() !== "") {
      setTags(prevTags => [...prevTags, otherTag]);
    } else if (value !== "other" && !tags.includes(value)) {
      setTags(prevTags => [...prevTags, value]);
    }
  };

  const handleOtherTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherTag(e.target.value);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedLogo = e.target.files[0];
      setLogo(selectedLogo);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedLogo);
    }
  };

  return (
    <div className="bg-gradient-to-bl from-cyan-400 to-fuchsia-600 min-h-screen flex items-center justify-center shadow-lg">
      <div className="flex flex-col md:flex-row w-[65%] max-w-6xl bg-white shadow-lg rounded-xl overflow-hidden">

        {/* Left Side - Registration Form */}
        <div className="w-full md:w-1/2 p-8">
          <h3 className="text-2xl font-bold text-center mb-6">Register Organization</h3>

          {errorMessage && (
            <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-500 text-white p-3 rounded-md mb-4 text-center">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-2">
            <div>
              <label htmlFor="oname" className="block text-gray-600 font-medium mb-1">
                Organization Name
              </label>
              <input
                type="text"
                id="oname"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter organization name"
                onChange={(e) => setOname(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-gray-600 font-medium mb-1">
                Organization Description
              </label>
              <textarea
                id="description"
                className="h-[50%] w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter a short description of your organization"
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="tags" className="block text-gray-600 font-medium mb-1">
                Select Organization Tags
              </label>
              <select
                id="tags"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                onChange={handleTagChange}
                value={selectedTag}
              >
                <option value="">Select a tag</option>
                <option value="sports">Sports</option>
                <option value="academic">Academic</option>
                <option value="interest">Interest</option>
                <option value="other">Other (Specify)</option>
              </select>
              {selectedTag === "other" && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter your custom tag"
                    value={otherTag}
                    onChange={handleOtherTagChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-600 font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-600 font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center">
              <div className="w-full md:w-2/3">
                <label htmlFor="logo" className="block text-gray-600 font-medium mb-1">
                  Upload Logo
                </label>
                    <div className="relative"> 
                    <input
                        type="file"
                        id="logo"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-0" 
                    />
                    <label htmlFor="logo" className="text-purple-500 text-m font-bold underline cursor-pointer absolute top-0 left-0 w-full h-full flex w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"> 
                        Choose Org Logo
                    </label>
                </div>
              </div>
              <div className="w-24 h-24 rounded-full overflow-hidden ml-4 border-2 border-purple-500">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md mt-4 hover:bg-blue-700 focus:outline-none"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
          <p className="text-center mt-4 text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-purple-600 font-bold">
              Login
            </a>
          </p>
        </div>

        {/* Right Side - OMS Welcome Section */}
        <div className="w-full md:w-1/2 bg-gradient-to-bl from-cyan-200 to-fuchsia-500 text-white p-8 flex flex-col justify-center items-center">
          <img src="./assets/OMSLOGO.png" alt="OMS Logo" className="h-32 mb-6" />
          <h1 className="text-3xl font-extrabold mb-4 text-center">Welcome to OMS</h1>
          <p className="text-lg text-center mb-6">
            Register your organization and start managing it efficiently with us.
          </p>
          <p className="text-center mt-8 text-sm">www.organizationmanagementsystem.com</p>
        </div>
      </div>
    </div>
  );
}

export default RegisterOrg;