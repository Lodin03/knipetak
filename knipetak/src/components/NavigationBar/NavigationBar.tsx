import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getUserData } from '../../backend/firebase/services/firebase.userservice'; // Import Firestore function
import { UserType } from '../../backend/firebase/services/firebase.userservice'; // Import UserType enum
import './NavigationBar.css';
import logo from '../../assets/images/logo.png';

function NavigationBar() {
    const [user, setUser] = useState<User | null>(null);
    const [userType, setUserType] = useState<UserType | null>(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userData = await getUserData(currentUser.uid); // Fetch user type
                    setUserType(userData.userType);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUserType(null);
            }
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

    return (
        <div className="navBar">
            <Link to={userType === UserType.ADMIN ? "/AdminHomePage" : "/"}><img src={logo} alt="LOGO" className="logo" /></Link>
            <div className="navLinks">
                <Link to={userType === UserType.ADMIN ? "/AdminHomePage" : "/"}>{userType === UserType.ADMIN ? "Admin Hjem" : "Hjem"}</Link>
                <Link to={userType === UserType.ADMIN ? "/AdminCalenderPage" : "/book"}>{userType === UserType.ADMIN ? "Admin Kalender" : "Book Time"}</Link>
                <Link to="/Behandlinger">Behandlinger</Link>
                <Link to="/kontakt">Kontakt</Link>
                {user && <Link to="/profile">Profil</Link>} {/* ✅ Show only if user is logged in */}
                {!user && <Link to="/login">Logg inn</Link>}
            </div>
        </div>
    );
}

export default NavigationBar;
