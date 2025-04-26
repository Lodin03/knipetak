import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage/HomePage.tsx";
import TreatmentsPage from "../pages/TreatmentsPage/TreatmentsPage.tsx";
import BookPage from "../pages/BookPage/BookPage.tsx";
import ContactPage from "../pages/ContactPage/ContactPage.tsx";
import LoginPage from "../pages/LoginPage/LoginPage.tsx";
import ProfilePage from "../pages/ProfilePage/ProfilePage.tsx";
import AdminHomePage from "../pages/AdminHomePage/AdminHomePage.tsx";
import AdminCalendarPage from "../pages/AdminCalendarPage/AdminCalendarPage.tsx";
import NavigationBar from "../components/NavigationBar/NavigationBar.tsx";
import Footer from "../components/Footer/Footer.tsx";

const AppRoutes = () => (
  <BrowserRouter>
    <NavigationBar />

    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/behandlinger" element={<TreatmentsPage />} />
      <Route path="/book" element={<BookPage />} />    
      <Route path="/kontakt" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/admin-home-page" element={<AdminHomePage />} />
      <Route path="/admin-calendar-page" element={<AdminCalendarPage />} />
    </Routes>

    <Footer />
  </BrowserRouter>
);

export default AppRoutes;
