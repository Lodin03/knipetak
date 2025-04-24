import { useEffect, useState } from "react";
import { fetchUsers } from "../../backend/firebase/services/firebase.userservice";
import { UserData } from "../../backend/interfaces/UserData";
import { onAuthStateChanged, auth } from "../../backend/firebase/services/firebase.authservice";
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import './AdminHomePage.css'; 
import { AdminAvailabilityManager } from "../../components/AdminAvailabilityManager/AdminAvailabilityManager";

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
        <AdminAvailabilityManager />
      </div>
      <Footer />
    </>
  );
}

export default AdminHomePage;
