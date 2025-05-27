import React, { useState, FormEvent } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import FontAwesome CSS

function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in successfully");

      const userDoc = await getDoc(doc(db, "Users", userCredential.user.uid));
      const userData = userDoc.data();

      if (userData?.role === "member") {
        router.push("/memberpage");
      } else if (userData?.role === "organization") {
        // Check organization status
        const orgDoc = await getDoc(doc(db, "Organizations", userData.organizationId));
        const orgData = orgDoc.data();
        
        if (!orgData) {
          toast.error("Organization data not found", { position: "bottom-center" });
          return;
        }

        // Redirect based on organization status
        if (orgData.status === "pending") {
          router.push("/orgstatus");
          return;
        } else if (orgData.status === "rejected") {
          router.push("/orgstatus");
          return;
        } else if (orgData.status === "accepted") {
          router.push("/orgpage");
        } else {
          router.push("/orgstatus");
        }
      } else if (userData?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/restrictedpage");
      }

      toast.success("User logged in successfully", { position: "top-center" });
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful:", result);
      toast.success("Signed in with Google successfully", { position: "top-center" });
      router.push("/profile");
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  const handleFacebookSignUp = async () => {
    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Facebook sign-in successful:", result);
      toast.success("Signed in with Facebook successfully", { position: "top-center" });
      router.push("/profile");
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  return (
		<div className="bg-gradient-to-tr from-purple-400 via-fuchsia-500 to-indigo-700 min-h-screen flex items-center justify-center">
			<ToastContainer />
			<div className="flex w-[60%] max-w-7xl bg-white shadow-md rounded-xl overflow-hidden">
				{/* Left Side (Logo and Welcome) */}
				<div className="w-1/2 bg-gradient-to-tr from-purple-200 via-fuchsia-200 to-indigo-300 text-white p-8 flex flex-col justify-center items-center">
					<img
						src="/assets/OMSLOGO.png"
						alt="OMS Logo"
						className="h-32 mb-4 mt-2"
					/>
					<h1 className="text-4xl font-bold mb-8 text-center text-purple-800 drop-shadow-lg">
						Welcome to OMS
					</h1>
					<p className="text-lg text-center mb-2 text-purple-800 drop-shadow-lg">
						Sign in to continue access.
					</p>
					<div className="flex flex-col items-center">
						<button
							onClick={handleGoogleSignUp}
							className="w-[105%] bg-red-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4 flex items-center justify-center"
						>
							<i className="fab fa-google mr-2  "></i> Sign in with Google
						</button>
						<button
							disabled
							className="w-[105%] bg-gray-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center cursor-not-allowed opacity-70"
						>
							<i className="fab fa-facebook-f mr-2"></i> Sign in with Facebook
						</button>
					</div>
          <p className="text-center mt-8 text-sm text-purple-900 drop-shadow-md">
            www.organizationmanagementsystem.com
          </p>
				</div>
				{/* Right Side (Form) */}
				<div className="w-1/2 p-8 pb-1 pt-10">
					<h3 className="text-2xl font-bold text-center mb-6">SIGN IN</h3>
					<form onSubmit={handleSubmit}>
						<div className="mb-3">
							<label
								htmlFor="email"
								className="block text-gray-700 font-medium mb-2"
							>
								Email address
							</label>
							<input
								id="email"
								type="email"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
								placeholder="Enter email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="password"
								className="block text-gray-700 font-medium mb-2"
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
								placeholder="Enter password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<div className="d-grid">
						<button
						type="submit"
						className="w-full h-[55px] relative
							font-sans font-semibold text-base text-white
							cursor-pointer border-none rounded-[3px]
							bg-gradient-to-r from-purple-600 via-blue-500 via-purple-600 to-blue-700
							bg-[length:300%_100%] bg-left hover:bg-right
							transition-[background-position] duration-500 ease-in-out
							focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
						>
						<span className="relative z-10">Submit</span>
						</button>
						</div>
					</form>
					<p className="text-center mt-4">
						New user?{" "}
						<a
							href="/choose"
							className="text-purple-600 font-bold"
						>
							Register Here
						</a>
					</p>
					<br />
					<hr />
				</div>
			</div>
		</div>
	);
}

export default Login;
