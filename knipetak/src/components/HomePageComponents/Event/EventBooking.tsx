import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import HomeScreenSlider from "../HomeScreenSlider/HomeScreenSlider";
import "./EventBooking.css";

const EventBooking: React.FC = () => {
  const navigate = useNavigate();

  const handleContactClick = () => {
    navigate("/kontakt");
  };

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
            <button
              className="action-button contact-button"
              onClick={handleContactClick}
              aria-label="Gå til kontakt"
            >
              Kontakt Helene
            </button>
          </div>
        </div>

        <div className="event-slider">
          <HomeScreenSlider />
        </div>
      </div>
    </div>
  );
};

export default EventBooking;
