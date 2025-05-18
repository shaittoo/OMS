import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import MemberSidebar from "../components/membersidebar";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface Event {
  id: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventLocation: string;
  eventImages: string[];
}

const AppHeader: React.FC = () => (
  <div className="pb-4 border-b border-gray-200">
    <Link href="/memberpage" className="flex items-center text-gray-600 hover:text-gray-800">
      <ArrowBackIcon />
      <span className="ml-2">Back to Dashboard</span>
    </Link>
  </div>
);

const MyEvents: React.FC = () => {
  const [interestedEvents, setInterestedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterestedEvents = async () => {
      setLoading(true);
      const authUser = auth.currentUser;

      if (!authUser) {
        alert("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "Users", authUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const eventIds = userData.interestedEvents || [];

          if (eventIds.length === 0) {
            setInterestedEvents([]);
            return;
          }

          const events = await Promise.all(
            eventIds.map(async (eventId: string) => {
              const eventDocRef = doc(db, "events", eventId);
              const eventDoc = await getDoc(eventDocRef);

              if (eventDoc.exists()) {
                return { id: eventDoc.id, ...eventDoc.data() } as Event;
              } else {
                console.warn(`Event with ID ${eventId} does not exist.`);
              }
              return null;
            })
          );

          setInterestedEvents(events.filter(Boolean) as Event[]);
        } else {
          console.warn("User document not found.");
        }
      } catch (error) {
        console.error("Failed to fetch interested events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterestedEvents();
  }, []);

  const formatDate = (date: any) => {
    if (!date) return "Date not specified";

    const jsDate = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(jsDate.getTime())) {
      return "Invalid Date";
    }

    return jsDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <MemberSidebar />
      <main className="ml-64 p-6">
        <AppHeader />

        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">My Interested Events</h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : interestedEvents.length === 0 ? (
            <div className="text-center text-gray-600 mt-8">
              <p>You haven't marked any events as interested.</p>
              <Link href="/memberviewevents">
                <span className="text-blue-600 hover:underline mt-2 inline-block">
                  View Available Events
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {interestedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition"
                >
                  <img
                    src={event.eventImages[0]} 
                    alt={event.eventName}
                    className="w-full h-40 object-cover rounded-md mb-3"
                  />
                  <h3 className="text-lg font-semibold text-gray-800">{event.eventName}</h3>
                  <p className="text-sm text-gray-600 truncate">{event.eventDescription}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {event.eventDate ? formatDate(event.eventDate) : "Date not specified"} - {event.eventLocation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyEvents;