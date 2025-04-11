import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

// Define Task type (adjust based on your actual task structure)
interface Task {
  id: string;
  taskName: string;
  dueDate: string; // Due date as a string in a readable format
}

interface CalendarProps {
  organizationId?: string;
}

export default function Calendar({ organizationId }: CalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetching tasks and mapping them to FullCalendar format
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("You must be logged in to view tasks.");
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

        const memTaskList = tasksSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            taskName: data.taskName,
            dueDate: new Date(data.dueDate.seconds * 1000).toISOString(), // Convert to ISO string
          } as Task;
        });

        setTasks(memTaskList);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setError("Error fetching tasks: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [organizationId]);

  // Group tasks by dueDate
  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.dueDate.split("T")[0]; // Get only the date part (YYYY-MM-DD)
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Map the tasks to FullCalendar event format
  const calendarEvents = Object.keys(groupedTasks).map((date) => ({
    title: groupedTasks[date].map((task) => task.taskName).join(", "), // Join tasks by comma
    start: date, // FullCalendar requires a start date (ISO string or Date)
    // backgroundColor: "lightblue", // Example color
    // borderColor: "blue", // Example border color
  }));

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
          events={calendarEvents}  // Pass the mapped tasks to FullCalendar
          eventColor={"#" + Math.floor(Math.random() * 16777215).toString(16)}
          eventContent={(eventInfo) => {
            // Get the list of tasks for this day
            const date = eventInfo.event.startStr.split("T")[0]; // Get date part (YYYY-MM-DD)
            const tasksForDay = groupedTasks[date];

            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "0.5px",
                  margin: "0",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {tasksForDay.length > 0 ? (
                  tasksForDay.map((task, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: "12px",
                        padding: "1px",
                        // backgroundColor: "#FF5733", // Task background color
                        marginBottom: "2px",
                        color: "white",
                        borderRadius: "4px",
                        whiteSpace: "nowrap", // Prevent text wrapping
                        overflow: "hidden",
                        textOverflow: "ellipsis", // Show "..." for overflowed text
                      }}
                    >
                      {task.taskName}
                    </div>
                  ))
                ) : (
                  <div>No tasks</div>
                )}
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
