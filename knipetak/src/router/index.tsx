import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage/HomePage.tsx";
import TreatmentsPage from "../pages/TreatmentsPage/TreatmentsPage.tsx";
import BookPage from "../pages/BookPage/BookPage.tsx";
import ContactPage from "../pages/ContactPage/ContactPage.tsx";
import LoginPage from "../pages/LoginPage/LoginPage.tsx";
import ProfilePage from "../pages/ProfilePage/ProfilePage.tsx";
import AdminHomePage from "../pages/AdminHomePage/AdminHomePage.tsx";
import AdminCalenderPage from "../pages/AdminCalenderPage/AdminCalenderPage.tsx";

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/behandlinger" element={<TreatmentsPage />} />
      <Route path="/book" element={<BookPage />} />    
      <Route path="/kontakt" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/AdminHomePage" element={<AdminHomePage />} />
      <Route path="/AdminCalenderPage" element={<AdminCalenderPage />} />
    </Routes>
  </BrowserRouter>
);
  
export default AppRoutes;