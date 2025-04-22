import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState, FormEvent } from "react";
import { auth, db } from "../firebaseConfig";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { setDoc, doc, where, collection, query, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

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
    <div 
      className="bg-gradient-to-br from-indigo-300 to-fuchsia-700 min-h-screen flex items-center justify-center"
    >
      <ToastContainer /> {/* Added here for toasts to render */}
      <div className="flex w-[60%] max-w-7xl bg-white shadow-md rounded-lg overflow-hidden">
        {/* Left Side (Logo and Welcome) */}
        <div className="w-1/2 bg-gradient-to-br from-gray-200 to-purple-500 text-white p-8 flex flex-col justify-center items-center"> 
          <img src="/assets/OMSLOGO.png" alt="OMS Logo" className="h-32 mb-4" /> 
          <h1 className="text-3xl font-bold mb-4 text-center">Welcome to OMS</h1>
          <p className="text-lg text-center mb-8">Sign up to continue access.</p>
          
          {/* Social Login Buttons */}
          <div className="flex flex-col items-center">
            <button className="w-[105%] bg-red-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4 flex items-center justify-center">
              <i className="fab fa-google mr-2"></i> Sign up with Google
            </button>
            <button className="w-[105%] bg-blue-800 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center">
              <i className="fab fa-facebook-f mr-2"></i> Sign up with Facebook
            </button>
          </div>
          <p className="text-center mt-8 text-sm">www.organizationmanagementsystem.com</p>
        </div>

        {/* Right Side (Form) */}
        <div className="w-1/2 p-8">
          <h3 className="text-2xl font-bold text-center mb-6">SIGN UP</h3>

          <form onSubmit={handleRegister} className="flex flex-col">
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
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Course"
                onChange={(e) => setCourse(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Year Level"
                onChange={(e) => setYearLevel(e.target.value)}
                required
              />
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
            <a href="/login" className="text-purple-600 font-bold">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}


export default RegisterMember;
