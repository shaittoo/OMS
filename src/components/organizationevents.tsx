import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Chip, Box, Typography, Card, CardContent, Grid } from "@mui/material";
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';

interface Event {
  id: string;
  eventName: string;
  eventDate: any;
  eventDescription: string;
  eventPrice: number;
  isOpenForAll: boolean;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  eventLocation: string;
  eventImages: string[];
}

interface OrganizationEventsProps {
  organizationId: string;
}

const OrganizationEvents: React.FC<OrganizationEventsProps> = ({ organizationId }) => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "events");
        const q = query(
          eventsRef,
          where("organizationId", "==", organizationId),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [organizationId]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Chip
            icon={<PendingIcon />}
            label="Pending Approval"
            color="warning"
            size="small"
          />
        );
      case 'approved':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Approved"
            color="success"
            size="small"
          />
        );
      case 'rejected':
        return (
          <Chip
            icon={<BlockIcon />}
            label="Rejected"
            color="error"
            size="small"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Events
      </Typography>
      <Grid container spacing={2}>
        {events.map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {event.eventName}
                  </Typography>
                  {getStatusChip(event.status)}
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {new Date(event.eventDate.seconds * 1000).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {event.eventDescription}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Location: {event.eventLocation}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Price: ${event.eventPrice}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {event.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {events.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" align="center">
              No events found
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default OrganizationEvents; 