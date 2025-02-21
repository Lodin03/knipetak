import "./App.css";
import logo from "./assets/images/logo.png";

function App() {
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

      // Testing
      <div className="mainContent">
        <h1 className="title">Knipetak - En muskelterapaut på hjul!</h1>
      </div>

      <div className="footer">
        <p>post@knipetak.no</p>
      </div>
    </>
  );
}

export default App;
