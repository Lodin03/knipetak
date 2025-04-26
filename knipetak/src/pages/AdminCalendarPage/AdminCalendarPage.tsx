import React from "react";
import NavigationBar from "../../components/NavigationBar/NavigationBar";
import Footer from "../../components/Footer/Footer";
import AdminGoogleCalendar from "../../components/AdminGoogleCalendar/AdminGoogleCalendar";
import "./AdminCalendarPage.css";

const AdminCalendarPage: React.FC = () => {
  return (
    <>
      <NavigationBar />
      <div className="calendar-container">
        <h1 className="calendar-title">Google Kalender Oversikt</h1>
        <div className="calendar-section">
          <AdminGoogleCalendar />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminCalendarPage;
