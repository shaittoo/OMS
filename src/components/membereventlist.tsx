import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import EventIcon from "@mui/icons-material/Event";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import Link from "next/link";

interface Event {
  id: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventLocation: string;
  eventPrice: string;
  eventImages: string[];
  organizationId: string;
  organizationName: string;
  likes: string[];
  interested: string[];
  isOpenForAll: boolean;
  status: string;
  tags: string[];
  isPastEvent: boolean;
}

interface MemberEventListProps {
  organizationId?: string;
}

export default function MemberEventList({ organizationId }: MemberEventListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<string[]>([]);
  const auth = getAuth();

  // Fetch user's organizations
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      const user = auth.currentUser;

      if (!user) return;

      try {
        const membersRef = collection(db, "Members");
        const q = query(
          membersRef,
          where("uid", "==", user.uid),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(q);

        const orgIds: string[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.organizationId) {
            orgIds.push(data.organizationId);
          }
        });

        setUserOrganizations(orgIds);
      } catch (error) {
        console.error("Error fetching user organizations:", error);
      }
    };

    fetchUserOrganizations();
  }, [auth]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;

      console.log("Current user:", user?.uid);
      console.log("Organization ID:", organizationId);
      console.log("User Organizations:", userOrganizations);

      if (!user) {
        setError("You must be logged in to view events.");
        setLoading(false);
        return;
      }

      try {
        let eventsQuery;
        
        // If a specific organization is selected, filter by that organization
        if (organizationId) {
          console.log("Filtering by specific organization:", organizationId);
          eventsQuery = query(
            collection(db, "events"),
            where("organizationId", "==", organizationId)
          );
        } 
        // Otherwise, fetch events from all organizations the user is a member of
        else if (userOrganizations.length > 0) {
          console.log("Filtering by user organizations:", userOrganizations);
          eventsQuery = query(
            collection(db, "events"),
            where("organizationId", "in", userOrganizations)
          );
        } else {
          console.log("No organization ID or user organizations provided");
          setEvents([]);
          setLoading(false);
          return;
        }
        
        const eventsSnapshot = await getDocs(eventsQuery);
        console.log("Number of events found:", eventsSnapshot.size);

        let eventsList = await Promise.all(eventsSnapshot.docs.map(async (eventDoc) => {
          const data = eventDoc.data();
          console.log("Event data:", data);

          // Fetch organization name
          let organizationName = "Unknown Organization";
          if (data.organizationId) {
            try {
              const orgDocRef = doc(db, "Organizations", data.organizationId);
              const orgDoc = await getDoc(orgDocRef);
              if (orgDoc.exists()) {
                const orgData = orgDoc.data();
                organizationName = orgData.name;
              }
            } catch (error) {
              console.error("Error fetching organization:", error);
            }
          }

          const eventDate = data.eventDate ? new Date(data.eventDate.seconds * 1000) : null;
          const isPastEvent = eventDate ? eventDate < new Date() : false;

          return {
            id: eventDoc.id,
            eventName: data.eventName || "Untitled Event",
            eventDescription: data.eventDescription || "",
            eventDate: eventDate ? eventDate.toISOString() : "",
            eventLocation: data.eventLocation || "",
            eventPrice: data.eventPrice || "Free",
            eventImages: data.eventImages || [],
            organizationId: data.organizationId || "",
            organizationName: organizationName,
            likes: data.likes || [],
            interested: data.interested || [],
            isOpenForAll: data.isOpenForAll || false,
            status: data.status || "active",
            tags: data.tags || [],
            isPastEvent: isPastEvent
          } as Event & { isPastEvent: boolean };
        }));

        // Only filter out past events if not in organization view
        if (!organizationId) {
          const currentDate = new Date();
          eventsList = eventsList.filter(event => {
            if (!event.eventDate) return false;
            const eventDate = new Date(event.eventDate);
            return eventDate >= currentDate;
          });
        }

        // Sort events by likes count (descending) and then by date
        eventsList.sort((a, b) => {
          // First sort by likes count (descending)
          const likesDiff = (b.likes?.length || 0) - (a.likes?.length || 0);
          if (likesDiff !== 0) return likesDiff;
          
          // If likes are equal, sort by date
          const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
          const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

        // Always take top 4 events with highest likes
        eventsList = eventsList.slice(0, 4);

        console.log("Final processed events list:", eventsList);
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching events:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setError("Error fetching events: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [organizationId, userOrganizations, auth]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date not specified";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEventAction = async (eventId: string, action: "like" | "interest") => {
    const user = auth.currentUser;
    if (!user) return;
  
    const userRef = doc(db, "Users", user.uid);
    const eventRef = doc(db, "events", eventId);
  
    // Prepare the object to update user's event lists based on the action
    const updatedUserEvents: { [key: string]: any } = {};
  
    if (action === "like") {
      updatedUserEvents.likedEvents = arrayUnion(eventId);
      updatedUserEvents.interestedEvents = arrayRemove(eventId);
    } else if (action === "interest") {
      updatedUserEvents.interestedEvents = arrayUnion(eventId);
      updatedUserEvents.likedEvents = arrayRemove(eventId);
    }
  
    // Update the user's document in Firestore
    await updateDoc(userRef, updatedUserEvents);
  
    // Update the event's interactions (like, interested)
    await updateDoc(eventRef, {
      likes: action === "like" ? arrayUnion(user.uid) : arrayRemove(user.uid),
      interested: action === "interest" ? arrayUnion(user.uid) : arrayRemove(user.uid),
    });
  
    // Refresh the events list
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        let eventsQuery;
        
        if (organizationId) {
          eventsQuery = query(
            collection(db, "events"),
            where("organizationId", "==", organizationId)
          );
        } 
        else if (userOrganizations.length > 0) {
          eventsQuery = query(
            collection(db, "events"),
            where("organizationId", "in", userOrganizations)
          );
        } else {
          setEvents([]);
          setLoading(false);
          return;
        }
        
        const eventsSnapshot = await getDocs(eventsQuery);

        const eventsList = eventsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            eventName: data.eventName || "Untitled Event",
            eventDescription: data.eventDescription || "",
            eventDate: data.eventDate ? new Date(data.eventDate.seconds * 1000).toISOString() : "",
            eventLocation: data.eventLocation || "",
            eventPrice: data.eventPrice || "Free",
            eventImages: data.eventImages || [],
            organizationId: data.organizationId || "",
            organizationName: data.organizationName || "Unknown Organization",
            likes: data.likes || [],
            interested: data.interested || [],
            isOpenForAll: data.isOpenForAll || false,
            status: data.status || "active",
            tags: data.tags || [],
            isPastEvent: false
          } as Event & { isPastEvent: boolean };
        });

        eventsList.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        setEvents(eventsList);
      } catch (error) {
        console.error("Error refreshing events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
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
      {loading && (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!loading && error && <div>{error}</div>}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">No events available</div>
          <div className="w-24 h-px bg-gray-300 mx-auto"></div>
        </div>
      )}
      
      {!loading && !error && events.length > 0 && (
        <>
          <div className="space-y-2">
            {/* Show all events when in organization view or when userOrganizations is available */}
            {(organizationId || userOrganizations.length > 0 ? events : events.slice(0, 4)).map((event) => (
              <div key={event.id} className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${event.isPastEvent ? 'opacity-75' : ''}`}>
                <div className="flex p-3">
                  {/* Event Image */}
                  <div className="w-32 h-24 bg-gray-200 flex-shrink-0 rounded-lg overflow-hidden mr-4">
                    {event.eventImages && event.eventImages.length > 0 ? (
                      <img 
                        src={event.eventImages[0]} 
                        alt={event.eventName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img 
                          src="/assets/default.jpg"
                          alt="Default event"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-grow min-w-0">
                    {/* Title and Organization */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-base font-semibold text-gray-800 truncate">{event.eventName}</h3>
                        {!organizationId && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                            {event.organizationName}
                          </span>
                        )}
                        {event.isPastEvent && (
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded flex-shrink-0">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{event.eventDescription}</p>

                    {/* Details Row */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="space-y-1">
                        {/* Date */}
                        <p>
                          <span className="font-medium">Date:</span> {formatDate(event.eventDate)}
                        </p>

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Location and Price */}
                      <div className="text-right ml-4 space-y-1">
                        {event.eventLocation && (
                          <p>
                            <span className="font-medium">Location:</span> {event.eventLocation}
                          </p>
                        )}
                        {event.eventPrice && (
                          <p>
                            <span className="font-medium">Price:</span> {event.eventPrice}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Interaction Buttons */}
                    <div className="flex justify-end items-center space-x-3 mt-2 pt-2 border-t">
                      <button 
                        className={`flex items-center text-xs ${event.likes.includes(auth.currentUser?.uid || "") ? 'text-green-600' : 'text-gray-600'}`}
                        onClick={() => handleEventAction(event.id, "like")}
                      >
                        {event.likes.includes(auth.currentUser?.uid || "") ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOffAltIcon fontSize="small" />}
                        <span className="ml-1">Like</span>
                      </button>
                      <button 
                        className={`flex items-center text-xs ${event.interested.includes(auth.currentUser?.uid || "") ? 'text-purple-600' : 'text-gray-600'}`}
                        onClick={() => handleEventAction(event.id, "interest")}
                      >
                        <span>
                          {event.interested.includes(auth.currentUser?.uid || "") ? "Interested" : "Interested?"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {events.length > 0 && events.length < 4 && (
            <div className="text-center mt-4">
              <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg">
                <p className="text-gray-600 text-sm">That's all the events for now!</p>
              </div>
            </div>
          )}
          {!organizationId && events.length > 4 && (
            <Link href="/memberviewevents">
              <p className="text-right text-sm text-purple-600 hover:text-purple-800 mt-2 cursor-pointer">
                View More
              </p>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
