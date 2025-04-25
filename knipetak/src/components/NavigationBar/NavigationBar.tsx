import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getUserData } from '../../backend/firebase/services/firebase.userservice'; // Import Firestore function
import { UserType } from '../../backend/interfaces/UserData'; // Import UserType enum
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
                    if (userData) {
                        setUserType(userData.userType);
                    } else {
                        console.error("User data is null");
                    }
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
          <Link className='button-logo' to={userType === UserType.ADMIN ?  "/admin-home-page" : "/"}>
            <img src={logo} alt="LOGO" className="logo" />
          </Link>
      
          <div className="navLinks">
            <Link to={userType === UserType.ADMIN ? "/admin-home-page" : "/"}>
              {userType === UserType.ADMIN ? "Admin Hjem" : "Hjem"}
            </Link>
            <Link to={userType === UserType.ADMIN ? "/admin-calendar-page" : "/book"}>
              {userType === UserType.ADMIN ? "Admin Kalender" : "Book Time"}
            </Link>
            <Link to="/behandlinger">Behandlinger</Link>
            <Link to="/kontakt">Kontakt</Link>
            {user && <Link to="/profile">Profil</Link>}
            {!user && <Link to="/login">Logg inn</Link>}
          </div>
        </div>
      );
    }   

export default NavigationBar;
