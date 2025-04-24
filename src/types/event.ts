export interface Comments {
  uid: string;
  eventId: string;
  comment: string;
  replies: string[];
  userName: string;
  userEmail?: string;
  timestamp?: any;
}

export interface Event {
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
  isLiked?: boolean;
  isInterested?: boolean;
  comments?: Comments[];
} 