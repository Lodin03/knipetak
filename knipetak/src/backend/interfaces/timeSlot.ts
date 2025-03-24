/**
 * Representerer et tidsluke for en tjeneste
 */
interface TimeSlot {
  start: Date;
  end: Date;
  location: string; // VenueLocation ID
}

export default TimeSlot;
