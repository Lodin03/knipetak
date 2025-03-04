import { Link } from 'react-router-dom';
import './NavigationBar.css';
import logo from '../../assets/images/logo.png';

function NavigationBar() {
    return (
        <div className="navBar">
            <img src={logo} alt="LOGO" className="logo" />
            <div className="navLinks">
                <Link to="/">Hjem</Link>
                <Link to="/behandlinger">Behandlinger</Link>
                <Link to="/book">Book Time</Link>
                <Link to="/kontakt">Kontakt</Link>
                <Link to="/login">Logg inn</Link>
            </div>
        </div>
    );
}

export default NavigationBar; 