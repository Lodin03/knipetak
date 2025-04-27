import React from "react";
import HeroHomePage from "../../components/HomePageComponents/HeroHomePage/HeroHomePage";
import InfoComponent from "../../components/HomePageComponents/InfoComponent/InfoComponent";
import RatingsComponent from "../../components/HomePageComponents/RatingsComponent/RatingsComponent";
import "../HomePage/HomePage.css";
import EventBooking from "@/components/HomePageComponents/Event/EventBooking";

const HomePage: React.FC = () => {
  return (
    <>
      <HeroHomePage />
      <div className="mainContentHomepage">
        <InfoComponent />
        <EventBooking />
        <RatingsComponent />
      </div>
    </>
  );
};

export default HomePage;
