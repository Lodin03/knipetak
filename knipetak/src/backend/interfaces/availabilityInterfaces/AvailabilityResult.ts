import EventDetails from "./EventDetails";

// This is what we return when asking for available time slots on a specific day

interface LocationAvailability {
  location: string;
  availableSlots: string[];
  workHours: {
    start: string;
    end: string;
  };
}

export default interface AvailabilityResult {
  availabilityByLocation: LocationAvailability[];
  eventDetails: EventDetails | null;
}
