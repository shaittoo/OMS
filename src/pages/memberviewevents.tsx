import React, { useEffect, useState } from "react";
import { arrayUnion, arrayRemove, collection, doc, getDoc, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import SearchIcon from "@mui/icons-material/Search";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import EventIcon from "@mui/icons-material/Event";
import OfficerSidebar from "../components/officersidebar";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline"; 
import ViewEvent from "../components/viewEvent";
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MemberSidebar from "../components/membersidebar";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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
  likes: string[];
  interested: string[];
  isLiked: boolean;
  isInterested: boolean;
  tags: string[]; // Added missing property
}

const Header: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
      <div>
        <Link
            href="/memberpage"
            className="flex items-center space-x-1 mb-3 text-gray-600 hover:text-gray-800"
          >
          <ArrowBackIcon className="text-gray-500 hover:text-gray-700" />
          <span>Back to Dashboard</span>
          </Link>
        <h1 className="text-3xl font-semibold text-gray-800">
          Organization Events
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
          {[
            "All",
            "Academic",
            "Sports",
            "Interests",
            "Others",
          ].map((type) => (
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

const EventCard: React.FC<{
  event: Event;
  onLikeToggle: () => void;
  onInterestedToggle: () => void;
  onCardClick: () => void;
}> = ({ event, onLikeToggle, onInterestedToggle, onCardClick }) => {
  const [orgName, setOrgName] = useState<string>("Loading...");
  const [comments, setComments] = useState<number>(0);

  // Fetch organization name
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
          setOrgName("Error fetching organization");
        }
      } else {
        setOrgName("No Organization ID");
      }
    };
    fetchOrganizationName();
  }, [event.organizationId]);

  // Fetch comments count
  useEffect(() => {
    const fetchCommentsCount = async () => {
      const snapshot = await getDocs(collection(db, "comments"));
      const count = snapshot.docs.filter(doc => doc.data().eventId === event.uid).length;
      setComments(count);
    };
    fetchCommentsCount();
  }, [event.uid]);

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Date not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onCardClick}
    >
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
              onClick={e => { e.stopPropagation(); onLikeToggle(); }}
              className={`p-1.5 rounded-full hover:bg-gray-100 ${event.isLiked ? 'text-blue-600' : 'text-gray-600'}`}
              aria-label={event.isLiked ? "Unlike" : "Like"}
            >
              {event.isLiked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOffAltIcon fontSize="small" />}
            </button>
            <span className="ml-1 text-sm text-gray-600">{event.likes?.length || 0}</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onInterestedToggle(); }}
            className={`p-1.5 rounded-full hover:bg-gray-100 ${event.isInterested ? 'text-blue-600' : 'text-gray-600'}`}
            aria-label={event.isInterested ? "Remove bookmark" : "Bookmark"}
          >
            {event.isInterested ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </button>
          <span className="ml-1 text-sm text-gray-600">{event.interested?.length || 0}</span>
          <div className="flex items-center">
            <button
              onClick={e => { e.stopPropagation(); }}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="View comments"
            >
              <ChatBubbleOutlineIcon fontSize="small" />
            </button>
            <span className="ml-1 text-sm text-gray-600">{comments}</span>
          </div>
        </div>
      </div>
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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isViewEventOpen, setViewEventOpen] = useState(false);
  
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
            ? data.eventDate.toDate()
            : new Date(data.eventDate);
        return {
          ...data,
          uid: doc.id,
          eventDate,
          isLiked: userEvents.likedEvents.includes(doc.id as never),
          isInterested: userEvents.interestedEvents.includes(doc.id as never),
          tags: data.tags || [], 
          registrations: typeof data.registrations === "number" ? data.registrations : Number(data.registrations) || 0,
          likes: data.likes || [], 
          interested: data.interested || [], 

        };
      });

      let filteredEvents = eventsList.filter(event => {
        const matchesSearchQuery =
          event.eventName?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ?? false;
        const matchesType = filters.type === "All" || event.eventType === filters.type;
        return matchesSearchQuery && matchesType;
      });

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

  const handleLikeToggle = async (eventId: string, isLiked: boolean) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Optimistically update local state
    setEvents(prevEvents =>
      prevEvents.map(ev =>
        ev.uid === eventId
          ? {
              ...ev,
              isLiked: !isLiked,
              likes: isLiked
                ? ev.likes.filter(uid => uid !== userId)
                : [...ev.likes, userId],
            }
          : ev
      )
    );

    // Update Firestore in the background
    const userRef = doc(db, "Users", userId);
    await updateDoc(userRef, {
      likedEvents: isLiked ? arrayRemove(eventId) : arrayUnion(eventId),
    });
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    });
  };

  const handleInterestedToggle = async (eventId: string, isInterested: boolean) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setEvents(prevEvents =>
      prevEvents.map(ev =>
        ev.uid === eventId
          ? {
              ...ev,
              isInterested: !isInterested,
              interested: isInterested
                ? ev.interested.filter(uid => uid !== userId)
                : [...ev.interested, userId],
            }
          : ev
      )
    );

    const userRef = doc(db, "Users", userId);
    await updateDoc(userRef, {
      interestedEvents: isInterested ? arrayRemove(eventId) : arrayUnion(eventId),
    });
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      interested: isInterested ? arrayRemove(userId) : arrayUnion(userId),
    });
  };

  const handleCardClick = (event: Event) => {
    setSelectedEvent(event);
    setViewEventOpen(true);
  };
  const handleCloseEventClick = () => {
    setViewEventOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-shrink-0">
        <MemberSidebar />
      </div>
      <div className="flex-grow p-6 bg-white overflow-y-auto">
        <Header />
        <SearchAndFilter onFilterChange={setFilters} />
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.length > 0 ? (
                events.map((event) => (
                  <EventCard
                    key={event.uid}
                    event={event}
                    onLikeToggle={() => handleLikeToggle(event.uid, event.isLiked)}
                    onInterestedToggle={() => handleInterestedToggle(event.uid, event.isInterested)}
                    onCardClick={() => handleCardClick(event)}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No events found.
                </div>
              )}
            </div>
          )}
        </div>
        {isViewEventOpen && selectedEvent && (
          <ViewEvent
            close={handleCloseEventClick}
            event={{
              ...selectedEvent,
              likedBy: selectedEvent.likes,
              interestedBy: selectedEvent.interested,
            }}
            orgName={selectedEvent.organizationId || ""}
            canComment={true}
          />
        )}
      </div>
    </div>
  );
};

export default EventsView;
