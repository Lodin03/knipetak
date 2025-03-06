import React, { useState, useEffect } from "react";
import { getAvailableSlotsByDate } from "../../backend/firebase/services/firebase.availabilityservice";
import "./BookingCalendar.css";
import TimeSlot from "../../backend/interfaces/timeSlot";

interface EventDetails {
  name: string;
  location: string;
}

const BookingCalendar: React.FC = () => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      console.log(`📅 Fetching slots for ${selectedDate}`);
      try {
        const data = await getAvailableSlotsByDate(selectedDate);

        if (data) {
          // Format the available slots into TimeSlot interface objects.
          const formattedSlots: TimeSlot[] = data.availableSlots.map((slot: string) => ({
            start: slot,
            end: "" // Update if you have logic for an end time
          }));

          setAvailableSlots(formattedSlots);
          setLocation(data.location || "Unknown");

          // If event details exist, map them into the EventDetails type.
          if (data.eventDetails) {
            setEventDetails({
              name: (data.eventDetails as { name?: string }).name || "Unknown Event",
              location: (data.eventDetails as { location?: string }).location || "Unknown Location",
            });
          } else {
            setEventDetails(null);
          }
        } else {
          console.warn(`⚠️ No data found for ${selectedDate}`);
          setAvailableSlots([]);
          setLocation(null);
          setEventDetails(null);
        }
      } catch (error) {
        console.error(`❌ Error fetching availability for ${selectedDate}:`, error);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  return (
    <div className="booking-calendar">
      <h2>Select a Date</h2>
      <input
        type="date"
        onChange={(e) => {
          setSelectedDate(e.target.value);
          setSelectedTime(null); // Reset selected time when date changes
        }}
      />

      {selectedDate && (
        <>
          <h3>Available Times for {selectedDate}</h3>
          {eventDetails ? (
            <p>
              📅 Helene is attending <strong>{eventDetails.name}</strong> at {eventDetails.location}
            </p>
          ) : (
            <p>📍 Location: {location || "Not Available"}</p>
          )}
          <div className="timeslot-grid">
            {availableSlots.length > 0 ? (
              availableSlots.map((slot) => (
                <button key={slot.start} onClick={() => setSelectedTime(slot.start)}>
                  {slot.start} - {slot.end || "N/A"}
                </button>
              ))
            ) : (
              <p>No available slots.</p>
            )}
          </div>
          {selectedTime && <p className="selected-time">Selected time: {selectedTime}</p>}
        </>
      )}
    </div>
  );
};

export default BookingCalendar;