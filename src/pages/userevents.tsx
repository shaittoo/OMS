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
  organizationName?: string; // Add organization name
  likedBy: string[];
  dislikedBy: string[];
  interestedBy: string[];
}

const Header: React.FC = () => (
  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
    <div>
      <h1 className="text-3xl font-semibold text-gray-800">Your events</h1>
      <p className="text-lg text-gray-500">Manage and view event details</p>
    </div>
    <div className="flex items-center space-x-4 mt-4 md:mt-0">
      <button
        className="text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200"
        // You can replace handleRedirect with an actual handler
        onClick={() => {}}
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

const MyEventsView: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, loadingUser] = useAuthState(auth);
  const [isEditEventOpen, setEditEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filters, setFilters] = useState({
    type: "All",
    likes: "none",
    participation: "none",
    date: "none",
    searchTerm: "",
  });

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

        // Fetch user's organization ID
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setError("User not found.");
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const organizationId = userData?.organizationId;

        if (!organizationId) {
          setError("Organization ID not found for the user.");
          setLoading(false);
          return;
        }

        // Fetch organization name
        const orgDocRef = doc(db, "Organizations", organizationId);
        const orgDoc = await getDoc(orgDocRef);
        const organizationName = orgDoc.exists()
          ? orgDoc.data()?.name || "Unnamed Organization"
          : "Unknown Organization";

        // Query events based on organization ID
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("organizationId", "==", organizationId));
        const querySnapshot = await getDocs(q);

        const eventsList = querySnapshot.docs.map((doc) => {
          const data = doc.data() as Event;
          const eventDate =
            data.eventDate instanceof Timestamp
              ? data.eventDate.toDate()
              : new Date(data.eventDate);

          // Check if event date is in the past and update status to 'Done'
          const currentDate = new Date();
          const status = eventDate < currentDate ? "Completed" : data.status;

          return {
            ...data,
            uid: doc.id,
            eventDate: eventDate.toLocaleDateString(),
            organizationName, // Include organization name in event data
            status, // Update the status if event date is in the past
          };
        });

        setEvents(eventsList);
      } catch (err) {
        console.error("Error fetching user events:", err);
        setError("Failed to load your events.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [user]);

  useEffect(() => {
    const filterEvents = () => {
      const filteredEvents = events.filter((event) => {
        // Filter based on search term
        const matchesSearchTerm =
          event.eventName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          event.eventLocation.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        // Filter based on event type
        const matchesType = filters.type === "All" || event.eventType === filters.type;
        
        return matchesSearchTerm && matchesType;
      });

      setEvents(filteredEvents);
    };

    filterEvents();
  }, [filters, events]);

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
      console.log("Event deleted with UID:", uid);

      setEvents((prevEvents) => prevEvents.filter((event) => event.uid !== uid));
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete the event.");
    }
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.uid === updatedEvent.uid ? updatedEvent : event
      )
    );
  };

  return (
    <div className="flex">
      <OfficerSidebar />
      <div className="flex-grow p-6 bg-white">
        <Header />
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
                  <th className="px-4 py-2">
                    <EventIcon sx={{ color: "white" }} /> Event Name
                  </th>
                  <th className="px-4 py-2">
                    <CalendarTodayIcon sx={{ color: "white" }} /> Date
                  </th>
                  <th className="px-4 py-2">
                    <StarIcon sx={{ color: "white" }} /> Interests
                  </th>
                  <th className="px-4 py-2">
                    <PeopleIcon sx={{ color: "white" }} /> Status
                  </th>
                  <th className="px-4 py-2">
                    <PeopleIcon sx={{ color: "white" }} /> Engagements
                  </th>
                  <th className="px-4 py-2">
                    <PeopleIcon sx={{ color: "white" }} /> Action
                  </th>
                  <th className="px-4 py-2">
                    <PeopleIcon sx={{ color: "white" }} /> Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <tr key={index} className="even:bg-gray-50">
                      <td className="px-4 py-2">{event.eventName}</td>
                      <td className="px-4 py-2">{event.eventDate.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        {event.interestedBy ? event.interestedBy.length : 0}
                      </td>
                      <td className="px-4 py-2">{event.status}</td>
                      <td className="px-4 py-2">
                        <ThumbUpOffAltIcon className="ml-2" />{" "}
                        {event.likedBy ? event.likedBy.length : 0}
                        <ThumbDownOffAltIcon className="ml-2" />{" "}
                        {event.dislikedBy ? event.dislikedBy.length : 0}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className="text-black-500 hover:underline"
                          onClick={() => handleEdit(event)}
                        >
                          Edit
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <DeleteIcon
                          className="ml-2 cursor-pointer"
                          onClick={() => handleDelete(event.uid)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-4">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
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