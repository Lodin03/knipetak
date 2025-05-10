import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-solid-svg-icons";
import "./HeroHomePage.css";

const HeroHomePage: React.FC = () => {
  return (
    <div className="hero-container">
      <div className="hero-background" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-text-container">
          <h1 className="hero-title">Knipetak - En muskelterapaut på hjul!</h1>
          <div className="hero-divider" />
          <p className="hero-subtitle">
            Profesjonell muskelterapi der du er - hjemme eller på jobb
          </p>
          <Link to="/book" className="hero-button">
            <FontAwesomeIcon icon={faCalendarCheck} className="hero-icon" />
            Book Time
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroHomePage;
