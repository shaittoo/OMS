import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import SearchIcon from "@mui/icons-material/Search";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import EventIcon from "@mui/icons-material/Event";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ViewEvent from "../components/viewEvent";

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
  likes: number;
  participation: number;
  interested?: string[];
  likedBy?: string[];
  interestedBy?: string[];
  tags: string[];
}

const Header: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">Current Events</h1>
        <p className="text-lg text-gray-500">
          <a href="/login" className="text-lg text-blue-500">
            Login{" "}
          </a>
          or
          <a href="/choose" className="text-lg text-blue-500">
            {" "}
            create an account{" "}
          </a>
          to unlock more features.
        </p>
      </div>
    </div>
  );
};

const SearchAndFilter: React.FC<{ onFilterChange: Function }> = ({
  onFilterChange,
}) => {
  const [activeFilters, setActiveFilters] = useState({
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
    searchTerm: "",
  });

  const handleFilterChange = (
    filterType: keyof typeof activeFilters,
    value: string
  ) => {
    setActiveFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [filterType]: value,
      };
      onFilterChange(newFilters); 
      return newFilters;
    });
  };

  const handleSortChange = (filterType: keyof typeof activeFilters) => {
    setActiveFilters((prevFilters) => {
      const newValue =
        prevFilters[filterType] === "none"
          ? "least"
          : prevFilters[filterType] === "least"
          ? "most"
          : "none";
      const newFilters = {
        ...prevFilters,
        [filterType]: newValue,
      };
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
          value={activeFilters.searchTerm}
          onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
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

const EventCard: React.FC<{ event: Event; onViewEventClick: (event: Event) => void; }> = ({ event, onViewEventClick }) => {
  const [orgName, setOrgName] = useState<string>("Loading...");
  const [comments, setComments] = useState<number>(0);

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
              onClick={e => { e.stopPropagation(); window.location.href = '/login'; }}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="Like (login required)"
            >
              <ThumbUpOffAltIcon fontSize="small" />
            </button>
            <span className="ml-1 text-sm text-gray-600">{Array.isArray(event.likes) ? event.likes.length : event.likes || 0}</span>
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
  const [allEvents, setAllEvents] = useState<Event[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
    searchTerm: "",
  });
  const [isViewEventOpen, setViewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleViewEventClick = (event: Event) => {
    setSelectedEvent(event);
    setViewEventOpen(true);
  };

  const handleCloseEventClick = () => {
    setViewEventOpen(false);
    setSelectedEvent(null);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
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
          };
        });
        setAllEvents(eventsList); 
        setEvents(eventsList); 
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const filterEvents = () => {
      const filteredEvents = allEvents.filter((event) => {
        const matchesSearchTerm =
          (event.eventName && event.eventName.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
          (event.eventLocation && event.eventLocation.toLowerCase().includes(filters.searchTerm.toLowerCase()));
  
        const matchesType = filters.type === "All" || event.eventType === filters.type;
  
        return matchesSearchTerm && matchesType;
      });

      const sortedEvents = filteredEvents.sort((a, b) => {
        if (filters.likes === "most") return b.likes - a.likes;
        if (filters.likes === "least") return a.likes - b.likes;

        if (filters.participation === "most") return b.participation - a.participation;
        if (filters.participation === "least") return a.participation - b.participation;

        if (filters.date === "most") return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        if (filters.date === "least") return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();

        return 0;
      });
  
      setEvents(sortedEvents); 
    };
  
    filterEvents();
  }, [filters, allEvents]); 

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        <SearchAndFilter onFilterChange={setFilters} />
        <div className="mt-6">
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading events...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.length > 0 ? (
                events.map((event) => <EventCard key={event.uid} event={event} onViewEventClick={handleViewEventClick} />)
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
              likedBy: [],
              interestedBy: [],
              tags: selectedEvent.tags || [],
              registrations: typeof selectedEvent.registrations === 'string' ? 
                parseInt(selectedEvent.registrations) || 0 : 
                selectedEvent.registrations || 0
            }}
            orgName={selectedEvent.organizationId ? selectedEvent.organizationId : ''}
            canComment={false}
          />
        )}
      </div>
    </div>
  );
};

export default EventsView;