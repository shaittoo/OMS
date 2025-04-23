import React, { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the import path based on your project structure

interface ViewEventProps {
  close: () => void;
  event: Event;
  orgName: string;
}

interface Event {
    uid: string;
    eventDate: string | Date;
    eventName: string;
    eventDescription: string;
    eventImages: string[];
    eventLocation: string;
    eventPrice: string;
    eventType: string;
    isFree: string;
    isOpenForAll: boolean;
    tags: string[];
    status: string;
    organizationId: string;
    registrations: number;
    organizationName?: string;
    likedBy: string[];
    interestedBy: string[];
}

interface Comments {
    uid: string;
    eventId: Event['uid'];
    comment: string;
    replies: string[];
    userName: string;
}


const ViewEvent: React.FC<ViewEventProps> = ({ close, event, orgName }) => {
    const [name, setName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comments[]>([]);
    const [newComment, setNewComment] = useState<string>("");

    // Function to fetch the username based on userId
    const fetchUserData = async (userId: string) => {
        try {
          // Fetch the user's data from the 'Users' collection
          const userDoc = await getDoc(doc(db, "Users", userId));
          const userData = userDoc.data();
    
          // Ensure the user exists and has a memberId
          if (userData?.memberId) {
            // Fetch the user details from the 'members' collection using memberId
            const memberDoc = await getDoc(doc(db, "members", userData.memberId));
            const memberData = memberDoc.data();
    
            if (memberData) {
              // Set the first name from the 'members' collection
              setName(memberData.fullName);
            }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
          } finally {
            setLoading(false);
          }
        };
            

    // Fetch comments from Firestore
    const fetchComments = async () => {
        try {
            const q = query(collection(db, "comments"), where("eventId", "==", event.uid));
            const querySnapshot = await getDocs(q);
            const fetchedComments: Comments[] = [];
            for (const doc of querySnapshot.docs) {
                const data = doc.data() as Comments;
                if (data.eventId === event.uid) {
                    const userName = await name;
                    const { uid, userName: fetchedUserName, ...rest } = data; // Rename userName to fetchedUserName
                    fetchedComments.push({ uid: doc.id, userName: userName || "Anonymous", ...rest });
                }
            }
            setComments(fetchedComments);
        } catch (error) {
            console.error("Error fetching comments: ", error);
        }
    };

    // Add a new comment to Firestore
    const addComment = async () => {
        if (!newComment.trim()) return;
        try {
            const userId = "currentUserId"; // Replace with the actual user ID from your auth context
            const userName = await name;
            const docRef = await addDoc(collection(db, "comments"), {
                uid: userId,
                eventId: event.uid,
                comment: newComment,
                replies: [],
                timestamp: serverTimestamp(),
                userName: userName || "Anonymous",
            });
            setComments((prev) => [
                            ...prev,
                            { uid: docRef.id, eventId: event.uid, comment: newComment, replies: [], userName: userName || "Anonymous" },
                        ]);
            setNewComment("");
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    };

    // Fetch comments when the component mounts
    React.useEffect(() => {
        fetchComments();
    }, []);
    
    const truncateText = (text: string | undefined) => {
        return text && text.length > 100 ? text.substring(0, 100) + "..." : text || "";
    };

  return (
    <div
      className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[16.5%] z-50"
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
                            {comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div
                                        key={comment.uid}
                                        className="p-2 border border-gray-200 rounded-lg bg-white shadow-sm"
                                    >
                                        <p className="text-sm font-semibold text-gray-900">
                                            {comment.userName || "Anonymous"}
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
