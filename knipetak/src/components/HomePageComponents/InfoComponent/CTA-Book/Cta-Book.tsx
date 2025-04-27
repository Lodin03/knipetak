import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./Cta-Book.css";

const CTABook: React.FC = () => {
  const navigate = useNavigate();

  const handleBookClick = () => {
    navigate("/book"); // Navigate to the booking page
  };

  return (
    <div className="cta-container">
      <button
        className="cta-button"
        onClick={handleBookClick}
        aria-label="Book time for massasje"
      >
        <FontAwesomeIcon icon={faCalendarCheck} className="cta-icon" />
        <span className="cta-text">Book Time</span>
      </button>
    </div>
  );
};

export default CTABook;
