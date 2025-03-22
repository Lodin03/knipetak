// Defines working hours for a day

interface TimeSlot {
  start: string;
  end: string;
  location: string;
}

interface WorkHours {
  timeSlots: TimeSlot[];
}

interface WorkHoursWithLocation {
  timeSlots: TimeSlot[];
}

export default WorkHours;
export type { WorkHoursWithLocation, TimeSlot };
