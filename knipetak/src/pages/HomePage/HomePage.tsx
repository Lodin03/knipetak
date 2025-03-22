import { useEffect, useState } from "react";
import { fetchUsers } from "../../backend/firebase/services/firebase.userservice";
import { UserData } from "../../backend/interfaces/UserData";
import { onAuthStateChanged, auth, logOut } from "../../backend/firebase/services/firebase.authservice";
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import './HomePage.css';

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

   // Function to handle sign out
   const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
   };

const HomePage: React.FC = () => {
  return (
    <>
      <NavigationBar />
      <div className="mainContent">
        <h1 className="title">Knipetak - En muskelterapeut på hjul!</h1>
        
        {currentUser && (
          <div className="user-info">
            <p>Innlogget bruker: {currentUser}</p>
            <button className="logout-button" onClick={handleSignOut}>Logg ut</button>
          </div>
        )}

        <div className="firestore">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : data.length ? (
            <div>
              <h3>Fetched Data fra Firestore:</h3>
              {data.map((item) => (
                <div key={item.uid}>
                  <p>Id: {item.uid}</p>
                  <p>Email: {item.email}</p>
                  <p>Alder: {item.age}</p>
                  <p>Navn: {item.displayName}</p>
                  <p>Addresse: {item.location?.address}</p>
                  <p>Helseproblemer: {item.healthIssues}</p>
                  <p>Telefonnummer: {item.phoneNumber}</p>
                  <p>Bruker type: {item.userType}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No data found.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HomePage;
