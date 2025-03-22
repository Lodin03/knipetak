import React from "react";
import BookingCalendar from "../../components/BookingCalendar/BookingCalendar";
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import "./BookPage.css";
import { AdminAvailabilityManager } from "../../components/AdminAvailabilityManager/AdminAvailabilityManager";

const BookPage: React.FC = () => {
  return (
    <>
    <NavigationBar />
    <div className="book-page">
      <h1>Book en time</h1>
        <BookingCalendar />
        <AdminAvailabilityManager />
    </div>
    <Footer />
    </>
  );
};

export default BookPage;