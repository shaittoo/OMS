import React, { useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/router"; 
import OfficerSidebar from "../components/officersidebar";
import EventIcon from "@mui/icons-material/Event";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StarIcon from "@mui/icons-material/Star";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import PeopleIcon from "@mui/icons-material/People";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import OfficerEditEvent from "../components/officerEditEvent";
import OfficerAddEvent from "../components/officeraddevent"; // Import the OfficerAddEvent component

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
  tags: string[];
  status: string;
  organizationId: string;
  registrations: number;
  organizationName?: string;
  likedBy: string[];
  interestedBy: string[];
}

const Header: React.FC<{ onBack: () => void; onAddEvent: () => void }> = ({ onBack, onAddEvent }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
    <div className="flex items-center">
      <button
        onClick={onBack}
        className="mr-4 text-purple-700 hover:text-purple-900 font-bold"
      >
        &#8592;
      </button>
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">Your events</h1>
        <p className="text-lg text-gray-500">Manage and view event details</p>
      </div>
    </div>
    <div className="flex items-center space-x-4 mt-4 md:mt-0">
      <button
        className="text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200"
        onClick={onAddEvent} // Use the onAddEvent prop
      >
        Create Event
      </button>
    </div>
  </div>
);

const SearchAndFilter: React.FC<{ onFilterChange: Function }> = ({ onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState({
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
    searchTerm: "",
  });

  const handleFilterChange = (filterType: keyof typeof activeFilters, value: string) => {
    const newFilters = { ...activeFilters, [filterType]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (filterType: keyof typeof activeFilters) => {
    const newValue =
      activeFilters[filterType] === "none"
        ? "least"
        : activeFilters[filterType] === "least"
        ? "most"
        : "none";

    const newFilters = { ...activeFilters, [filterType]: newValue };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
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

const MyEventsView: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [isEditEventOpen, setEditEventOpen] = useState(false);
  const [isAddEventOpen, setAddEventOpen] = useState(false); // State for Add Event form
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filters, setFilters] = useState({
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
    searchTerm: "",
  });

  const router = useRouter(); // Initialize useRouter

  const handleBack = () => {
    router.back(); // Navigate to the previous page
  };

  const handleAddEventClick = () => {
    setAddEventOpen(true); // Open the Add Event form
  };

  const handleCloseEventForm = () => {
    setAddEventOpen(false); // Close the Add Event form
  };

  useEffect(() => {
    const fetchMyEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user) {
          setError("You must be logged in to view your events.");
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setError("User not found.");
          setLoading(false);
          return;
        }

        const organizationId = userDoc.data()?.organizationId;
        if (!organizationId) {
          setError("Organization ID not found.");
          setLoading(false);
          return;
        }

        const orgDoc = await getDoc(doc(db, "Organizations", organizationId));
        const organizationName = orgDoc.exists() ? orgDoc.data()?.name || "Unnamed" : "Unknown";

        const q = query(collection(db, "events"), where("organizationId", "==", organizationId));
        const snapshot = await getDocs(q);

        const fetchedEvents = snapshot.docs.map((doc) => {
          const data = doc.data() as Event;
          const eventDate =
            data.eventDate instanceof Timestamp
              ? data.eventDate.toDate()
              : new Date(data.eventDate);
          const status = data.status === "Cancelled" ? "Cancelled" : (eventDate < new Date() ? "Completed" : data.status);

          return {
            ...data,
            uid: doc.id,
            eventDate,
            organizationName,
            status,
          };
        });

        setAllEvents(fetchedEvents);
        setEvents(fetchedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load your events.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [user]);

  useEffect(() => {
    let filtered = allEvents.filter((event) => {
      const matchesSearch =
        event.eventName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        event.eventLocation.toLowerCase().includes(filters.searchTerm.toLowerCase());
  
      const matchesType = filters.type === "All" || event.eventType === filters.type;
  
      return matchesSearch && matchesType;
    });
  
    if (filters.likes !== "none") {
      filtered = [...filtered].sort((a, b) => {
        const aLikes = a.likedBy?.length || 0;
        const bLikes = b.likedBy?.length || 0;
        return filters.likes === "most" ? bLikes - aLikes : aLikes - bLikes;
      });
    }
  
    if (filters.participation !== "none") {
      filtered = [...filtered].sort((a, b) => {
        const aParticipation = a.interestedBy?.length || 0;
        const bParticipation = b.interestedBy?.length || 0;
        return filters.participation === "most" ? bParticipation - aParticipation : aParticipation - bParticipation;
      });
    }
  
    if (filters.date !== "none") {
      filtered = [...filtered].sort((a, b) => {
        const aDate = new Date(a.eventDate).getTime();
        const bDate = new Date(b.eventDate).getTime();
        return filters.date === "most" ? aDate - bDate : bDate - aDate;
      });
    }
  
    setEvents(filtered);
  }, [filters, allEvents]);

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setEditEventOpen(true);
  };

  const handleCloseEditEvent = () => {
    setEditEventOpen(false);
    setSelectedEvent(null);
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteDoc(doc(db, "events", uid));
      setEvents((prev) => prev.filter((event) => event.uid !== uid));
      setAllEvents((prev) => prev.filter((event) => event.uid !== uid));
    } catch (err) {
      console.error("Error deleting event:", err);
      setError("Failed to delete event.");
    }
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    const formattedDate =
      updatedEvent.eventDate instanceof Date
        ? updatedEvent.eventDate.toLocaleDateString()
        : updatedEvent.eventDate;
  
    const newEvent = { ...updatedEvent, eventDate: formattedDate };
  
    setEvents((prev) =>
      prev.map((event) => (event.uid === updatedEvent.uid ? newEvent : event))
    );
    setAllEvents((prev) =>
      prev.map((event) => (event.uid === updatedEvent.uid ? newEvent : event))
    );
  };  

  return (
    <div className="flex min-h-screen">
      <div className="w-64 flex-shrink-0">
        <OfficerSidebar />
      </div>
      <div className="flex-grow p-6 bg-white">
        <Header onBack={handleBack} onAddEvent={handleAddEventClick} />
        <SearchAndFilter onFilterChange={setFilters} />
        <div className="mt-6">
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading events...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            <table className="table-auto w-full rounded-lg overflow-hidden shadow-lg border border-gray-300 text-left">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="px-4 py-2"><EventIcon /> Event Name</th>
                  <th className="px-4 py-2"><CalendarTodayIcon /> Date</th>
                  <th className="px-4 py-2"><StarIcon /> Interests</th>
                  <th className="px-4 py-2"><PeopleIcon /> Status</th>
                  <th className="px-4 py-2"><PeopleIcon /> Engagements</th>
                  <th className="px-4 py-2"><PeopleIcon /> Action</th>
                  <th className="px-4 py-2"><PeopleIcon /> Delete</th>
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map((event) => (
                    <tr key={event.uid} className="even:bg-gray-50">
                      <td className="px-4 py-2">{event.eventName}</td>
                      <td className="px-4 py-2">
                        {event.eventDate instanceof Date
                          ? event.eventDate.toLocaleDateString()
                          : new Date(event.eventDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">{event.interestedBy?.length || 0}</td>
                      <td className="px-4 py-2">{event.status}</td>
                      <td className="px-4 py-2">
                        <ThumbUpOffAltIcon className="ml-2" /> {event.likedBy?.length || 0}
                      </td>
                      <td className="px-4 py-2">
                        <button className="hover:underline" onClick={() => handleEdit(event)}>
                          Edit
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <DeleteIcon className="cursor-pointer" onClick={() => handleDelete(event.uid)} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-4">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Event Form */}
      {isAddEventOpen && <OfficerAddEvent close={handleCloseEventForm} />}

      {isEditEventOpen && selectedEvent && (
        <OfficerEditEvent
          close={handleCloseEditEvent}
          event={selectedEvent}
          onUpdate={handleUpdateEvent}
        />
      )}
    </div>
  );
};

export default MyEventsView;