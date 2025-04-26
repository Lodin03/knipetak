import { useEffect, useState } from "react";
import { fetchUsers } from "../../backend/firebase/services/firebase.userservice";
import { UserData } from "../../backend/interfaces/UserData";
import {
  onAuthStateChanged,
  auth,
} from "../../backend/firebase/services/firebase.authservice";
import NavigationBar from "../../components/NavigationBar/NavigationBar";
import Footer from "../../components/Footer/Footer";
import "./AdminHomePage.css";
import { AdminAvailabilityManager } from "../../components/AdminAvailabilityManager/AdminAvailabilityManager";
import HandleBookings from "../../components/AdminBookingInterface/HandleBookings";

type AdminSection = "availability" | "bookings" | null;

function AdminHomePage() {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [expandedSection, setExpandedSection] = useState<AdminSection>(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const users = await fetchUsers();
        setData(users);
      } catch (err) {
        setError("Kunne ikke laste data. Vennligst prøv igjen.");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = data.find((u) => u.uid === user.uid) || null;
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [data]);

  const handleSectionToggle = (section: AdminSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) return <div className="loading">Laster...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <NavigationBar />
      <div className="admin-content">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-sections">
          <div className="section-button-group">
            <button
              className={`section-button ${
                expandedSection === "availability" ? "active" : ""
              }`}
              onClick={() => handleSectionToggle("availability")}
            >
              <div className="button-content">
                <span className="button-title">Tilgjengelighet</span>
                <span className="button-description">
                  Administrer arbeidstider og overstyr tidspunkter
                </span>
              </div>
              <span className="expand-icon">
                {expandedSection === "availability" ? "−" : "+"}
              </span>
            </button>

            <button
              className={`section-button ${
                expandedSection === "bookings" ? "active" : ""
              }`}
              onClick={() => handleSectionToggle("bookings")}
            >
              <div className="button-content">
                <span className="button-title">Behandlinger</span>
                <span className="button-description">
                  Administrer aktive og tidligere behandlinger
                </span>
              </div>
              <span className="expand-icon">
                {expandedSection === "bookings" ? "−" : "+"}
              </span>
            </button>
          </div>

          <div className="section-content">
            {expandedSection === "availability" && (
              <div className="expanded-section">
                <AdminAvailabilityManager />
              </div>
            )}

            {expandedSection === "bookings" && (
              <div className="expanded-section">
                <HandleBookings isExpanded={expandedSection === "bookings"} />
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AdminHomePage;
