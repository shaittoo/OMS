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
  registrations: string;
  likes: number;  // Add likes for sorting
  participation: number;  // Add participation for sorting
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
      onFilterChange(newFilters); // Pass new filters to parent
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
      onFilterChange(newFilters); // Pass new filters to parent
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

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const [orgName, setOrgName] = useState<string>("Loading...");

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

  const truncateText = (text: string) => {
    if (text.length > 100) {
      return text.substring(0, 100) + "...";
    }
    return text;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      {event.eventImages && event.eventImages.length > 0 ? (
        <img
          src={event.eventImages[0]}
          alt={event.eventImages[0]}
          className="w-full h-48 object-cover rounded-md"
        />
      ) : (
        <div className="w-full h-48 bg-gray-300 flex items-center justify-center rounded-md">
          <p className="text-gray-500">No Image Available</p>
        </div>
      )}
      <h2 className="text-xl font-semibold mt-4">{event.eventName}</h2>
      <p className="text-gray-600 mt-2">{truncateText(event.eventDescription)}</p>
      <p className="text-gray-500 mt-2">
        <CorporateFareIcon />
        &nbsp; {orgName}
      </p>
      <p className="text-gray-400 mt-2">
        <EventIcon />
        &nbsp;
        {event.eventDate instanceof Date
          ? event.eventDate.toLocaleDateString() // Format the date as a string
          : event.eventDate}
      </p>
    </div>
  );
};

const EventsView: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]); // Store raw events
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
    searchTerm: "",
  });

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
        setAllEvents(eventsList); // Save all raw events
        setEvents(eventsList); // Initially display all events
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
        // Filter based on search term, ensuring eventName and eventLocation are strings
        const matchesSearchTerm =
          (event.eventName && event.eventName.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
          (event.eventLocation && event.eventLocation.toLowerCase().includes(filters.searchTerm.toLowerCase()));
  
        // Filter based on event type
        const matchesType = filters.type === "All" || event.eventType === filters.type;
  
        return matchesSearchTerm && matchesType;
      });

      // Sort based on selected filters
      const sortedEvents = filteredEvents.sort((a, b) => {
        if (filters.likes === "most") return b.likes - a.likes;
        if (filters.likes === "least") return a.likes - b.likes;

        if (filters.participation === "most") return b.participation - a.participation;
        if (filters.participation === "least") return a.participation - b.participation;

        if (filters.date === "most") return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        if (filters.date === "least") return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();

        return 0;
      });
  
      setEvents(sortedEvents); // Set filtered and sorted events to state
    };
  
    filterEvents();
  }, [filters, allEvents]); // Re-run filtering and sorting when filters or allEvents change

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
                events.map((event) => <EventCard key={event.uid} event={event} />)
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No events found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsView;