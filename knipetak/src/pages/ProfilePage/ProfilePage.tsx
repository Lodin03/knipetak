import './ProfilePage.css';
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import { logOut } from '../../backend/firebase/services/firebase.authservice';
import { useNavigate } from 'react-router-dom';
import { getUserBookings } from '../../backend/firebase/services/firebase.bookingservice';
import { BookingData } from '../../backend/interfaces/BookingData';
import { getTreatments } from '../../backend/firebase/services/firebase.treatmentservice';
import { Treatment } from '../../backend/interfaces/Treatment';

const Profile: React.FC = () => {
    const [profileImage, setProfileImage] = useState("src/assets/images/defaultProfileIcon.png");
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bookings, setBookings] = useState<BookingData[]>([]);
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('Current user:', currentUser?.uid);
            setUser(currentUser);
            if (currentUser) {
                try {
                    console.log('Fetching user data...');
                    const [userBookings, treatmentsData] = await Promise.all([
                        getUserBookings(currentUser.uid),
                        getTreatments()
                    ]);
                    console.log('Fetched bookings:', userBookings);
                    console.log('Fetched treatments:', treatmentsData);
                    setBookings(userBookings);
                    setTreatments(treatmentsData);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                console.log('No user logged in');
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
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

    const handleSignOut = async () => {
        try {
            await logOut(); // Log out funksjonen fra firebase.authservice.ts
            navigate('/');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('nb-NO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('nb-NO', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTreatmentName = (treatmentId: string): string => {
        const treatment = treatments.find(t => t.id === treatmentId);
        return treatment?.name || "Ukjent behandling";
    };

    return (
        <>
            <NavigationBar />
            <div className="main-container">
                <div className="profile-container">
                    <div className="profile-sidebar">
                        <div className="profile-header">
                            <div className="profile-image-container">
                                <img 
                                    src={profileImage} 
                                    alt="Profile"  
                                    className="profile-image"
                                />
                                <label className="image-upload-label">
                                    <input 
                                        type="file" 
                                        onChange={handleImageUpload} 
                                        accept="image/*"
                                        className="image-upload-input"
                                    />
                                    <span className="image-upload-icon">📷</span>
                                </label>
                            </div>
                            <h2 className="profile-name">{user?.displayName || "Bruker"}</h2>
                            <p className="profile-email">{user?.email || "Ingen e-post tilgjengelig"}</p>
                        </div>

                        <div className="profile-actions">
                            <button 
                                className={`action-button ${isEditing ? 'active' : ''}`}
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Avbryt' : 'Rediger Profil'}
                            </button>
                            <button className="action-button delete">Slett Profil</button>
                            <button className="action-button logout" onClick={handleSignOut}>
                                Logg ut
                            </button>
                        </div>
                    </div>

                    <div className="profile-content">
                        <div className="profile-section">
                            <h3>Personlig Informasjon</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Kjønn</label>
                                    <p>{isEditing ? <input type="text" /> : "Ikke spesifisert"}</p>
                                </div>
                                <div className="info-item">
                                    <label>Alder</label>
                                    <p>{isEditing ? <input type="number" /> : "Ikke spesifisert"}</p>
                                </div>
                                <div className="info-item">
                                    <label>Adresse</label>
                                    <p>{isEditing ? <input type="text" /> : "Ikke spesifisert"}</p>
                                </div>
                                <div className="info-item">
                                    <label>Helseproblemer</label>
                                    <p>{isEditing ? <textarea /> : "Ingen spesifisert"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="profile-section">
                            <h3>Behandlingshistorikk</h3>
                            <div className="treatment-history">
                                {isLoading ? (
                                    <p>Laster inn behandlinger...</p>
                                ) : bookings.length > 0 ? (
                                    bookings.map((booking, index) => {
                                        console.log('Rendering booking:', booking);
                                        const treatmentName = getTreatmentName(booking.treatmentId);
                                        console.log('Treatment name:', treatmentName);
                                        return (
                                            <div key={index} className="treatment-item">
                                                <div className="treatment-info">
                                                    <h4>{treatmentName}</h4>
                                                    <p>{formatDate(booking.date)} ({formatTime(booking.timeslot.start)} - {formatTime(booking.timeslot.end)})</p>
                                                    <p>Varighet: {booking.duration} minutter</p>
                                                    <p>Sted: {booking.location.address}, {booking.location.postalCode} {booking.location.city}</p>
                                                    <p>Pris: {booking.price} kr</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p>Ingen behandlinger funnet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Profile;
