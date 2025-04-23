import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventsAndTasks = async () => {
      setLoading(true);
      setError(null);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("You must be logged in to view the calendar.");
        setLoading(false);
        return;
      }

      try {
        // Fetch user's calendar events
        const userRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const calendarEvents = userData?.calendarEvents || [];

        // Filter events based on organizationId if provided
        let filteredEvents = organizationId 
          ? calendarEvents.filter((event: CalendarEvent) => event.organizationId === organizationId)
          : calendarEvents;

        // Fetch tasks
        let tasksQuery;
        if (organizationId) {
          tasksQuery = query(
            collection(db, "tasks"),
            where("organizationId", "==", organizationId)
          );
        } else {
          // If no organizationId is provided, fetch user's personal tasks
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
            backgroundColor: '#FF5733', // Different color for tasks
            borderColor: '#FF5733',
            textColor: 'white',
            display: 'block'
          };
        });

        // Combine filtered events and tasks
        const allEvents = [
          ...filteredEvents.map((event: CalendarEvent) => ({
            ...event,
            backgroundColor: '#4CAF50', // Different color for events
            borderColor: '#4CAF50',
            textColor: 'white',
            display: 'block'
          })),
          ...tasksList
        ];

        setEvents(allEvents);
      } catch (error) {
        console.error("Error fetching calendar items:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setError("Error fetching calendar items: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsAndTasks();
  }, [organizationId]);

  return (
    <div className="App">
      {loading && 
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>}
      {error && <p>{error}</p>}
      {!loading && !error && (
        <FullCalendar
          initialView="dayGridMonth"
          themeSystem="Simplex"
          headerToolbar={{
            left: "",
            center: "title",
            right: "prev,next",
          }}
          plugins={[dayGridPlugin]}
          events={events}
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
      )}
    </div>
  );
}
