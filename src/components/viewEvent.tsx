import React, { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the import path based on your project structure
import { getAuth } from "firebase/auth";
import { Event, Comments } from "../types/event";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ViewEventProps {
  close: () => void;
  event: Event;
  orgName: string;
  canComment?: boolean;
}

interface MemberData {
    contactNumber: string;
    course: string;
    email: string;
    firstName: string;
    fullName: string;
    joinedAt: Date;
    lastName: string;
    role: string;
    yearLevel: string;
}

const ViewEvent: React.FC<ViewEventProps> = ({ close, event, orgName, canComment = true }) => {
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comments[]>([]);
    const [newComment, setNewComment] = useState<string>("");
    const [currentUserName, setCurrentUserName] = useState<string>("");
    const [loadingComments, setLoadingComments] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const auth = getAuth();

    // Function to fetch the current user's full name
    const fetchCurrentUserName = async () => {
        if (!auth.currentUser) return;
        
        try {
            const userDoc = await getDoc(doc(db, "Users", auth.currentUser.uid));
            const userData = userDoc.data();
            
            if (userData?.email) {
                const membersQuery = query(
                    collection(db, "members"),
                    where("email", "==", userData.email)
                );
                const memberSnapshot = await getDocs(membersQuery);
                
                if (!memberSnapshot.empty) {
                    const memberData = memberSnapshot.docs[0].data() as MemberData;
                    setCurrentUserName(memberData.fullName);
                    return memberData.fullName;
                }
            }
            return "Unknown User";
        } catch (error) {
            console.error("Error fetching current user data:", error);
            return "Unknown User";
        }
    };

    // Function to fetch commenter's full name
    const fetchCommenterName = async (userId: string) => {
        try {
            const userDoc = await getDoc(doc(db, "Users", userId));
            const userData = userDoc.data();
            
            if (userData?.email) {
                const membersQuery = query(
                    collection(db, "members"),
                    where("email", "==", userData.email)
                );
                const memberSnapshot = await getDocs(membersQuery);
                
                if (!memberSnapshot.empty) {
                    const memberData = memberSnapshot.docs[0].data() as MemberData;
                    return memberData.fullName;
                }
            }
            return "Unknown User";
        } catch (error) {
            console.error("Error fetching commenter data:", error);
            return "Unknown User";
        }
    };

    // Fetch comments from Firestore
    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const q = query(collection(db, "comments"), where("eventId", "==", event.uid));
            const querySnapshot = await getDocs(q);
            const fetchedComments: Comments[] = [];
            
            for (const doc of querySnapshot.docs) {
                const data = doc.data();
                if (data.eventId === event.uid) {
                    const userName = await fetchCommenterName(data.uid);
                    fetchedComments.push({
                        uid: doc.id,
                        eventId: data.eventId,
                        comment: data.comment,
                        replies: data.replies || [],
                        userName: userName,
                        userEmail: data.userEmail
                    });
                }
            }
            setComments(fetchedComments);
            setLoadingComments(false);
            
        } catch (error) {
            console.error("Error fetching comments: ", error);
        }
    };

    // Add a new comment to Firestore
    const addComment = async () => {
        if (!newComment.trim() || !auth.currentUser) return;
        
        setIsSubmitting(true);
        try {
            const userId = auth.currentUser.uid;
            const userDoc = await getDoc(doc(db, "Users", userId));
            const userData = userDoc.data();
            
            const commentData: Comments = {
                uid: userId,
                eventId: event.uid,
                comment: newComment,
                replies: [],
                userName: currentUserName,
                userEmail: userData?.email,
                timestamp: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "comments"), commentData);

            setComments(prev => [
                ...prev,
                {
                    ...commentData,
                    uid: docRef.id
                }
            ]);
            setNewComment("");
            toast.success("Comment added successfully", {
                style: {
                    color: "#7E22CE",
                    backgroundColor: "rgba(243, 232, 255, 0.95)",
                    fontWeight: 500,
                },
                icon: false
            });
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Failed to add comment", {
                style: {
                    color: "#DC2626",
                    backgroundColor: "rgba(254, 226, 226, 0.95)",
                    fontWeight: 500,
                },
                icon: false
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch current user's name and comments when component mounts
    useEffect(() => {
        const initialize = async () => {
            await fetchCurrentUserName();
            await fetchComments();
        };
        initialize();
    }, [event.uid]);
    
    const truncateText = (text: string | undefined) => {
        return text && text.length > 100 ? text.substring(0, 100) + "..." : text || "";
    };

  return (
    <div
      className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center z-50"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar
        closeButton={false}
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        toastStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            color: "#374151",
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
            fontSize: "14px",
            padding: "12px 16px",
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            margin: "0 0 16px 0",
        }}
      />
      <div
        className="bg-white p-10 rounded-lg w-full max-w-4xl shadow-xl relative"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        {/* Close Button */}
        <button
          onClick={close}
          className="absolute top-3 right-2 p-3 rounded-md hover:bg-purple-200 hover:text-white transition duration-200"
          style={{ backgroundColor: "#e8e8e8" }}
        >
          <CloseIcon className="h-5 w-5 text-[#8736EA]" />
        </button>
        <div className="w-full">
            <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                    <div className="mt-6 md:col-span-1 md:col-start-1">
                            {event.eventImages && event.eventImages.length > 0 ? (
                        <img
                            src={event.eventImages[event.eventImages.length - 1]}
                            alt={event.eventImages[event.eventImages.length - 1]}
                            className="w-full h-48 object-cover rounded-md"
                        />
                        ) : (
                        <div className="w-full h-48 bg-gray-300 flex items-center justify-center rounded-md">
                            <p className="text-gray-500">No Image Available</p>
                        </div>
                        )}
                        <h2 className="text-xl font-semibold mt-4">{event.eventName}</h2>
                        <p className="text-gray-600 mt-2">
                            {truncateText(event.eventDescription)}
                        </p>
                        <p className="text-gray-500 mt-2">
                            <CorporateFareIcon />
                            &nbsp; {orgName}
                        </p>
                        <p className="text-gray-400 mt-2">
                            <EventIcon />
                            &nbsp;
                            {event.eventDate instanceof Date
                            ? event.eventDate.toLocaleDateString()
                            : event.eventDate}
                        </p>
                    </div>
                    <div className="md:col-span-1 md:col-start-2">
                        <h2 className="text-2xl font-semibold mb-4 text-center text-[#8736EA]">
                            Comments
                        </h2>
                        <div
                            className="space-y-4 overflow-y-auto"
                            style={{ maxHeight: "200px" }}
                        >
                            {loadingComments ? (
                                <div className="flex justify-center items-center h-24">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div
                                        key={comment.uid}
                                        className="p-2 border border-gray-200 rounded-lg bg-white shadow-sm"
                                    >
                                        <p className="text-sm font-semibold text-gray-900">
                                            {comment.userName}
                                        </p>
                                        <p className="text-sm text-gray-700">{comment.comment}</p>
                                        {comment.replies.length > 0 && (
                                            <div className="mt-1 pl-3 border-l border-gray-200">
                                                {comment.replies.map((reply, index) => (
                                                    <p key={index} className="text-xs text-gray-500">
                                                        {reply}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                            )}
                        </div>
                        <div className="mt-4">
                             {canComment && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    addComment();
                                }}
                                className="flex flex-col space-y-4"
                            >
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write your comment here..."
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={3}
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#8736EA] text-white py-2 px-4 rounded-md hover:bg-purple-700 
                                        transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" 
                                                    stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" 
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                                </path>
                                            </svg>
                                            Adding comment...
                                        </span>
                                    ) : (
                                        "Add Comment"
                                    )}
                                </button>
                            </form>
                            )}
                        </div>
                            
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ViewEvent;
