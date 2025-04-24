import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";

// Define Event type
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  description?: string;
  location?: string;
  organizationName?: string;
  organizationId?: string;
  isTask?: boolean;
}

interface Task {
  id: string;
  taskName: string;
  dueDate: string;
}

interface CalendarProps {
  organizationId?: string;
}

export default function Calendar({ organizationId }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to view the calendar.");
      setLoading(false);
      return;
    }

    try {
      let tasksQuery;
      if (organizationId) {
        tasksQuery = query(
          collection(db, "tasks"),
          where("organizationId", "==", organizationId)
        );
      } else {
        tasksQuery = query(
          collection(db, "tasks"),
          where("memberId", "==", user.uid)
        );
      }
      const tasksSnapshot = await getDocs(tasksQuery);

      const tasksList = tasksSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.taskName,
          start: new Date(data.dueDate.seconds * 1000).toISOString(),
          isTask: true,
          organizationId: data.organizationId,
          backgroundColor: '#FF5733',
          borderColor: '#FF5733',
          textColor: 'white',
          display: 'block'
        };
      });

      setTasks(tasksList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Error fetching tasks");
      setLoading(false);
    }
  };

  // Add real-time listener for calendar events
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to view the calendar.");
      setLoading(false);
      return;
    }

    const userRef = doc(db, "Users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const calendarEvents = userData?.calendarEvents || [];
        
        // Filter events based on organizationId if provided
        let filteredEvents = organizationId 
          ? calendarEvents.filter((event: CalendarEvent) => event.organizationId === organizationId)
          : calendarEvents;

        // Update events with proper styling
        const updatedEvents = filteredEvents.map((event: CalendarEvent) => ({
          ...event,
          backgroundColor: '#4CAF50',
          borderColor: '#4CAF50',
          textColor: 'white',
          display: 'block'
        }));

        setEvents(updatedEvents);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error in calendar events listener:", error);
      setError("Error loading calendar events");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  // Initial fetch of tasks
  useEffect(() => {
    fetchTasks();
  }, [organizationId]);

  // Combine events and tasks for display
  const allEvents = [...events, ...tasks];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="App">
      <FullCalendar
        initialView="dayGridMonth"
        themeSystem="Simplex"
        headerToolbar={{
          left: "",
          center: "title",
          right: "prev,next",
        }}
        plugins={[dayGridPlugin]}
        events={allEvents}
        dayMaxEvents={2}
        moreLinkContent={(args) => `+${args.num} more`}
        fixedWeekCount={false}
        showNonCurrentDates={false}
        eventContent={(eventInfo) => {
          const event = eventInfo.event;
          
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "2px",
                overflow: "hidden",
                backgroundColor: event.backgroundColor,
                borderRadius: "4px",
                margin: "1px 0",
                minHeight: "22px",
              }}
              title={`${event.title}${event.extendedProps.organizationName ? ` - ${event.extendedProps.organizationName}` : ''}`}
            >
              <div
                style={{
                  fontSize: "12px",
                  padding: "1px 4px",
                  color: "white",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: "1.2",
                }}
              >
                {event.extendedProps.isTask ? "📋 " : "📅 "}{event.title}
                {event.extendedProps.organizationName && !event.extendedProps.isTask && (
                  <div style={{ fontSize: "10px", opacity: 0.8 }}>
                    {event.extendedProps.organizationName}
                  </div>
                )}
              </div>
            </div>
          );
        }}
        eventDidMount={(info) => {
          info.el.title = `${info.event.title}${info.event.extendedProps.organizationName ? ` - ${info.event.extendedProps.organizationName}` : ''}`;
        }}
        height="auto"
        dayCellContent={(args) => {
          return (
            <div className="fc-daygrid-day-number" style={{ padding: "4px" }}>
              {args.dayNumberText}
            </div>
          );
        }}
      />
    </div>
  );
}
