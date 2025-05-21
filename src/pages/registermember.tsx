import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState, FormEvent } from "react";
import { auth, db } from "../firebaseConfig";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { setDoc, doc, where, collection, query, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import Select from 'react-select';
import "@fortawesome/fontawesome-free/css/all.min.css";

const courseOptions = [
  { label: "BS in Accountancy (5 yrs)", value: "BS in Accountancy (5 yrs)" },
  { label: "BS in Business Administration (Marketing)", value: "BS in Business Administration (Marketing)" },
  { label: "BS in Management", value: "BS in Management" },
  { label: "BS in Applied Mathematics", value: "BS in Applied Mathematics" },
  { label: "BS in Biology", value: "BS in Biology" },
  { label: "BS in Chemistry", value: "BS in Chemistry" },
  { label: "BA in Communication & Media Studies", value: "BA in Communication & Media Studies" },
  { label: "BA in Community Development", value: "BA in Community Development" },
  { label: "BS in Computer Science", value: "BS in Computer Science" },
  { label: "BS in Economics", value: "BS in Economics" },
  { label: "BA in History", value: "BA in History" },
  { label: "BA in Literature", value: "BA in Literature" },
  { label: "BA in Political Science", value: "BA in Political Science" },
  { label: "BA in Psychology", value: "BA in Psychology" },
  { label: "BS in Public Health", value: "BS in Public Health" },
  { label: "BA in Sociology", value: "BA in Sociology" },
  { label: "BS in Statistics", value: "BS in Statistics" },
  { label: "BS in Fisheries", value: "BS in Fisheries" }
];

const yearOptions = [
  "1st Year", "2nd Year", "3rd Year", "4th Year", "Nth Year"
];


function RegisterMember() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fname, setFname] = useState<string>("");
  const [lname, setLname] = useState<string>("");
  const [course, setCourse] = useState<string>(""); 
  const [yearLevel, setYearLevel] = useState<number | string>(""); 
  const [contactNumber, setContactNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  

  // Input validation
  const validateInputs = (): boolean => {
    if (fname.trim().length < 2 || lname.trim().length < 2) {
      toast.error("First and Last name must be at least 2 characters.");
      return false;
    }
    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return false;
    }
    if (!email.endsWith("@up.edu.ph")) {
      toast.error("Only UP email addresses (@up.edu.ph) are allowed for registration.");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  // Check if email is unique
  const isEmailUnique = async (email: string): Promise<boolean> => {
    const memberQuery = query(collection(db, "members"), where("email", "==", email));
    const snapshot = await getDocs(memberQuery);
    return snapshot.empty;
  };

  // Register user and store data in Firestore
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Check for email uniqueness
      const emailIsUnique = await isEmailUnique(email);
      if (!emailIsUnique) {
        toast.error("Email already exists. Please choose another.");
        setLoading(false);
        return;
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // User created successfully
      if (user) {
        const memberId = uuidv4(); // Generate unique member ID
        console.log("User created: ", user.uid);
        console.log("Member ID: ", memberId);

        // Combine first and last name to create fullName
        const fullName = `${fname} ${lname}`;

        // Save user data in Firestore under 'members' collection
        await setDoc(doc(db, "members", memberId), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          fullName: fullName,  
          course: course,
          yearLevel: yearLevel,
          contactNumber: contactNumber,
          role: "member",
          joinedAt: new Date(),
        });

        // Save user info in 'Users' collection to link memberId with Firebase user
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          memberId: memberId, // Link to member document
          fullName: fullName,  // Store fullName in Users collection
          course: course,
          yearLevel: yearLevel,
          contactNumber: contactNumber,
          role: "member",
        });

        toast.success("User Registered Successfully!!", {
          position: "top-center",
        });
        setTimeout(() => (window.location.href = "/login"), 3000);
      }
    } catch (error) {
      // Log detailed error information for debugging
      const errorMessage = (error as Error).message || "An unexpected error occurred.";
      console.error("Registration Error: ", errorMessage);
      toast.error(errorMessage, {
        position: "bottom-center",
      });
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
		<div className="bg-gradient-to-tr from-purple-400 via-fuchsia-500 to-indigo-700 min-h-screen flex items-center justify-center">
			<ToastContainer /> {/* Added here for toasts to render */}
			<div className="flex w-[60%] max-w-7xl bg-white shadow-md rounded-xl overflow-hidden">
				{/* Left Side (Logo and Welcome) */}
				<div className="w-1/2 bg-gradient-to-tr from-purple-200 via-fuchsia-200 to-indigo-300 text-white p-8 flex flex-col justify-center items-center">
					<img
						src="/assets/OMSLOGO.png"
						alt="OMS Logo"
						className="h-32 mb-4"
					/>
					<h1 className="text-3xl font-bold mb-4 text-center text-purple-800 drop-shadow-lg">
						Welcome to OMS
					</h1>
					<p className="text-lg text-center mb-8 text-purple-800 drop-shadow-lg">
						Sign up to continue access.
					</p>

					{/* Social Login Buttons */}
					<div className="flex flex-col items-center">
						<button className="w-[105%] bg-red-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4 flex items-center justify-center">
							<i className="fab fa-google mr-2"></i> Sign up with Google
						</button>
						<button className="w-[105%] bg-blue-800 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center">
							<i className="fab fa-facebook-f mr-2"></i> Sign up with Facebook
						</button>
					</div>
					<p className="text-center mt-8 text-sm text-purple-800 drop-shadow-lg">
						www.organizationmanagementsystem.com
					</p>
				</div>

				{/* Right Side (Form) */}
				<div className="w-1/2 p-8">
					<h3 className="text-2xl font-bold text-center mb-6">SIGN UP</h3>

					<form
						onSubmit={handleRegister}
						className="flex flex-col"
					>
						<div className="mb-4">
							<input
								type="email"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
								placeholder="Email Address"
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="mb-4">
							<input
								type="password"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
								placeholder="Password"
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						<div className="mb-4">
							<input
								type="text"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
								placeholder="First Name"
								onChange={(e) => setFname(e.target.value)}
								required
							/>
						</div>
						<div className="mb-4">
							<input
								type="text"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
								placeholder="Last Name"
								onChange={(e) => setLname(e.target.value)}
								required
							/>
						</div>
						<div className="mb-4">
							<Select
								placeholder="Select Course"
								options={courseOptions}
								onChange={(selected) => setCourse(selected?.value || "")}
								className="text-sm"
								classNamePrefix="react-select"
								styles={{
									menuList: (base) => ({
										...base,
										maxHeight: 200,
										overflowY: "auto",
									}),
								}}
							/>
						</div>
						<div className="mb-4 relative">
							<select
								onChange={(e) => setYearLevel(e.target.value)}
								value={yearLevel}
								className="select-native appearance-none pr-10"
								required
							>
								<option
									value=""
									disabled
									hidden
									className="text-gray-400"
								>
									Select Year Level
								</option>
								{yearOptions.map((year, index) => (
									<option
										key={index}
										value={year}
									>
										{year}
									</option>
								))}
							</select>
							<div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
								<svg
									className="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
								</svg>
							</div>
						</div>

						<div className="mb-4">
							<input
								type="tel"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
								placeholder="Contact Number"
								onChange={(e) => setContactNumber(e.target.value)}
								required
							/>
						</div>

						<button
							type="submit"
							className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
							disabled={loading}
						>
							{loading ? "Signing Up..." : "SIGN UP"}
						</button>
					</form>

					<p className="text-center mt-4">
						Already registered?{" "}
						<a
							href="/login"
							className="text-purple-600 font-bold"
						>
							Login
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}


export default RegisterMember;
