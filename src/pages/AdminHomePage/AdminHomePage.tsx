import { useEffect, useState } from "react";
import { fetchUsers, UserData} from "../../backend/firebase/services/firebase.userservice";
import { onAuthStateChanged, auth } from "../../backend/firebase/services/firebase.authservice";
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import './AdminHomePage.css';

function HomePage() {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Effect hook to fetch user data from Firestore when component mounts
  useEffect(() => {
    const getData = async () => {
      try {
        const users = await fetchUsers();
        setData(users);
      } catch (err) {
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  // Effect hook to get and set the current user's display name from Firebase Auth
  useEffect(() => {
    // Subscribe to auth state changes to get the current user's display name
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) {
        setCurrentUser(user.displayName);
      } else {
        setCurrentUser(null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <>
      <NavigationBar />
      <div className="mainContent">
        <h1 className="title">Knipetak - En muskelterapeut på hjul!</h1>
    
      </div>
      <Footer />
    </>
  );
}

export default HomePage;
