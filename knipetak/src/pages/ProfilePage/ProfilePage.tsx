import './ProfilePage.css';
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import { logOut } from '../../backend/firebase/services/firebase.authservice';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const [profileImage, setProfileImage] = useState("src/assets/images/defaultProfileIcon.png");
    const [user, setUser] = useState<User | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe(); // Cleanup listener
    }, []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    

    const navigate = useNavigate();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setCurrentUser(currentUser?.email || null);
        });

        return () => unsubscribe(); // Cleanup listener
    }, []);

    const handleSignOut = async () => {
        try {
            await logOut();
            setCurrentUser(null);
            navigate('/');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <>
        <NavigationBar />
        <div className="profile">
            <div>
                <div>
                    <img 
                        src={profileImage} 
                        alt="Profile"  
                    />
                    {currentUser && (
                        <div className="user-info">
                            <p>Innlogget bruker: {currentUser}</p>
                        </div>
                        )
                    }
                </div>
                <input type="file" onChange={handleImageUpload} />
                <div>
                    <button>Rediger Profil</button>
                    <button>Slett Profil</button>
                    <button className="logout-button" onClick={handleSignOut}>Logg ut</button>
                </div>
                <div className='profileInfo'>
                    <h2>{user?.displayName || "Bruker"}</h2>
                    <p>Email: {user?.email || "Ingen e-post tilgjengelig"}</p>
                    <p>Gender</p>
                    <p>Age</p>
                    <p>Location</p>
                    <p>Health Issues</p>
                </div>
            </div>
            <div className='orders'>
                <h2 className='textProfile'>Behandlinger</h2>
                <p>Behandling 1, Dato, Pris</p>
                <p>Behandling 2, Dato, Pris</p>
                <p>Behandling 3, Dato, Pris</p>
                <p>Behandling 4, Dato, Pris</p>
                <p>Behandling 5, Dato, Pris</p>
                <p>Behandling 6, Dato, Pris</p>
                <p>Behandling 7, Dato, Pris</p>
                <p>Behandling 8, Dato, Pris</p>
                <p>Behandling 9, Dato, Pris</p>
            </div>
        </div>
        <Footer />
        </>
    );
};

export default Profile;
