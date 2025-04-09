import React from "react";
import { Location as VenueLocation } from "../../../backend/interfaces/Location";
import EventDetails from "../../../backend/interfaces/availabilityInterfaces/EventDetails";
import "./BookingSlotsPerDay.css";

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
  </div>
);

interface LocationSlots {
  location: VenueLocation | null;
  workHours: {
    start: string;
    end: string;
  };
  availableSlots: string[];
}

interface BookingSlotsPerDayProps {
  selectedDate: Date | null;
  isLoading: boolean;
  locationSlots: LocationSlots[];
  eventDetails: EventDetails | null;
  onSlotClick: (time: string, location: VenueLocation | null) => void;
  selectedTime: string | null;
}

const BookingSlotsPerDay: React.FC<BookingSlotsPerDayProps> = ({
  selectedDate,
  isLoading,
  locationSlots,
  eventDetails,
  onSlotClick,
  selectedTime
}) => {
  // Format date to Norwegian format
  const formatDateNorwegian = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLocationDisplay = (location: VenueLocation | null): string => {
    return location?.name || "Ukjent lokasjon";
  };

  if (!selectedDate) {
    return null;
  }

  return (
    <>
      <h3 id="available-timeslots">Tilgjengelige tider for {formatDateNorwegian(selectedDate)}</h3>
      {eventDetails ? (
        <p>
          📅 Helene deltar på <strong>{eventDetails['name'] as string}</strong> på {eventDetails['location'] as string}
        </p>
      ) : isLoading ? (
        <div className="timeslots-loading-container">
          <LoadingSpinner />
        </div>
      ) : locationSlots.length > 0 ? (
        <div className="locations-grid">
          {locationSlots.map((locationSlot, index) => (
            <div key={index} className="location-slots">
              <h4>📍 {handleLocationDisplay(locationSlot.location)}</h4>
              <p className="work-hours">
                Arbeidstid: {locationSlot.workHours.start} - {locationSlot.workHours.end}
              </p>
              <div className="timeslot-grid">
                {locationSlot.availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => onSlotClick(slot, locationSlot.location)}
                    className={`time-slot-button ${selectedTime === slot ? "selected" : ""}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Ingen tilgjengelige tider denne dagen.</p>
      )}
      {selectedTime && <p className="selected-time">Valgt tid: {selectedTime}</p>}
    </>
  );
};

export default BookingSlotsPerDay; 