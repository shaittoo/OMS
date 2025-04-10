import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import MemberViewTask from "../components/memberviewtask"
import { onAuthStateChanged} from "firebase/auth";

const MemberViewTasks = () => {
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          const userData = userDoc.data();

          if (userData?.role === "member") {
            setIsMember(true); // User is authorized as a member
          } else {
            router.push("/"); // Redirect non-members to home
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          router.push("/"); // Redirect in case of error
        }
      } else {
        router.push("/login"); // Redirect unauthenticated users to login
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render MemberDashboard if the user is a member
  return isMember ? <MemberViewTask /> : null;
};

export default MemberViewTasks;
