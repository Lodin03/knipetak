import { useEffect, useState } from "react";
import { fetchUsers } from "../../backend/firebase/services/firebase.userservice";
import { UserData } from "../../backend/interfaces/UserData";
import { onAuthStateChanged, auth } from "../../backend/firebase/services/firebase.authservice";
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import './AdminHomePage.css';

function AdminHomePage() {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

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
        const userData = data.find(u => u.uid === user.uid) || null;
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [data]);

  if (loading) return <div className="loading">Laster...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <NavigationBar />
      <div className="admin-content">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-info">
          <h2>Brukerinformasjon</h2>
          <p>Innlogget som: {currentUser?.displayName || 'Ikke innlogget'}</p>
          <p>E-post: {currentUser?.email || 'Ingen e-post'}</p>
          
          {currentUser?.bookings && currentUser.bookings.length > 0 && (
            <div className="bookings-section">
              <h3>Bokinger</h3>
              {currentUser.bookings.map((booking) => (
                <div key={booking.bookingId} className="booking-item">
                  <p>Tjeneste: {booking.service}</p>
                  <p>Dato: {new Date(booking.date).toLocaleDateString('nb-NO')}</p>
                  <p>Status: {booking.status || 'Ikke definert'}</p>
                  {booking.price && <p>Pris: {booking.price} kr</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AdminHomePage;
