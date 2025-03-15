import React from "react";
import BookingCalendar from "../../components/BookingCalendar/BookingCalendar";
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import "./BookPage.css";

const BookPage: React.FC = () => {
  return (
    <>
    <NavigationBar />
    <div className="book-page">
      <h1>Book en time</h1>
      <BookingCalendar />
    </div>
    <Footer />
    </>
  );
};

export default BookPage;