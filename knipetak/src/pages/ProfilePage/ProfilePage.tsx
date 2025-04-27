import "./ProfilePage.css";
import React, { useState, useEffect } from "react";
import {
  getUserData,
  updateUserProfile,
} from "../../backend/firebase/services/firebase.userservice";
import { useNavigate } from "react-router-dom";
import { getUserBookings } from "../../backend/firebase/services/firebase.bookingservice";
import { BookingData } from "../../backend/interfaces/BookingData";
import { getTreatments } from "../../backend/firebase/services/firebase.treatmentservice";
import { Treatment } from "../../backend/interfaces/Treatment";
import { Gender, UserData } from "../../backend/interfaces/UserData";
import { useAuth } from "@/context/AuthContext";

const Profile: React.FC = () => {
  // Use AuthContext instead of managing our own user state
  const { user, signOut: authSignOut, isLoading: authLoading } = useAuth();
  const [profileImage, setProfileImage] = useState(
    "src/assets/images/defaultProfileIcon.png"
  );
  const [, setUserData] = useState<Partial<UserData> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [gender, setGender] = useState<Gender | "">("");
  const [age, setAge] = useState<number | "">("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [postalCode, setPostalCode] = useState<number | null>(null);
  const [healthIssues, setHealthIssues] = useState<string>("");
  const [addressError, setAddressError] = useState<string>("");
  const [ageError, setAgeError] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const [userDataResult, userBookings, treatmentsData] =
            await Promise.all([
              getUserData(user.uid),
              getUserBookings(user.uid),
              getTreatments(),
            ]);

          if (userDataResult) {
            setUserData(userDataResult);
            setGender(userDataResult.gender || "");
            setAge(userDataResult.age || "");
            setHealthIssues(userDataResult.healthIssues || "");
            setPhoneNumber(userDataResult.phoneNumber || "");
            if (userDataResult.location) {
              setAddress(userDataResult.location.address || "");
              setCity(userDataResult.location.city || "");
              setPostalCode(userDataResult.location.postalCode || null);
            }
          }

          setBookings(userBookings);
          setTreatments(treatmentsData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]); // Only depend on user from AuthContext

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
      await authSignOut(); // Use the signOut from AuthContext
      navigate("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTreatmentName = (treatmentId: string): string => {
    const treatment = treatments.find((t) => t.id === treatmentId);
    return treatment?.name || "Ukjent behandling";
  };

  // Valideringsfunksjoner
  const validateAge = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setAgeError("Alder må være et tall");
      return false;
    }
    if (numValue < 0 || numValue > 120) {
      setAgeError("Alder må være mellom 0 og 120 år");
      return false;
    }
    if (!Number.isInteger(numValue)) {
      setAgeError("Alder må være et helt tall");
      return false;
    }
    setAgeError("");
    return true;
  };

  const validateAddress = (value: string) => {
    // Norsk adresseformat: Gatenavn nummer, f.eks. "Kongens gate 1" eller "Slottsplassen 1"
    const addressRegex = /^[a-zA-ZæøåÆØÅ\s]+ \d+$/;
    if (!addressRegex.test(value)) {
      setAddressError("Ugyldig adresse. Må være på format: Gatenavn nummer");
      return false;
    }
    setAddressError("");
    return true;
  };

  const validatePhoneNumber = (value: string) => {
    // Norsk telefonnummerformat: 8 siffer, kan starte med +47 eller 0047
    const phoneRegex = /^(\+47|0047)?\s*[2-9]\d{7}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ""))) {
      setPhoneError(
        "Ugyldig telefonnummer. Må være 8 siffer og kan starte med +47"
      );
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleSave = async () => {
    if (!user) return;

    const isAgeValid = age === "" || validateAge(age.toString());
    const isAddressValid = address === "" || validateAddress(address);
    const isPhoneValid = phoneNumber === "" || validatePhoneNumber(phoneNumber);

    if (!isAgeValid || !isAddressValid || !isPhoneValid) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedData: Partial<UserData> = {
        gender: gender || undefined,
        age: age === "" ? undefined : Number(age),
        healthIssues: healthIssues || undefined,
        phoneNumber: phoneNumber || undefined,
        location: address
          ? {
              id: "default-id", // Replace with a proper id if available
              name: "default-name", // Replace with a proper name if available
              address,
              city,
              postalCode: postalCode || 0,
            }
          : undefined,
      };

      await updateUserProfile(user.uid, updatedData);
      setUserData((prev) => ({ ...prev, ...updatedData }));
      setIsEditing(false);
    } catch (error) {
      console.error("Feil ved lagring av profil:", error);
      alert(
        "Det oppsto en feil ved lagring av profilen. Vennligst prøv igjen."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
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
              <p className="profile-email">
                {user?.email || "Ingen e-post tilgjengelig"}
              </p>
            </div>

            <div className="profile-actions">
              <button
                className={`action-button ${isEditing ? "active" : ""}`}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Avbryt" : "Rediger Profil"}
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
              {isLoading ? (
                <p>Laster inn brukerdata...</p>
              ) : (
                <div className="info-grid">
                  <div className="info-item">
                    <label>Kjønn</label>
                    <p>
                      {isEditing ? (
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as Gender)}
                          className="form-select"
                        >
                          <option value="">Velg kjønn</option>
                          {Object.values(Gender).map((genderOption) => (
                            <option key={genderOption} value={genderOption}>
                              {genderOption}
                            </option>
                          ))}
                        </select>
                      ) : (
                        gender || "Ikke spesifisert"
                      )}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Alder</label>
                    <p>
                      {isEditing ? (
                        <div className="input-with-error">
                          <input
                            type="number"
                            value={age}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAge(value === "" ? "" : parseInt(value));
                              validateAge(value);
                            }}
                            min="0"
                            max="120"
                            step="1"
                          />
                          {ageError && (
                            <span className="error-message">{ageError}</span>
                          )}
                        </div>
                      ) : (
                        age || "Ikke spesifisert"
                      )}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Adresse</label>
                    <p>
                      {isEditing ? (
                        <div className="input-with-error">
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAddress(value);
                              validateAddress(value);
                            }}
                            placeholder="F.eks: Kongens gate 1"
                          />
                          {addressError && (
                            <span className="error-message">
                              {addressError}
                            </span>
                          )}
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="By"
                            className="mt-2"
                          />
                          <input
                            type="number"
                            value={postalCode || ""}
                            onChange={(e) =>
                              setPostalCode(
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            placeholder="Postnummer"
                            className="mt-2"
                          />
                        </div>
                      ) : address ? (
                        `${address}, ${postalCode} ${city}`
                      ) : (
                        "Ikke spesifisert"
                      )}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Telefonnummer</label>
                    <p>
                      {isEditing ? (
                        <div className="input-with-error">
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => {
                              const value = e.target.value;
                              setPhoneNumber(value);
                              validatePhoneNumber(value);
                            }}
                            placeholder="F.eks: +47 12345678"
                          />
                          {phoneError && (
                            <span className="error-message">{phoneError}</span>
                          )}
                        </div>
                      ) : (
                        phoneNumber || "Ikke spesifisert"
                      )}
                    </p>
                  </div>
                  <div className="info-item full-width">
                    <label>Helseproblemer</label>
                    <p>
                      {isEditing ? (
                        <textarea
                          value={healthIssues}
                          onChange={(e) => setHealthIssues(e.target.value)}
                          placeholder="Beskriv eventuelle helseproblemer her..."
                        />
                      ) : (
                        healthIssues || "Ingen spesifisert"
                      )}
                    </p>
                  </div>
                </div>
              )}
              <div className="save-button-container">
                {isEditing && (
                  <button
                    className="action-button save"
                    onClick={handleSave}
                    disabled={
                      !!ageError || !!addressError || !!phoneError || isSaving
                    }
                  >
                    {isSaving ? "Lagrer..." : "Lagre endringer"}
                  </button>
                )}
              </div>
            </div>

            <div className="profile-section">
              <h3>Behandlingshistorikk</h3>
              <div className="treatment-history">
                {isLoading ? (
                  <p>Laster inn behandlinger...</p>
                ) : bookings.length > 0 ? (
                  bookings.map((booking, index) => {
                    console.log("Rendering booking:", booking);
                    const treatmentName = getTreatmentName(booking.treatmentId);
                    console.log("Treatment name:", treatmentName);
                    return (
                      <div key={index} className="treatment-item">
                        <div className="treatment-info">
                          <h4>{treatmentName}</h4>
                          <p>
                            {formatDate(booking.date)} (
                            {formatTime(booking.timeslot.start)} -{" "}
                            {formatTime(booking.timeslot.end)})
                          </p>
                          <p>Varighet: {booking.duration} minutter</p>
                          <p>
                            Sted: {booking.location.address},{" "}
                            {booking.location.postalCode}{" "}
                            {booking.location.city}
                          </p>
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
    </>
  );
};

export default Profile;
