import { useEffect, useState } from "react";
import { fetchUsers, UserData } from "../../backend/firebase/services/firebase.service.ts";
import "./HomePage.css";
import logo from "../../assets/images/logo.png";

function HomePage() {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        <h1 className="title">Knipetak - En muskelterapeut på hjul!</h1>

        <div className="firestore">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : data.length ? (
            <div>
              <h3>Fetched Data fra Firestore:</h3>
              {data.map((item) => (
                <div key={item.id}>
                  <p>Id: {item.id} (Bruker dokument ID som id)</p>
                  <p>Alder: {item.age}</p>
                  <p>Lokasjon: {item.location}</p>
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

      <div className="footer">
        <p>post@knipetak.no</p>
      </div>
    </>
  );
}

export default HomePage;
