import React, { useEffect, useState } from "react";
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, Timestamp, updateDoc, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import SearchIcon from "@mui/icons-material/Search";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import EventIcon from "@mui/icons-material/Event";
import MemberSidebar from "../components/membersidebar";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ViewEvent from "../components/viewEvent";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import { Comments } from "../types/event";

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
  status: string;
  organizationId: string;
  registrations: number;
  likedBy: string[];
  interestedBy: string[];
  isLiked: boolean;
  isInterested: boolean;
  comments?: Comments[];
  tags: string[];
}

const Header: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-col justify-between pb-4 border-b border-gray-200">
      <div className="py-2">
        <Link href="/memberpage" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
          <ArrowBackIcon />
          <span>Back to Dashboard</span>
        </Link>
      </div>
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">
          Welcome back! 
        </h1>
        <p className="text-lg text-gray-500">What would you like to do?</p>
      </div>
    </div>
  );
};

const SearchAndFilter: React.FC<{ onFilterChange: (filters: any) => void }> = ({ onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState({
    searchQuery: "",
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
  });

  const handleFilterChange = (filterType: keyof typeof activeFilters, value: string) => {
    const newFilters = { ...activeFilters, [filterType]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setActiveFilters((prevFilters) => ({ ...prevFilters, searchQuery: query }));
    onFilterChange({ ...activeFilters, searchQuery: query });
  };

  const handleSortChange = (filterType: keyof typeof activeFilters) => {
    const newValue =
      activeFilters[filterType] === "none"
        ? "least"
        : activeFilters[filterType] === "least"
        ? "most"
        : "none";
    setActiveFilters((prevFilters) => {
      const newFilters = { ...prevFilters, [filterType]: newValue };
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  const getIndicator = (filterValue: string) => {
    if (filterValue === "least") return "↓";
    if (filterValue === "most") return "↑";
    return "-";
  };
  
  return (
    <div className="relative flex items-center bg-white p-4 rounded-md mt-6 shadow-lg border border-gray-300 justify-center">
      <div className="relative flex-grow">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 text-gray-600 placeholder-gray-400 bg-white rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="Search..."
          value={activeFilters.searchQuery}
          onChange={handleSearchChange}
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <SearchIcon className="h-5 w-5" />
        </span>
      </div>
      <div className="ml-4 flex items-center space-x-4">
        <span className="text-gray-600 text-sm">Filter by:</span>
        <select
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
          value={activeFilters.type}
          onChange={(e) => handleFilterChange("type", e.target.value)}
        >
          {["All", "Academic", "Sports", "Interests", "Others"].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
          onClick={() => handleSortChange("likes")}
        >
          Likes {getIndicator(activeFilters.likes)}
        </button>
        <button
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
          onClick={() => handleSortChange("participation")}
        >
          Participation {getIndicator(activeFilters.participation)}
        </button>
        <button
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
          onClick={() => handleSortChange("date")}
        >
          Date {getIndicator(activeFilters.date)}
        </button>
      </div>
    </div>
  );
};

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const [orgName, setOrgName] = useState<string>("Loading...");
  const [interested, setInterested] = useState(event.isInterested);
  const [liked, setLiked] = useState(event.isLiked);
  const [isViewEventOpen, setViewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comments[]>([]);

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
    const eventComments = await fetchComments(event.uid);
    setSelectedEvent({
      ...event,
      comments: eventComments
    });
    setViewEventOpen(true);
  };

  const handleCloseEventClick = () => {
    setViewEventOpen(false);
    setSelectedEvent(null);
  };

  const handleAddToCalendar = async (event: Event) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const userRef = doc(db, "Users", userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const calendarEvents = userData?.calendarEvents || [];

      if (calendarEvents.some((e: any) => e.uid === event.uid)) {
        return;
      }

      const newCalendarEvent = {
        id: event.uid,
        title: event.eventName,
        start: event.eventDate,
        description: event.eventDescription,
        location: event.eventLocation,
        organizationName: orgName,
        organizationId: event.organizationId
      };

      await updateDoc(userRef, {
        calendarEvents: arrayUnion(newCalendarEvent)
      });

    } catch (err) {
      console.error("Error adding event to calendar:", err);
    }
  };

  useEffect(() => {
    const fetchOrganizationName = async () => {
      if (event.organizationId) {
        try {
          const orgDoc = await getDoc(doc(db, "Organizations", event.organizationId));
          if (orgDoc.exists()) {
            const data = orgDoc.data();
            setOrgName(data.name || "Unknown Organization");
          } else {
            setOrgName("Organization Not Found");
          }
        } catch (err) {
          console.error("Error fetching organization name:", err);
          setOrgName("Error fetching organization");
        }
      } else {
        setOrgName("No Organization ID");
      }
    };

    fetchOrganizationName();
  }, [event.organizationId]);

  const handleInterestedClick = async () => {
    setInterested(!interested);
    const userId = auth.currentUser?.uid;
    if (userId) {
      const userRef = doc(db, "Users", userId);
      await updateDoc(userRef, {
        interestedEvents: interested ? arrayRemove(event.uid) : arrayUnion(event.uid),
      });
    }

    const eventRef = doc(db, "events", event.uid);
    await updateDoc(eventRef, {
      interestedBy: interested ? arrayRemove(auth.currentUser?.uid) : arrayUnion(auth.currentUser?.uid),
    });
  };

  const handleLikeClick = async () => {
    const userId = auth.currentUser?.uid;
    setLiked(!liked);

    if (userId) {
      const userRef = doc(db, "Users", userId);
      await updateDoc(userRef, {
        likedEvents: liked ? arrayRemove(event.uid) : arrayUnion(event.uid),
      });
    }

    const eventRef = doc(db, "events", event.uid);
    await updateDoc(eventRef, {
      likedBy: liked ? arrayRemove(userId) : arrayUnion(userId),
    });
  };

  const formatDate = (dateString: string | Date) => {
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
          return memberData.fullName;
        }
      }
      return "Unknown User";
    } catch (error) {
      console.error("Error fetching current user data:", error);
      return "Unknown User";
    }
  };

  useEffect(() => {
    fetchCurrentUserName();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Event Image */}
      <div className="w-full h-48 bg-gray-200">
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

      {/* Content */}
      <div className="p-4">
        {/* Title and Organization */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 truncate">{event.eventName}</h3>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
              {orgName}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{event.eventDescription}</p>

        {/* Details */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div className="space-y-1">
            <p>
              <span className="font-medium">Date:</span> {formatDate(event.eventDate)}
            </p>
            <p>
              <span className="font-medium">Location:</span> {event.eventLocation}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p>
              <span className="font-medium">Price:</span> {event.eventPrice}
            </p>
            <p>
              <span className="font-medium">Type:</span> {event.eventType}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center space-x-3 pt-2 border-t">
          <div className="flex items-center">
            <button
              onClick={handleLikeClick}
              className={`p-1.5 rounded-full hover:bg-gray-100 ${liked ? 'text-blue-600' : 'text-gray-600'}`}
              aria-label={liked ? "Unlike" : "Like"}
            >
              {liked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOffAltIcon fontSize="small" />}
            </button>
            <span className="ml-1 text-sm text-gray-600">{event.likedBy?.length || 0}</span>
          </div>
          <button
            onClick={handleInterestedClick}
            className={`p-1.5 rounded-full hover:bg-gray-100 ${interested ? 'text-blue-600' : 'text-gray-600'}`}
            aria-label={interested ? "Remove bookmark" : "Bookmark"}
          >
            {interested ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </button>
          <button
            onClick={() => handleAddToCalendar(event)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-blue-600 hover:text-blue-800"
            aria-label="Add to Calendar"
          >
            <CalendarMonthIcon fontSize="small" />
          </button>
          <div className="flex items-center">
            <button
              onClick={() => handleViewEventClick(event)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="View comments"
            >
              <ChatBubbleOutlineIcon fontSize="small" />
            </button>
            <span className="ml-1 text-sm text-gray-600">{comments.length}</span>
          </div>
        </div>
      </div>

      {isViewEventOpen && selectedEvent && (
        <ViewEvent 
          close={handleCloseEventClick} 
          event={selectedEvent}
          orgName={orgName}
        />
      )}
    </div>
  );
};

const EventsView: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({
    searchQuery: "",
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
  });
  const [showBackToTop, setShowBackToTop] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const userId = auth.currentUser?.uid;
  
    let userEvents = {
      likedEvents: [],
      interestedEvents: [],
    };
  
    try {
      if (userId) {
        const userDoc = await getDoc(doc(db, "Users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userEvents = {
            likedEvents: userData.likedEvents || [],
            interestedEvents: userData.interestedEvents || [],
          };
        }
      }
  
      const eventsRef = collection(db, "events");
      const querySnapshot = await getDocs(eventsRef);
      const eventsList = querySnapshot.docs.map((doc) => {
        const data = doc.data() as Event;
        const eventDate =
          data.eventDate instanceof Timestamp
            ? data.eventDate.toDate() // Convert to Date object
            : new Date(data.eventDate); // Ensure it's a Date object
  
        return {
          ...data,
          uid: doc.id,
          eventDate, // Store eventDate as a Date object
          isLiked: userEvents.likedEvents.includes(doc.id as never),
          isInterested: userEvents.interestedEvents.includes(doc.id as never),
        };
      });
  
      // Apply filters
      let filteredEvents = eventsList.filter(event => {
        const matchesSearchQuery =
          event.eventName?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ?? false;
        const matchesType = filters.type === "All" || event.eventType === filters.type;
  
        return matchesSearchQuery && matchesType;
      });
  
      // Handle sorting by date
      if (filters.date !== "none") {
        filteredEvents = filteredEvents.sort((a, b) => {
          const dateA = a.eventDate;
          const dateB = b.eventDate;
  
          if (filters.date === "most") {
            return dateA.getTime() - dateB.getTime(); 
          } else if (filters.date === "least") {
            return dateB.getTime() - dateA.getTime(); 
          }
          return 0; 
        });
      }
  
      setEvents(filteredEvents);
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
  }, [filters]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (  
    <div className="flex h-full bg-gray-50">
      <div className="flex h-50%">
        <MemberSidebar />
      </div>
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Header />
          <SearchAndFilter onFilterChange={setFilters} />
          <div className="mt-6">
            {loading ? (
              <div className="text-center text-gray-500 py-4">Loading events...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">{error}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length > 0 ? (
                  events.map((event) => (
                    <EventCard key={event.uid} event={event} />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4 col-span-full">
                    No events found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-200"
            aria-label="Back to top"
          >
            <KeyboardArrowUpIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default EventsView;