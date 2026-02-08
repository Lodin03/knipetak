import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import CTAButton from "@/components/CTAButton/CTAButton";
import "./EventBooking.css";

const EventBooking: React.FC = () => {
  return (
    <div className="home-event-section">
      <div className="event-content">
        <div className="event-info">
          <h2>Gruppebookinger & Spesielle Eventer</h2>

          <div className="booking-type">
            <FontAwesomeIcon icon={faUsers} className="booking-icon" />
            <p>
              Gruppebookinger kan gjøres som vanlige bookinger på booking siden
              vår. Dersom det ønskes å bestilles for noe mer eller til spesielle
              eventer, kan dere kontakte meg her:
            </p>
            <CTAButton to="/kontakt" icon={faEnvelope}>
              Kontakt Helene
            </CTAButton>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EventBooking;
