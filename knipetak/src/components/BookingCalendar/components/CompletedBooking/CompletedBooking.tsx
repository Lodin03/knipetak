import React from "react";
import { Treatment } from "../../../../backend/interfaces/Treatment";
import { Location as BookingLocation } from "../../../../backend/interfaces/Location";
import "./CompletedBooking.css";

interface CompletedBookingProps {
  bookingId: string;
  date: Date;
  time: string;
  treatment: Treatment;
  duration: number;
  isGroup: boolean;
  groupSize?: number;
  location: BookingLocation;
  onClose: () => void;
}

const CompletedBooking: React.FC<CompletedBookingProps> = ({
  bookingId,
  date,
  time,
  treatment,
  duration,
  isGroup,
  groupSize,
  location,
  onClose,
}) => {
  return (
    <div className="completed-booking-modal">
      <div className="completed-booking-content">
        <h3>Booking Bekreftet! 🎉</h3>
        <p className="booking-id">Booking ID: {bookingId}</p>

        <div className="booking-details">
          <h4>Detaljer for din booking:</h4>
          <p>
            <strong>Dato:</strong>{" "}
            {date.toLocaleDateString("nb-NO", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p>
            <strong>Tid:</strong> {time}
          </p>
          <p>
            <strong>Behandling:</strong> {treatment.name}
          </p>
          {isGroup ? (
            <>
              <p>
                <strong>Gruppestørrelse:</strong> {groupSize} personer
              </p>
              <p>
                <strong>Total varighet:</strong> {duration} minutter
              </p>
            </>
          ) : (
            <p>
              <strong>Varighet:</strong> {duration} minutter
            </p>
          )}

          <div className="location-details">
            <h4>Sted:</h4>
            <p>{location.address}</p>
            <p>
              {location.postalCode} {location.city}
            </p>
          </div>
        </div>

        <button className="close-button" onClick={onClose}>
          Lukk
        </button>
      </div>
    </div>
  );
};

export default CompletedBooking;
