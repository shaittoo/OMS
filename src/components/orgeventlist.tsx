import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
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

interface MemberDashboardProps {
  user: any; // Assuming `user` prop contains user data (e.g., organization ID)
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ user }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const organizationId = userData?.organizationId;

      if (!organizationId) {
        setError("Organization ID not found for the user.");
        setLoading(false);
        return;
      }

      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("organizationId", "==", organizationId));
      const querySnapshot = await getDocs(q);

      const eventsList = querySnapshot.docs.map((doc) => {
        const data = doc.data() as Event;
        const eventDate =
          data.eventDate instanceof Timestamp
            ? data.eventDate.toDate()
            : new Date(data.eventDate);
        return {
          ...data,
          uid: doc.id,
          eventDate: eventDate.toLocaleDateString(),
          isLiked: data.likedBy?.includes(user.uid),
          isDisliked: data.dislikedBy?.includes(user.uid),
          isInterested: data.interestedBy?.includes(user.uid),
        };
      });

      setEvents(eventsList);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const handleEventAction = async (eventId: string, action: "like" | "dislike" | "interest") => {
    try {
      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (!eventDoc.exists()) {
        setError("Event not found.");
        return;
      }

      const eventData = eventDoc.data() as Event;

      let updatedField: Partial<Event> = {};
      switch (action) {
        case "like":
          updatedField = {
            likedBy: eventData.likedBy?.includes(user.uid)
              ? eventData.likedBy.filter((id) => id !== user.uid)
              : [...(eventData.likedBy || []), user.uid],
            dislikedBy: eventData.dislikedBy?.filter((id) => id !== user.uid),
          };
          break;
        case "dislike":
          updatedField = {
            dislikedBy: eventData.dislikedBy?.includes(user.uid)
              ? eventData.dislikedBy.filter((id) => id !== user.uid)
              : [...(eventData.dislikedBy || []), user.uid],
            likedBy: eventData.likedBy?.filter((id) => id !== user.uid),
          };
          break;
        case "interest":
          updatedField = {
            interestedBy: eventData.interestedBy?.includes(user.uid)
              ? eventData.interestedBy.filter((id) => id !== user.uid)
              : [...(eventData.interestedBy || []), user.uid],
          };
          break;
      }

      await updateDoc(eventDocRef, updatedField);
      fetchEvents();
    } catch (err) {
      console.error(`Error handling event action (${action}):`, err);
      setError("Failed to update event.");
    }
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
      {events.length === 0 ? (
        <div className="text-center text-gray-600 font-semibold mt-4">No events available at the moment.</div>
      ) : (
        <div className="grid gap-2 p-1 m-auto text-black h-auto w-full">
          {events.map((event) => (
            <div
              key={event.uid}
              className="p-2 mb-6 flex flex-col lg:flex-row items-center transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-300"
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '1.5rem',
                padding: '0.5rem',
                transition: 'box-shadow 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <div
                className="mb-4 w-60 h-20 rounded bg-gray-200"
                style={{
                  width: '240px',
                  height: '80px',
                  borderRadius: '8px',
                  backgroundColor: '#E5E7EB',
                }}
              >
                <img
                  src={Array.isArray(event.eventImages) && event.eventImages.length > 0 ? event.eventImages[0] : "/assets/komsai.png"}
                  alt={event.eventName}
                  className="w-full h-full object-cover rounded"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
              </div>
              <div
                className="ml-8 flex flex-col"
                style={{
                  marginLeft: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <p
                  style={{
                    fontSize: '18px',
                    fontFamily: 'Inter',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}
                >
                  {event.eventName}
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    fontFamily: 'Inter',
                    lineHeight: '0.5',
                    marginBottom: '16px',
                    color: '#4B5563',
                  }}
                >
                  {truncateText(event.eventDescription)}
                </p>

                <div className="flex mt-4">
                  <div
                    className="mr-2 flex items-center cursor-pointer"
                    onClick={() => handleEventAction(event.uid, "like")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {event.isLiked ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
                    <p
                      className="mx-1"
                      style={{
                        fontSize: '12px',
                        fontFamily: 'Inter',
                        marginLeft: '0.25rem',
                        marginRight: '0.25rem',
                      }}
                    >
                      Like
                    </p>
                  </div>
                  <div
                    className="mr-2 flex items-center cursor-pointer"
                    onClick={() => handleEventAction(event.uid, "dislike")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {event.isDisliked ? <ThumbDownIcon /> : <ThumbDownOffAltIcon />}
                    <p
                      className="mx-1"
                      style={{
                        fontSize: '12px',
                        fontFamily: 'Inter',
                        marginLeft: '0.25rem',
                        marginRight: '0.25rem',
                      }}
                    >
                      Dislike
                    </p>
                  </div>
                  <div
                    className="ml-8 mr-1 flex items-center cursor-pointer"
                    onClick={() => handleEventAction(event.uid, "interest")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      className="ml-1"
                      src="/assets/group_add.svg"
                      alt="interest"
                      style={{
                        marginLeft: '0.25rem',
                      }}
                    />
                    <p
                      className="mx-1"
                      style={{
                        fontSize: '12px',
                        fontFamily: 'Inter',
                        marginLeft: '0.25rem',
                        marginRight: '0.25rem',
                      }}
                    >
                      {event.isInterested ? "Interested" : "Interested?"}
                    </p>
                  </div>
                </div>
              </div>
              <hr className="border-black mb-4 w-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;
