import React, { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the import path based on your project structure
import { getAuth } from "firebase/auth";
import { Event, Comments } from "../types/event";

interface ViewEventProps {
  close: () => void;
  event: Event;
  orgName: string;
  onCommentAdded?: (newComment: Comments) => void;
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

const ViewEvent: React.FC<ViewEventProps> = ({ close, event, orgName, onCommentAdded }) => {
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comments[]>([]);
    const [newComment, setNewComment] = useState<string>("");
    const [currentUserName, setCurrentUserName] = useState<string>("");
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
        } catch (error) {
            console.error("Error fetching comments: ", error);
         } finally {
            setLoading(false);
        }
    };

    // Add a new comment to Firestore
    const addComment = async () => {
        if (!newComment.trim() || !auth.currentUser) return;
        
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
            if (onCommentAdded) {
                onCommentAdded({
                    ...commentData,
                    uid: docRef.id
                });
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    // Fetch current user's name and comments when component mounts
    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
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
      className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[17%]"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
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
                            {loading ? (
                                        <div className="flex justify-center items-center h-20">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
                                    className="bg-[#8736EA] text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200"
                                >
                                    Add Comment
                                </button>
                            </form>
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
