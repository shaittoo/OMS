import React, { useEffect, useState } from "react";
import { arrayUnion, arrayRemove, collection, doc, getDoc, getDocs, Timestamp, updateDoc, query, where } from "firebase/firestore";
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
  tags: string[];
  approvalStatus: string;
}

const Header: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
      <div>
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

const EventCard: React.FC<{ event: Event; onViewEventClick: (event: Event) => void }> = ({ event, onViewEventClick }) => {
  const [orgName, setOrgName] = useState<string>("Loading...");
  const [liked, setLiked] = useState(event.isLiked);
  const [comments, setComments] = useState<number>(0);
  const [likeCount, setLikeCount] = useState(event.likes?.length || 0);

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

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = auth.currentUser?.uid;
    setLiked((prev) => {
      const newLiked = !prev;
      setLikeCount((count) => newLiked ? count + 1 : count - 1);
      return newLiked;
    });

    if (userId) {
      const userRef = doc(db, "Users", userId);
      await updateDoc(userRef, {
        likedEvents: liked ? arrayRemove(event.uid) : arrayUnion(event.uid),
      });
    }
    const eventRef = doc(db, "events", event.uid);
    await updateDoc(eventRef, {
      likes: liked ? arrayRemove(userId) : arrayUnion(userId),
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => onViewEventClick(event)}>
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
            <span className="ml-1 text-sm text-gray-600">{likeCount}</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={e => { e.stopPropagation(); onViewEventClick(event); }}
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
  const [isViewEventOpen, setViewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState<string>("");

  const handleViewEventClick = async (event: Event) => {
    setSelectedEvent(event);
    setViewEventOpen(true);
    // Fetch org name for modal
    if (event.organizationId) {
      try {
        const orgDoc = await getDoc(doc(db, "Organizations", event.organizationId));
        if (orgDoc.exists()) {
          const data = orgDoc.data();
          setSelectedOrgName(data.name || "Unknown Organization");
        } else {
          setSelectedOrgName("Organization Not Found");
        }
      } catch (err) {
        setSelectedOrgName("Error fetching organization");
      }
    } else {
      setSelectedOrgName("No Organization ID");
    }
  };

  const handleCloseEventClick = () => {
    setViewEventOpen(false);
    setSelectedEvent(null);
    setSelectedOrgName("");
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const userId = auth.currentUser?.uid;

    let userEvents = {
      likedEvents: [] as string[],
      interestedEvents: [] as string[],
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
      const eventsQuery = query(
        eventsRef,
        where("approvalStatus", "==", "accepted")
      );
      const querySnapshot = await getDocs(eventsQuery);
      console.log("Number of events found:", querySnapshot.size);

      const eventsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Event data:", data);
        
        const eventDate = data.eventDate instanceof Timestamp
          ? data.eventDate.toDate()
          : new Date(data.eventDate);

        return {
          uid: doc.id,
          eventName: data.eventName || "",
          eventDescription: data.eventDescription || "",
          eventDate,
          eventLocation: data.eventLocation || "",
          eventPrice: data.eventPrice || "0",
          eventImages: data.eventImages || [],
          eventType: data.eventType || "general",
          isFree: data.isFree || "false",
          isOpenForAll: data.isOpenForAll || false,
          status: data.status || "upcoming",
          organizationId: data.organizationId || "",
          registrations: data.registrations || 0,
          likes: data.likes || [],
          interested: data.interested || [],
          isLiked: userEvents.likedEvents.includes(doc.id),
          isInterested: userEvents.interestedEvents.includes(doc.id),
          tags: data.tags || [],
          approvalStatus: data.approvalStatus || "pending"
        };
      });

      console.log("Processed events list:", eventsList);

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

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-shrink-0">
        <OfficerSidebar />
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
                    onViewEventClick={handleViewEventClick}
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
              likedBy: selectedEvent.likes ?? [],
              interestedBy: selectedEvent.interested ?? []
            }}
            orgName={selectedOrgName}
            canComment={false}
          />
        )}
      </div>
    </div>
  );
};

export default EventsView;