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
  likedBy: string[];
  dislikedBy: string[];
  interestedBy: string[];
  isLiked: boolean;
  isDisliked: boolean;
  isInterested: boolean;
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

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const [orgName, setOrgName] = useState<string>("Loading...");
  const [interested, setInterested] = useState(event.isInterested);
  const [liked, setLiked] = useState(event.isLiked);
  const [disliked, setDisliked] = useState(event.isDisliked);
  
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
            interestedBy: interested ? arrayRemove(auth.currentUser?.uid) : arrayUnion(auth.currentUser?.uid),
        });
    }

    const eventRef = doc(db, "events", event.uid);
    await updateDoc(eventRef, {
        interestedBy: interested ? arrayRemove(userId) : arrayUnion(userId),
    });
  };

  const handleLikeClick = async () => {
    const userId = auth.currentUser?.uid;

    setLiked(!liked);
    if (disliked) setDisliked(false);

    if (userId) {
        const userRef = doc(db, "Users", userId);
        await updateDoc(userRef, {
            likedEvents: liked ? arrayRemove(event.uid) : arrayUnion(event.uid),
            dislikedEvents: arrayRemove(event.uid),
        });
    }

    const eventRef = doc(db, "events", event.uid);
    await updateDoc(eventRef, {
        likedBy: liked ? arrayRemove(userId) : arrayUnion(userId),
    });
};

  const handleDislikeClick = async() => {
    const userId = auth.currentUser?.uid;

    setDisliked(!disliked);
    if (liked) setLiked(false);

    if (userId) {
        const userRef = doc(db, "Users", userId);
        await updateDoc(userRef, {
            dislikedEvents: disliked ? arrayRemove(event.uid) : arrayUnion(event.uid),
            likedEvents: arrayRemove(event.uid),
        });
    }

    const eventRef = doc(db, "events", event.uid);
    await updateDoc(eventRef, {
        dislikedBy: disliked ? arrayRemove(userId) : arrayUnion(userId),
    });
  };

  const truncateText = (text: string | undefined) => {
    return text && text.length > 100 ? text.substring(0, 100) + "..." : text || "";
  };

  return (
    <div className="bg-white shadow-md hover:shadow-lg hover:shadow-gray-500 rounded-lg p-4 mb-4">
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
      <h2 className="text-xl font-semibold mt-4">{event.isLiked}</h2>
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
          ? event.eventDate.toLocaleDateString()
          : event.eventDate}
      </p>

      <div className="flex items-center mt-4">
        <div
          className={`mr-2 flex items-center cursor-pointer ${
            liked ? "text-green-500" : "text-gray-500"
          }`}
          onClick={handleLikeClick}
        >
          {liked ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
          <span className="ml-1">Like</span>
        </div>
        <div
          className={`flex items-center cursor-pointer ${
            disliked ? "text-red-500" : "text-gray-500"
          }`}
          onClick={handleDislikeClick}
        >
          {disliked ? <ThumbDownIcon /> : <ThumbDownOffAltIcon />}
          <span className="ml-1">Dislike</span>
        </div>

        <button
          className={`ml-20 px-4 py-2 rounded-md ${
            interested ? "bg-gray-500 text-white" : "bg-blue-500 text-white"
          }`}
          onClick={handleInterestedClick}
        >
          {interested ? "Interested" : "Interested?"}
        </button>
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

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      const userId = auth.currentUser?.uid;
    
      let userEvents = {
        likedEvents: [],
        dislikedEvents: [],
        interestedEvents: [],
      };
    
      try {
        // Fetch user events data
        if (userId) {
          const userDoc = await getDoc(doc(db, "Users", userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userEvents = {
              likedEvents: userData.likedEvents || [],
              dislikedEvents: userData.dislikedEvents || [],
              interestedEvents: userData.interestedEvents || [],
            };
          }
        }
    
        // Get all events from the database
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
            isDisliked: userEvents.dislikedEvents.includes(doc.id as never),
            isInterested: userEvents.interestedEvents.includes(doc.id as never),
          };
        });
    
        // Apply search filter
        let filteredEvents = eventsList.filter(event => {
          const matchesSearchQuery =
            event.eventName?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ?? false;
          const matchesType = filters.type === "All" || event.eventType === filters.type;
          return matchesSearchQuery && matchesType;
        });
    
        // Sorting based on date, likes, or participation
        if (filters.date !== "none") {
          filteredEvents = filteredEvents.sort((a, b) => {
            const dateA = a.eventDate;
            const dateB = b.eventDate;
            if (filters.date === "most") {
              return dateB.getTime() - dateA.getTime(); // Sort latest first
            } else if (filters.date === "least") {
              return dateA.getTime() - dateB.getTime(); // Sort oldest first
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
      <OfficerSidebar />
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
      </div>
    </div>
  );
};

export default EventsView;