import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  description?: string;
  location?: string;
  organizationName?: string;
  organizationId?: string;
  isTask?: boolean;
  backgroundColor?: string;
  assignedMembers?: string[];
  borderColor?: string;
  textColor?: string;
  display?: string;
}

export default function OrgCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [taskMembers, setTaskMembers] = useState<{ [taskId: string]: string[] }>({}); 

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
        // Get organization ID
        const orgRef = doc(db, "Users", user.uid);
        const orgSnapshot = await getDoc(orgRef);
        const organizationId = orgSnapshot.data()?.organizationId;

        if (!organizationId) {
          setError("User is not associated with an organization.");
          setLoading(false);
          return;
        }

        // Fetch organization's events
        const eventsQuery = query(
          collection(db, "events"),
          where("organizationId", "==", organizationId)
        );
        const eventsSnapshot = await getDocs(eventsQuery);

        const eventsList = eventsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.eventName,
            start: new Date(data.eventDate.seconds * 1000).toISOString(),
            description: data.eventDescription,
            location: data.eventLocation,
            organizationId: organizationId,
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50',
            textColor: 'white',
            display: 'block'
          };
        });

        // Fetch organization's tasks
        const tasksQuery = query(
          collection(db, "tasks"),
          where("organizationId", "==", organizationId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);

        const tasksList: CalendarEvent[] = [];
        const memberFetches: Promise<void>[] = [];
        const tempTaskMembers: { [taskId: string]: string[] } = {};

        tasksSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const taskId = docSnap.id;
          const assignedMembers = data.assignedMembers || []; // array of user UIDs

          tasksList.push({
            id: taskId,
            title: data.taskName,
            start: new Date(data.dueDate.seconds * 1000).toISOString(),
            isTask: true,
            organizationId: organizationId,
            assignedMembers: assignedMembers,
            backgroundColor: '#FF5733',
            borderColor: '#FF5733',
            textColor: 'white',
            display: 'block'
          });

          // Fetch member names for this task
          if (assignedMembers.length > 0) {
            memberFetches.push(
              Promise.all(
                assignedMembers.map(async (uid: string) => {
                  const userDoc = await getDoc(doc(db, "Users", uid));
                  const userData = userDoc.data();
                  return userData?.fullName || userData?.firstName || userData?.email || "Unknown";
                })
              ).then((names) => {
                tempTaskMembers[taskId] = names;
              })
            );
          }
        });

        // Wait for all member name fetches
        await Promise.all(memberFetches);

        setTaskMembers(tempTaskMembers);

        // Combine events and tasks
        setEvents([...eventsList, ...tasksList]);
      } catch (error) {
        console.error("Error fetching calendar items:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setError("Error fetching calendar items: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsAndTasks();
  }, []);

  const getEventsForDate = (dateStr: string) => {
    const [selYear, selMonth, selDay] = dateStr.split('-').map(Number);

    return events.filter(ev => {
      const evDate = new Date(ev.start);
      return (
        evDate.getFullYear() === selYear &&
        evDate.getMonth() + 1 === selMonth &&
        evDate.getDate() === selDay
      );
    });
  };

  return (
    <div className="App">
      {loading && 
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>}
      {error && <p>{error}</p>}
      {!loading && !error && (
        <>
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
                  title={`${event.title}${event.extendedProps.location ? ` - ${event.extendedProps.location}` : ''}`}
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
                  </div>
                </div>
              );
            }}
            eventDidMount={(info) => {
              info.el.title = `${info.event.title}${info.event.extendedProps.location ? ` - ${info.event.extendedProps.location}` : ''}`;
            }}
            height="auto"
            dayCellContent={(args) => {
              return (
                <div
                  className="fc-daygrid-day-number cursor-pointer"
                  style={{ padding: "4px" }}
                  onClick={() => setSelectedDate(
                    `${args.date.getFullYear()}-${String(args.date.getMonth() + 1).padStart(2, '0')}-${String(args.date.getDate()).padStart(2, '0')}`
                  )}
                >
                  {args.dayNumberText}
                </div>
              );
            }}
          />
          {/* Show events/tasks for selected date */}
          {selectedDate && (
            <div className="mt-6 bg-white rounded shadow p-4">
              <h2 className="text-lg font-semibold mb-2">
              Events & Tasks on {selectedDate && new Date(selectedDate + "T00:00:00Z").toLocaleDateString()}
            </h2>
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500">No events or tasks for this date.</p>
              ) : (
                <ul className="space-y-2">
                  {getEventsForDate(selectedDate).map(ev => (
                    <li key={ev.id} className="border-b pb-2">
                      <span className="font-semibold">{ev.isTask ? "📋 Task: " : "📅 Event: "}</span>
                      <span>{ev.title}</span>
                      {ev.location && (
                        <span className="ml-2 text-gray-500 text-sm">({ev.location})</span>
                      )}
                      {ev.description && (
                        <div className="text-gray-600 text-sm mt-1">{ev.description}</div>
                      )}
                      {/* Show assigned members if this is a task */}
                      {ev.isTask && taskMembers[ev.id] && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">Assigned to: </span>
                          {taskMembers[ev.id].join(", ")}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}