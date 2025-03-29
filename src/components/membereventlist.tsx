import React, { useEffect, useState } from "react";
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import EventIcon from "@mui/icons-material/Event";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";

interface Event {
  uid: string;
  eventDate: string | Date;
  eventName: string;
  eventDescription: string;
  eventImages: string[];
  organizationId: string;
  likedBy: string[];
  dislikedBy: string[];
  interestedBy: string[];
  isLiked: boolean;
  isDisliked: boolean;
  isInterested: boolean;
}

interface User {
  likedEvents: string[];
  dislikedEvents: string[];
  interestedEvents: string[];
}

const MemberEventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const userId = auth.currentUser?.uid;
  
    let userEvents: User = {
      likedEvents: [],
      dislikedEvents: [],
      interestedEvents: [],
    };
  
    try {
      if (userId) {
        const userDoc = await getDoc(doc(db, "Users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userEvents = {
            likedEvents: userData.likedEvents || [],
            dislikedEvents: userData.dislikedEvents || [],
            interestedEvents: userData.interestedEvents || [],
          };
        }
      }
  
      const eventsRef = collection(db, "events");
      const querySnapshot = await getDocs(eventsRef);
      const eventsList = querySnapshot.docs.map((doc) => {
        const data = doc.data() as Event;
        return {
          ...data,
          uid: doc.id,
          eventDate:
            data.eventDate instanceof Timestamp
              ? data.eventDate.toDate().toLocaleDateString()
              : data.eventDate,
          isLiked: userEvents.likedEvents.includes(doc.id),
          isDisliked: userEvents.dislikedEvents.includes(doc.id),
          isInterested: userEvents.interestedEvents.includes(doc.id),
        };
      });
  
      // Sort events by the number of likes (length of the likedBy array)
      const sortedEvents = eventsList.sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0));
  
      const topEvents = sortedEvents.slice(0, 5);
  
      setEvents(topEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchEvents();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEventAction = async (eventId: string, action: "like" | "dislike" | "interest") => {
    const organizationId = auth.currentUser?.uid;
    if (!organizationId) return;
  
    const userRef = doc(db, "Users", organizationId); // Using organizationId to reference Users collection
    const eventRef = doc(db, "events", eventId);
  
    // Prepare the object to update user's event lists based on the action
    const updatedUserEvents: { [key: string]: any } = {};
  
    if (action === "like") {
      updatedUserEvents.likedEvents = arrayUnion(eventId);
      updatedUserEvents.dislikedEvents = arrayRemove(eventId);
      updatedUserEvents.interestedEvents = arrayRemove(eventId);
    } else if (action === "dislike") {
      updatedUserEvents.dislikedEvents = arrayUnion(eventId);
      updatedUserEvents.likedEvents = arrayRemove(eventId);
      updatedUserEvents.interestedEvents = arrayRemove(eventId);
    } else if (action === "interest") {
      updatedUserEvents.interestedEvents = arrayUnion(eventId);
      updatedUserEvents.likedEvents = arrayRemove(eventId);
      updatedUserEvents.dislikedEvents = arrayRemove(eventId);
    }
  
    // Update the user's document in Firestore
    await updateDoc(userRef, updatedUserEvents);
  
    // Update the event's interactions (like, dislike, interested)
    await updateDoc(eventRef, {
      likedBy: action === "like" ? arrayUnion(organizationId) : arrayRemove(organizationId),
      dislikedBy: action === "dislike" ? arrayUnion(organizationId) : arrayRemove(organizationId),
      interestedBy: action === "interest" ? arrayUnion(organizationId) : arrayRemove(organizationId),
    });
  
    fetchEvents(); // Re-fetch to reflect changes
  };

  const truncateText = (text: string | undefined) => {
    return text && text.length > 100 ? text.substring(0, 100) + "..." : text || "";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div className="grid gap-2 p-1 m-auto text-black  h-auto w-full">
        {events.map((event) => (
          <div key={event.uid} className="p-2 mb-4 flex flex-col bg-gray-100 lg:flex-row items-center transition-shadow  shadow-md duration-200 hover:shadow-lg hover:shadow-gray-300">
            <div className="mb-4 w-60 h-20 rounded bg-gray-200">
              <img
                src={Array.isArray(event.eventImages) && event.eventImages.length > 0 ? event.eventImages[0] : "/assets/default-img.png"}
                alt={event.eventName}
                className="w-full h-full object-cover rounded"
              />
            </div>
            <div className="ml-8 flex flex-col">
              <p style={{ fontSize: '18px', fontFamily: 'Arial' }}><b>{event.eventName}</b></p>
              <p style={{ fontSize: '12px', fontFamily: 'Arial', lineHeight: '0.5' }}>{truncateText(event.eventDescription)}</p>

              <div className="flex mt-4">
                <div className={`mr-2 flex items-center cursor-pointer ${event.isLiked ? 'text-green-500' : ''}`}
                  onClick={() => handleEventAction(event.uid, "like")}>
                  {event.isLiked ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
                  <p className="mx-1" style={{ fontSize: '13px', fontFamily: 'Arial' }}>Like</p>
                </div>
                <div className={`mr-2 flex items-center cursor-pointer ${event.isDisliked ? 'text-red-500' : ''}`}
                  onClick={() => handleEventAction(event.uid, "dislike")}>
                  {event.isDisliked ? <ThumbDownIcon /> : <ThumbDownOffAltIcon />}
                  <p className="mx-1" style={{ fontSize: '13px', fontFamily: 'Arial' }}>Dislike</p>
                </div>
                <div className="ml-8 mr-1 flex items-center cursor-pointer" onClick={() => handleEventAction(event.uid, "interest")}>
                  <p className="mx-1" style={{ fontSize: '13px', fontFamily: 'Arial' }}>
                    {event.isInterested ? "Interested" : "Interested?"}
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-black mb-4 w-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberEventList;
