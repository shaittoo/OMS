import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { getDoc, doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import MemberSidebar from "../components/membersidebar";
import EventIcon from "@mui/icons-material/Event";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface Event {
  id: string;
  eventName: string;
  eventDescription: string;
  eventDate: string | Date;
  eventLocation: string;
  eventImages: string[];
  isInterested: boolean;
}

const MyEvents: React.FC = () => {
  const [interestedEvents, setInterestedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoTimeouts, setUndoTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({});

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
                const eventData = eventDoc.data();
                return {
                  id: eventDoc.id,
                  ...eventData,
                  isInterested: true,
                } as Event;
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

  const handleInterestedClick = async (eventId: string, isInterested: boolean) => {
    const authUser = auth.currentUser;

    if (!authUser) {
      alert("User not authenticated");
      return;
    }

    try {
      const userDocRef = doc(db, "Users", authUser.uid);
      const eventDocRef = doc(db, "events", eventId);

      // Update Firestore
      await updateDoc(userDocRef, {
        interestedEvents: isInterested ? arrayRemove(eventId) : arrayUnion(eventId),
      });

      await updateDoc(eventDocRef, {
        interestedBy: isInterested ? arrayRemove(authUser.uid) : arrayUnion(authUser.uid),
      });

      if (isInterested) {
        // Temporarily keep the event visible for 3 seconds
        const timeout = setTimeout(() => {
          setInterestedEvents((prevEvents) =>
            prevEvents.filter((event) => event.id !== eventId)
          );
          setUndoTimeouts((prevTimeouts) => {
            const { [eventId]: _, ...rest } = prevTimeouts;
            return rest;
          });
        }, 3000);

        setUndoTimeouts((prevTimeouts) => ({
          ...prevTimeouts,
          [eventId]: timeout,
        }));
      } else {
        // Clear the undo timeout if the user re-adds the event
        if (undoTimeouts[eventId]) {
          clearTimeout(undoTimeouts[eventId]);
          setUndoTimeouts((prevTimeouts) => {
            const { [eventId]: _, ...rest } = prevTimeouts;
            return rest;
          });
        }
      }

      // Update local state
      setInterestedEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, isInterested: !isInterested } : event
        )
      );

      console.log(
        `Event with ID ${eventId} ${
          isInterested ? "removed from" : "added to"
        } interested list.`
      );
    } catch (error) {
      console.error("Failed to update interested status:", error);
    }
  };

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
      <main className="ml-64 p-8">
        <div className="py-2">
          <Link
            href="/memberpage"
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            <ArrowBackIcon />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">My Interested Events</h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : interestedEvents.length === 0 ? (
            <div className="text-center text-gray-600 mt-8">
              <p>You haven't marked any events as interested.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {interestedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition"
                >
                  {event.eventImages && event.eventImages.length > 0 ? (
                    <img
                      src={event.eventImages[0]}
                      alt={event.eventName}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-300 flex items-center justify-center rounded-md">
                      <p className="text-gray-500">No Image Available</p>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-800 mt-4">
                    {event.eventName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {event.eventDescription}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    <CorporateFareIcon /> {event.eventLocation}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    <EventIcon /> {formatDate(event.eventDate)}
                  </p>
                  <div className="flex items-center mt-4">
                    <button
                      onClick={() => handleInterestedClick(event.id, event.isInterested)}
                      className={`px-4 py-2 rounded-md ${
                        event.isInterested
                          ? "bg-gray-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {event.isInterested ? "Interested" : "Interested?"}
                    </button>
                  </div>
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