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
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import SearchIcon from "@mui/icons-material/Search";
import OfficerEditEvent from "../components/officerEditEvent";
import OfficerAddEvent from "../components/officeraddevent";
import { toast, ToastContainer } from "react-toastify";

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
  approvalStatus: string;
}

const Header: React.FC<{ onBack: () => void; onAddEvent: () => void }> = ({ onBack, onAddEvent }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
    <div className="flex items-center">
      {/* <button
        onClick={onBack}
        className="mr-4 text-purple-700 hover:text-purple-900 font-bold"
      >
        &#8592;
      </button> */}
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
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
    router.push("/orgpage"); // Navigate to the previous page
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

          return {
            ...data,
            uid: doc.id,
            eventDate,
            organizationName,
            approvalStatus: data.approvalStatus || "pending"
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
                  <th className="px-4 py-2"><CheckCircleIcon /> Approval Status</th>
                  <th className="px-4 py-2"><ThumbUpIcon /> Engagements</th>
                  <th className="px-4 py-2"><EditIcon /> Action</th>
                  <th className="px-4 py-2"><DeleteIcon /> Delete</th>
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
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          event.approvalStatus === 'accepted' 
                            ? 'bg-green-100 text-green-800'
                            : event.approvalStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <ThumbUpIcon className="ml-2" /> {event.likedBy?.length || 0}
                      </td>
                      <td className="px-4 py-2">
                        <button className="hover:underline" onClick={() => handleEdit(event)}>
                          Edit
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <DeleteIcon
                          className="cursor-pointer"
                          onClick={() => {
                            setEventToDelete(event);
                            setShowDeleteModal(true);
                          }}
                        />
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

      {showDeleteModal && eventToDelete && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
      <p className="text-gray-600 mb-4">
        Are you sure you want to delete <strong>{eventToDelete.eventName}</strong>?
      </p>
      <div className="flex justify-end space-x-3">
        <button
          className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => {
            setShowDeleteModal(false);
            setEventToDelete(null);
          }}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={async () => {
            try {
              await deleteDoc(doc(db, "events", eventToDelete.uid));
              setEvents((prev) => prev.filter((e) => e.uid !== eventToDelete.uid));
              setAllEvents((prev) => prev.filter((e) => e.uid !== eventToDelete.uid));

              toast.success("Event deleted successfully", {
                  style: {
                    backgroundColor: "rgba(243, 232, 255, 0.95)",
                    color: "#374151",
                    borderRadius: "12px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
                    fontSize: "14px",
                    padding: "12px 16px",
                    minHeight: "48px",
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid rgba(0, 0, 0, 0.05)",
                    margin: "0 0 16px 0",
                  },
                  icon: false,
                  });
             } catch (err) {
              console.error("Error deleting event:", err);
              setError("Failed to delete event.");
              toast.error("Failed to delete event", {
                  style: {
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    color: "#DC2626", // Red text for error
                    borderRadius: "12px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
                    fontSize: "14px",
                    padding: "12px 16px",
                    minHeight: "48px",
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid rgba(0, 0, 0, 0.05)",
                    margin: "0 0 16px 0",
                  },
                  icon: false,
                  });
            } finally {
              setShowDeleteModal(false);
              setEventToDelete(null);
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

<ToastContainer
            position="bottom-right"
            autoClose={2000}
            hideProgressBar
            closeButton={false}
            closeOnClick
            pauseOnHover={false}
            draggable={false}
            toastStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            color: "#374151",
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
            fontSize: "14px",
            padding: "12px 16px",
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            margin: "0 0 16px 0",
            }}
            />

    </div>

    
  );
};

export default MyEventsView;