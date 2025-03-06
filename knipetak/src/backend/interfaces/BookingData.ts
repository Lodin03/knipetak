export interface BookingData {
  customerId: string; // ID of the user making the booking
  date: Date; // Appointment date
  duration: number; // Total booking duration (in minutes)
  location: string; // e.g. "Haukeland"
  address: string; // Appointment address
  paymentStatus: string; // e.g. "pending" or "paid"
  price: number; // e.g. 1550
  status: string; // e.g. "pending"
  timeslot: {
    start: Date;
    end: Date;
  };
  treatmentId: string; // e.g. "deep_tissue"
}

export default BookingData;
