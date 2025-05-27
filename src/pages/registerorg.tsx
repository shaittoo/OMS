import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState, FormEvent } from "react";
import { auth, db, storage } from "../firebaseConfig";
import { setDoc, doc, where, collection, query, getDocs } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { S3Client } from "@aws-sdk/client-s3";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import AWS from "aws-sdk";

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
  const router = useRouter();

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

    const s3 = new AWS.S3({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
      region: process.env.NEXT_PUBLIC_AWS_REGION
    });

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
          officers: [user.uid],
          createdAt: new Date(),
          status: "pending",
          tags: tags,
        });

        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          organizationId: organizationId,
          role: "organization",
        });

        toast.success("Organization registered successfully!", {
          position: "top-center",
        });
        
        // Redirect to registration submitted page
        router.push('/registration-submitted');
      }

    } catch (error) {
      const errorMessage = (error as Error).message || "An unexpected error occurred.";
      setErrorMessage(errorMessage);
      toast.error(errorMessage, {
        position: "bottom-center",
      });
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
		<div className="bg-gradient-to-tr from-purple-400 via-fuchsia-500 to-indigo-700 min-h-screen flex items-center justify-center shadow-lg">
			<div className="flex h-[650px] w-[65%] max-w-6xl bg-white shadow-lg rounded-xl overflow-hidden ">
				{/* Left Side - Registration Form */}
        <div className="w-full md:w-1/2 p-8 overflow-y-auto">
					<h3 className="text-2xl font-bold text-center mb-6">
						Register Organization
					</h3>

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

					<form
						onSubmit={handleRegister}
						className="space-y-2"
					>
						<div>
							<label
								htmlFor="oname"
								className="block text-gray-600 font-medium mb-1"
							>
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
							<label
								htmlFor="description"
								className="block text-gray-600 font-medium mb-1"
							>
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
							<label
								htmlFor="tags"
								className="block text-gray-600 font-medium mb-1 mt-[-8px]"
							>
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
							<label
								htmlFor="email"
								className="block text-gray-600 font-medium mb-1"
							>
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
							<label
								htmlFor="password"
								className="block text-gray-600 font-medium mb-1"
							>
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

						 <div className="space-y-4">
            <label className="block text-gray-600 font-medium mb-0">
              Organization Logo
            </label>
            <div className="flex items-center space-x-6">
              <div className="flex-1">
                <label className="group mt-[-8px] mb-3 relative flex items-center justify-center w-full h-[120px] border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleLogoChange}
                    accept="image/*"
                  />
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-purple-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-500 group-hover:text-purple-500">
                      Click to upload logo
                    </p>
                  </div>
                </label>
              </div>
              {logoPreview && (
                <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-purple-500">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
			
			<button
            type="submit"
            disabled={loading}
            className="w-full h-[55px] relative
							font-sans font-semibold text-base text-white
							cursor-pointer border-none rounded-[3px]
							bg-gradient-to-r from-purple-600 via-blue-500 via-purple-600 to-blue-700
							bg-[length:300%_100%] bg-left hover:bg-right
							transition-[background-position] duration-500 ease-in-out
							focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </span>
            ) : (
              "Register Organization"
            )}
          </button>
					</form>
					<p className="text-center mt-4 text-gray-600">
						Already have an account?{" "}
						<a
							href="/login"
							className="text-purple-600 font-bold"
						>
							Login
						</a>
					</p>
				</div>

				{/* Right Side - OMS Welcome Section */}
	<div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 
  backdrop-filter backdrop-blur-lg
  p-10 flex-col justify-center items-center">
	<div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md 
		shadow-xl border border-white/20">
          <img
            src="/assets/OMSLOGO.png"
            alt="OMS Logo"
            className="h-32 mx-auto mb-8 drop-shadow-xl transform hover:scale-105 transition-all duration-300"
          />
          <h1 className="text-4xl font-bold mb-2 text-purple-900 text-center">
            Welcome to OMS
          </h1>
          <p className="text-lg text-purple-900 text-center mb-6">
            Register your organization and start managing it efficiently with us.
          </p>
        </div>
      </div>
    </div>
  </div>
	);
}

export default RegisterOrg;