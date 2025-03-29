import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import SearchIcon from "@mui/icons-material/Search";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import EventIcon from "@mui/icons-material/Event";
import MemberSidebar from "../components/membersidebar";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";

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
}

const Header: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">Current Events</h1>
        <p className="text-lg text-gray-500">
          Login or create an account to unlock more features.
        </p>
      </div>
    </div>
  );
};

const SearchAndFilter: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState({
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
  });

  const handleFilterChange = (
    filterType: keyof typeof activeFilters,
    value: string
  ) => {
    setActiveFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value,
    }));
  };

  const handleSortChange = (filterType: keyof typeof activeFilters) => {
    setActiveFilters((prevFilters) => {
      const newValue =
        prevFilters[filterType] === "none"
          ? "least"
          : prevFilters[filterType] === "least"
          ? "most"
          : "none";
      return {
        ...prevFilters,
        [filterType]: newValue,
      };
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
            "Cultural",
            "Sports",
            "Socials",
            "Competition",
            "Interests",
            "Volunteering",
            "Career",
            "Assemblies",
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

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const [orgName, setOrgName] = useState<string>("Loading...");
  const [interested, setInterested] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
    const fetchOrganizationName = async () => {
      if (event.organizationId) {
        try {
          const orgDoc = await getDoc(
            doc(db, "Organizations", event.organizationId)
          );
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
      <p className="text-gray-600 mt-2">
        {truncateText(event.eventDescription)}
      </p>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.log("Events: ", eventsList);
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

  return (
    <div className="flex h-screen">
      <MemberSidebar />
      <div className="flex-grow p-6 bg-white overflow-y-auto">
        <Header />
        <SearchAndFilter />
        <div className="mt-6">
          {loading ? (
            <div className="text-center text-gray-500 py-4">
              Loading events...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.length > 0 ? (
                events.map((event) => (
                  <EventCard key={event.uid} event={event} />
                ))
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
