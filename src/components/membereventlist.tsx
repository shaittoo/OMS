import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import EventIcon from "@mui/icons-material/Event";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import Link from "next/link";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import toast, { Toaster } from 'react-hot-toast';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import ViewEvent from "../components/viewEvent";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface Comments {
  uid: string;
  eventId: string;
  comment: string;
  replies: string[];
  userName: string;
  userEmail?: string;
  timestamp: any;
}

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
  uid?: string;
  likedBy?: string[];
  interestedBy?: string[];
  registrations?: number;
  eventType?: string;
  isFree?: string;
  comments?: Comments[];
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
  const [isViewEventOpen, setViewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comments[]>([]);
  const [eventLikes, setEventLikes] = useState<{ [key: string]: number }>({});
  const [eventInterests, setEventInterests] = useState<{ [key: string]: number }>({});
  const [eventCommentsCount, setEventCommentsCount] = useState<{ [key: string]: number }>({});

  const refreshEventCommentCount = async (eventId: string) => {
  const q = query(collection(db, "comments"), where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);
  setEventCommentsCount(prev => ({
    ...prev,
    [eventId]: querySnapshot.size
  }));
};

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
          isPastEvent: isPastEvent,
          uid: data.id,
          likedBy: data.likes,
          interestedBy: data.interested,
          registrations: 0,
          eventType: data.eventType || 'general',
          isFree: (data.eventPrice === '0' || data.eventPrice === 'Free' || !data.eventPrice).toString(),
          comments: data.comments || []
        } as Event;
      }));

        // Filter and sort based on view type
        if (!organizationId) {
          // Member Dashboard View: Filter for current month events starting from today
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          eventsList = eventsList.filter(event => {
            if (!event.eventDate) return false;
            const eventDate = new Date(event.eventDate);
            
            // Check if event is in current month and year
            const isCurrentMonth = eventDate.getMonth() === currentMonth && 
                                 eventDate.getFullYear() === currentYear;
            
            // Check if event is today or future
            const isTodayOrFuture = eventDate >= currentDate;
            
            return isCurrentMonth && isTodayOrFuture;
          });

          // Sort by likes count (descending) and then by date
          eventsList.sort((a, b) => {
            // First sort by likes count (descending)
            const likesDiff = (b.likes?.length || 0) - (a.likes?.length || 0);
            if (likesDiff !== 0) return likesDiff;
            
            // If likes are equal, sort by date
            const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
            const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
            return dateA - dateB; // Sort by date ascending (earlier dates first)
          });

          // Take top 4 events
          eventsList = eventsList.slice(0, 4);
        } else {
          // Organization View: Sort by date (most recent first)
          eventsList.sort((a, b) => {
            const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
            const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
            return dateB - dateA;
          });
        }

        const counts: { [key: string]: number } = {};
      for (const event of eventsList) {
        const q = query(collection(db, "comments"), where("eventId", "==", event.id));
        const querySnapshot = await getDocs(q);
        counts[event.id] = querySnapshot.size;
      }
      setEventCommentsCount(counts);

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



  useEffect(() => {
    // Initialize counts for all events
    const likeCounts: { [key: string]: number } = {};
    const interestCounts: { [key: string]: number } = {};
    events.forEach(event => {
      likeCounts[event.id] = event.likes?.length || 0;
      interestCounts[event.id] = event.interested?.length || 0;
    });
    setEventLikes(likeCounts);
    setEventInterests(interestCounts);
  }, [events]);

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

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const isCurrentlyActive = action === "like" 
      ? event.likes.includes(user.uid)
      : event.interested.includes(user.uid);

    // Optimistically update UI
    if (action === "like") {
      setEventLikes(prev => ({
        ...prev,
        [eventId]: isCurrentlyActive ? (prev[eventId] - 1) : (prev[eventId] + 1)
      }));
    } else {
      setEventInterests(prev => ({
        ...prev,
        [eventId]: isCurrentlyActive ? (prev[eventId] - 1) : (prev[eventId] + 1)
      }));
    }

    try {
      const userRef = doc(db, "Users", user.uid);
      const eventRef = doc(db, "events", eventId);

      // Update user's events lists
      await updateDoc(userRef, {
        [action === "like" ? "likedEvents" : "interestedEvents"]: 
          isCurrentlyActive ? arrayRemove(eventId) : arrayUnion(eventId)
      });

      // Update event's interaction lists
      await updateDoc(eventRef, {
        [action === "like" ? "likes" : "interested"]: 
          isCurrentlyActive ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });

      // Update local state to reflect changes
      setEvents(currentEvents => 
        currentEvents.map(e => {
          if (e.id === eventId) {
            const updatedEvent = { ...e };
            if (action === "like") {
              updatedEvent.likes = isCurrentlyActive 
                ? e.likes.filter(id => id !== user.uid)
                : [...e.likes, user.uid];
            } else {
              updatedEvent.interested = isCurrentlyActive
                ? e.interested.filter(id => id !== user.uid)
                : [...e.interested, user.uid];
            }
            return updatedEvent;
          }
          return e;
        })
      );
    } catch (error) {
      console.error("Error updating event interaction:", error);
      // Revert UI on error
      if (action === "like") {
        setEventLikes(prev => ({
          ...prev,
          [eventId]: isCurrentlyActive ? (prev[eventId] + 1) : (prev[eventId] - 1)
        }));
      } else {
        setEventInterests(prev => ({
          ...prev,
          [eventId]: isCurrentlyActive ? (prev[eventId] + 1) : (prev[eventId] - 1)
        }));
      }
      showToast('error', `Failed to update ${action} status`);
    }
  };

  const truncateText = (text: string | undefined) => {
    return text && text.length > 100 ? text.substring(0, 100) + "..." : text || "";
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const toastOptions = {
      duration: 3000,
      style: {
        padding: '16px',
        borderRadius: '10px',
        background: '#ffffff',
        color: '#1a1a1a',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '14px',
        maxWidth: '350px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: type === 'success' ? '1px solid #4CAF50' :
               type === 'error' ? '1px solid #FF5733' :
               '1px solid #6B46C1'
      },
      icon: type === 'success' ? <CheckCircleIcon style={{ color: '#4CAF50' }} /> :
            type === 'error' ? <ErrorIcon style={{ color: '#FF5733' }} /> :
            <InfoIcon style={{ color: '#6B46C1' }} />
    };

    switch (type) {
      case 'success':
        toast.success(message, {
          ...toastOptions,
          className: 'border-l-4 border-l-green-500'
        });
        break;
      case 'error':
        toast.error(message, {
          ...toastOptions,
          className: 'border-l-4 border-l-red-500'
        });
        break;
      case 'info':
        toast(message, {
          ...toastOptions,
          className: 'border-l-4 border-l-purple-600'
        });
        break;
    }
  };

  const handleAddToCalendar = async (event: Event) => {
    if (!event.eventDate) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get user's calendar events
      const userRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const calendarEvents = userData?.calendarEvents || [];

      // Check if event is already in calendar
      if (calendarEvents.some((e: any) => e.id === event.id)) {
        showToast('info', 'This event is already in your calendar');
        return;
      }

      // Add event to calendar
      const newCalendarEvent = {
        id: event.id,
        title: event.eventName,
        start: event.eventDate,
        description: event.eventDescription,
        location: event.eventLocation,
        organizationName: event.organizationName,
        organizationId: event.organizationId
      };

      // Update Firestore
      await updateDoc(userRef, {
        calendarEvents: arrayUnion(newCalendarEvent)
      });

      // Update local state immediately
      setEvents(currentEvents => 
        currentEvents.map(ev => {
          if (ev.id === event.id) {
            return {
              ...ev,
              addedToCalendar: true // Add this flag to track calendar status
            };
          }
          return ev;
        })
      );

      showToast('success', 'Event added to your calendar');
    } catch (error) {
      console.error("Error adding event to calendar:", error);
      showToast('error', 'Failed to add event to calendar');
    }
  };

  // Function to fetch comments
  const fetchComments = async (eventId: string) => {
    try {
      const q = query(collection(db, "comments"), where("eventId", "==", eventId));
      const querySnapshot = await getDocs(q);
      const fetchedComments: Comments[] = [];
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        fetchedComments.push({
          uid: doc.id,
          ...data,
        } as Comments);
      }
      
      // Sort comments by timestamp
      fetchedComments.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
      setComments(fetchedComments);
      return fetchedComments;
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  };

  const handleViewEventClick = async (event: Event) => {
    // Fetch comments before opening the modal
    const eventComments = await fetchComments(event.id);
    
    setSelectedEvent({
      ...event,
      uid: event.id,
      likedBy: event.likes,
      interestedBy: event.interested,
      registrations: 0,
      eventType: event.eventType || 'general',
      isFree: (event.eventPrice === '0' || event.eventPrice === 'Free' || !event.eventPrice).toString(),
      comments: eventComments
    });
    setViewEventOpen(true);
  };

  const handleCloseEventClick = () => {
    setViewEventOpen(false);
    setSelectedEvent(null);
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
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: '',
          style: {
            maxWidth: '350px',
          },
        }}
        containerStyle={{
          bottom: 40,
          right: 40,
          fontSize: '14px',
        }}
      />
      
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
        <div className={`space-y-2 ${organizationId ? 'h-[calc(150vh-250px)] overflow-y-auto' : ''} pr-2`}>
          {events.map((event) => (
            <div key={event.id} className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${event.isPastEvent ? 'opacity-100' : ''}`}>
              <div className="flex p-3" onClick={() => handleViewEventClick(event)}>
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
                    <div className="flex items-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventAction(event.id, "like");
                        }}
                        className={`p-1.5 rounded-full hover:bg-gray-100 ${event.likes.includes(auth.currentUser?.uid || "") ? 'text-blue-600' : 'text-gray-600'}`}
                        aria-label={event.likes.includes(auth.currentUser?.uid || "") ? "Unlike" : "Like"}
                      >
                        {event.likes.includes(auth.currentUser?.uid || "") ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOffAltIcon fontSize="small" />}
                      </button>
                      <span className="ml-1 text-sm text-gray-600">{eventLikes[event.id] || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventAction(event.id, "interest");
                        }}
                        className={`p-1.5 rounded-full hover:bg-gray-100 ${event.interested.includes(auth.currentUser?.uid || "") ? 'text-blue-600' : 'text-gray-600'}`}
                        aria-label={event.interested.includes(auth.currentUser?.uid || "") ? "Remove bookmark" : "Bookmark"}
                      >
                        {event.interested.includes(auth.currentUser?.uid || "") ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                      </button>
                      <span className="ml-1 text-sm text-gray-600">{eventInterests[event.id] || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCalendar(event);
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-blue-600 hover:text-blue-800"
                        aria-label="Add to Calendar"
                      >
                        <CalendarMonthIcon fontSize="small" />
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewEventClick(event);
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                        aria-label="View comments"
                      >
                        <ChatBubbleOutlineIcon fontSize="small" />
                      </button>
                      <span className="ml-1 text-sm text-gray-600">{eventCommentsCount[event.id] || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {isViewEventOpen && selectedEvent && selectedEvent.id === event.id && (
                <ViewEvent 
                  close={() => {
                    handleCloseEventClick();
                    refreshEventCommentCount(event.id); 
                  }}
                  event={{
                    ...selectedEvent,
                    uid: selectedEvent.id,
                    likedBy: selectedEvent.likes,
                    interestedBy: selectedEvent.interested,
                    registrations: 0,
                    eventType: selectedEvent.eventType || 'general',
                    isFree: (selectedEvent.eventPrice === '0' || selectedEvent.eventPrice === 'Free' || !selectedEvent.eventPrice).toString(),
                    comments: comments
                  }}
                  orgName={selectedEvent.organizationName}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
