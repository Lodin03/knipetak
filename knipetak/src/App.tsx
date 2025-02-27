import { useEffect, useState } from 'react';
import app from  "./backend/firebase/firebase.ts" // Ensure the correct path
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import "./App.css";
import logo from "./assets/images/logo.png";

function App() {
   // State to store Firestore data
   const [data, setData] = useState<any[]>([]); // Using any[] for flexibility

   const db = getFirestore(app); // Get Firestore instance

   useEffect(() => {
    // Function to fetch data from Firestore
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users')); // Replace with your collection name
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(docs); // Save data to state
      } catch (error) {
        console.error('Error fetching Firestore data:', error);
      }
    };

    fetchData(); // Call the function to fetch data when component mounts
  }, []);

  return (
    <>
      <div className="navBar">
        <img src={logo} alt="LOGO" className="logo" />
        <div className="navLinks">
          <p>Hjem</p>
          <p>Behandlinger</p>
          <p>Book Time</p>
          <p>Kontakt</p>
        </div>
      </div>

      <div className="mainContent">
        <h1 className="title">Knipetak - En muskelterapaut på hjul!</h1>

        {/* Just testing to see if Firebase data is loading. Just using dummy data right now*/}
        <div>
        <h1>Firebase Data</h1>
        {data.length ? (
          <div>
            <h2>Fetched Data from Firestore:</h2>
            {data.map((item) => (
              <div key={item.id}>
                <p>Age: {item.age}</p>
                <p>Location: {item.location}</p>
                <p>Health Issues: {item.healthIssues}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No data found or loading...</p>
        )}
      </div>
      </div>

      <div className="footer">
        <p>post@knipetak.no</p>
      </div>
    </>
  );
}

export default App;
