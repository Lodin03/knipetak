import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage/HomePage.tsx";
import LoginPage from "../pages/LoginPage/LoginPage.tsx";
import ProfilePage from "../pages/ProfilePage/ProfilePage.tsx";
import AdminHomePage from "../pages/AdminHomePage/AdminHomePage.tsx";
import AdminCalenderPage from "../pages/AdminCalenderPage/AdminCalenderPage.tsx";

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/AdminHomePage" element={<AdminHomePage />} />
      <Route path="/AdminCalenderPage" element={<AdminCalenderPage />} />
    </Routes>
  </BrowserRouter>
);
  
export default AppRoutes;