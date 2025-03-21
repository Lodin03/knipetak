import React, { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { nb } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { getAvailableSlotsByDate } from "../../backend/firebase/services/firebase.availabilityservice";
import { createBooking } from "../../backend/firebase/services/firebase.bookingservice";
import { getTreatments} from "../../backend/firebase/services/firebase.treatmentservice";
import { BookingData } from "../../backend/interfaces/BookingData";
import "./BookingCalendar.css";
import TimeSlot from "../../backend/interfaces/timeSlot";
import EventDetails from "../../backend/interfaces/EventDetails";
import { Treatment } from "../../backend/interfaces/Treatment";

// Register Norwegian locale
registerLocale('nb', nb);

interface CompletedBookingProps {
  bookingId: string;
  date: Date;
  time: string;
  treatment: Treatment;
  duration: number;
  isGroup: boolean;
  groupSize?: number;
  location: {
    address: string;
    city: string;
    postalCode: number;
  };
  onClose: () => void;
}

const CompletedBooking: React.FC<CompletedBookingProps> = ({
  bookingId,
  date,
  time,
  treatment,
  duration,
  isGroup,
  groupSize,
  location,
  onClose
}) => {
  return (
    <div className="completed-booking-modal">
      <div className="completed-booking-content">
        <h3>Booking Bekreftet! 🎉</h3>
        <p className="booking-id">Booking ID: {bookingId}</p>
        
        <div className="booking-details">
          <h4>Detaljer for din booking:</h4>
          <p><strong>Dato:</strong> {date.toLocaleDateString('nb-NO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p><strong>Tid:</strong> {time}</p>
          <p><strong>Behandling:</strong> {treatment.name}</p>
          {isGroup ? (
            <>
              <p><strong>Gruppestørrelse:</strong> {groupSize} personer</p>
              <p><strong>Total varighet:</strong> {duration} minutter</p>
            </>
          ) : (
            <p><strong>Varighet:</strong> {duration} minutter</p>
          )}
          
          <div className="location-details">
            <h4>Sted:</h4>
            <p>{location.address}</p>
            <p>{location.postalCode} {location.city}</p>
          </div>
        </div>

        <button className="close-button" onClick={onClose}>
          Lukk
        </button>
      </div>
    </div>
  );
};

// Helper function to format date as YYYY-MM-DD
function formatDateForAPI(date: Date): string {
  return date.toLocaleDateString('sv-SE'); // Using Swedish locale which gives us YYYY-MM-DD format
}

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Henter tilgjengelige tider...</p>
  </div>
);

// Dummy currentUser for demonstration—replace with your authentication context/hook.
const currentUser = { uid: "user123" };

const BookingCalendar: React.FC = () => {
  // State for available times, selected date, location, event details, and selected time
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // State for booking confirmation modal and additional booking details
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupSize, setGroupSize] = useState<number>(1);
  // For individual bookings, selectedDuration represents the appointment duration in minutes.
  // For group bookings, it represents the total duration.
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  // State for treatments fetched from Firestore
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // State for completed booking
  const [showCompletedBooking, setShowCompletedBooking] = useState(false);
  const [completedBookingId, setCompletedBookingId] = useState<string>("");

  // State for address input
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [postalCode, setPostalCode] = useState<number | null>(null);

  // Fetch treatments from Firestore when the component mounts
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const data = await getTreatments();
        setTreatments(data);
      } catch (error) {
        console.error("Error fetching treatments:", error);
      }
    };
    fetchTreatments();
  }, []);

  // Fetch available timeslots when a date is selected
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchSlots = async () => {
      setIsLoading(true);
      const dateStr = formatDateForAPI(selectedDate);
      console.log(`Fetching slots for ${dateStr}`);
      try {
        const data = await getAvailableSlotsByDate(dateStr);
        if (data) {
          const formattedSlots: TimeSlot[] = data.availableSlots.map((slot: string) => ({
            start: slot,
            end: ""
          }));
          setAvailableSlots(formattedSlots);
          setLocation(data.location || "Ukjent");
          if (data.eventDetails) {
            setEventDetails({
              name: (data.eventDetails as { name?: string }).name || "Ukjent arrangement",
              location: (data.eventDetails as { location?: string }).location || "Ukjent sted",
            });
          } else {
            setEventDetails(null);
          }
        } else {
          console.warn(`No data found for ${dateStr}`);
          setAvailableSlots([]);
          setLocation(null);
          setEventDetails(null);
        }
      } catch (error) {
        console.error(`Error fetching slots for ${dateStr}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate]);

  // Handle timeslot click by showing the confirmation modal
  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedTime(slot.start);
    setShowConfirmation(true);
  };

  // Confirm booking by constructing the booking object and calling createBooking
  const handleBookingConfirm = async () => {
    if (!selectedDate || !selectedTime || !selectedTreatment || !location) {
      alert("Vennligst fyll ut alle detaljer for bookingen.");
      return;
    }

    if (isGroupBooking && (!groupSize || groupSize < 1)) {
      alert("Vennligst velg en gyldig gruppestørrelse (minimum 1 person).");
      return;
    }

    let duration: number;
    let price: number;
    if (!isGroupBooking) {
      // For individual bookings, use selectedDuration directly
      if (!selectedDuration) {
        alert("Vennligst velg varighet for bookingen.");
        return;
      }
      duration = selectedDuration;
      const durationOption = selectedTreatment.durations.find(
        (d) => d.duration === duration
      );
      if (!durationOption) {
        alert("Valgt varighet er ikke tilgjengelig for denne behandlingen.");
        return;
      }
      price = durationOption.price;
    } else {
      // For group bookings, selectedDuration represents the total duration
      if (!selectedDuration) {
        alert("Vennligst velg total varighet for gruppen.");
        return;
      }
      duration = selectedDuration;
      // Calculate effective duration per person
      const effectiveDuration = duration / groupSize;
      const durationOption = selectedTreatment.durations.find(
        (d) => d.duration === effectiveDuration
      );
      if (!durationOption) {
        alert(
          `Effektiv varighet per person (${effectiveDuration} minutter) er ikke gyldig for valgt behandling.`
        );
        return;
      }
      let pricePerPerson = durationOption.price;
      if (
        groupSize >= selectedTreatment.discounts.groupSize &&
        selectedTreatment.discounts.prices[effectiveDuration.toString()]
      ) {
        pricePerPerson = selectedTreatment.discounts.prices[effectiveDuration.toString()];
      }
      price = pricePerPerson * groupSize;
    }

    // Combine the selected date and time (assumes selectedTime is in "HH:MM" format)
    const dateStr = formatDateForAPI(selectedDate);
    const startDateTime = new Date(`${dateStr}T${selectedTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const bookingData: BookingData = {
      customerId: currentUser.uid,
      date: selectedDate,
      duration,
      location: {
        address: location,
        city: "",
        postalCode: 0
      },
      paymentStatus: "pending",
      price,
      status: "pending",
      timeslot: {
        start: startDateTime,
        end: endDateTime,
      },
      treatmentId: selectedTreatment.id,
    };

    try {
      const bookingId = await createBooking(bookingData);
      setCompletedBookingId(bookingId);
      setShowCompletedBooking(true);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Det oppsto en feil ved oppretting av booking, vennligst prøv igjen.");
    }
  };

  const handleCloseCompletedBooking = () => {
    setShowCompletedBooking(false);
    setSelectedTime(null);
    setSelectedDate(null);
    setSelectedTreatment(null);
    setSelectedDuration(null);
    setIsGroupBooking(false);
    setGroupSize(1);
  };

  // Format date to Norwegian format
  const formatDateNorwegian = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="booking-calendar">
      <h2>Velg en dato</h2>
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (date) {
            setSelectedDate(date);
            setSelectedTime(null);
          }
        }}
        locale="nb"
        dateFormat="EEEE d. MMMM yyyy"
        minDate={new Date()}
        placeholderText="Velg en dato"
        className="date-picker-input"
      />

      {selectedDate && (
        <>
          <h3>Tilgjengelige tider for {formatDateNorwegian(selectedDate)}</h3>
          {eventDetails ? (
            <p>
              📅 Helene deltar på <strong>{eventDetails.name}</strong> på {eventDetails.location}
            </p>
          ) : (
            <p>📍 Sted: {location || "Ikke tilgjengelig"}</p>
          )}
          <div className="timeslot-grid">
            {isLoading ? (
              <LoadingSpinner />
            ) : availableSlots.length > 0 ? (
              availableSlots.map((slot) => (
                <button key={slot.start} onClick={() => handleSlotClick(slot)}>
                  {slot.start}
                </button>
              ))
            ) : (
              <p>Ingen tilgjengelige tider.</p>
            )}
          </div>
          {selectedTime && <p className="selected-time">Valgt tid: {selectedTime}</p>}
        </>
      )}

      {showConfirmation && (
        <div className="confirmation-modal">
          <h3>Bekreft din booking</h3>
          <p>
            <strong>Dato:</strong> {selectedDate ? formatDateNorwegian(selectedDate) : ''}
          </p>
          <p className="start-time">
            <strong>Starttid:</strong> {selectedTime}
          </p>
          
          <div>
            <label className="checkbox-label">
              Bookes for en gruppe?
              <input
                type="checkbox"
                checked={isGroupBooking}
                onChange={(e) => {
                  setIsGroupBooking(e.target.checked);
                  setSelectedDuration(null);
                }}
              />
            </label>
          </div>
          <div className="booking-inputs-container">

          {isGroupBooking && (
            <>
              <div>
                <label>
                  Gruppestørrelse:
                  <input
                    type="number"
                    min="2"
                    value={groupSize || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // If empty string, set to undefined, otherwise parse as number
                      const numValue = value === '' ? 2 : parseInt(value, 10);
                      setGroupSize(numValue);
                    }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Total varighet:
                  <select
                    value={selectedDuration || ""}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  >
                    <option value="">Velg total varighet</option>
                    {selectedTreatment?.durations.map((d) => {
                      const total = d.duration * groupSize;
                      return (
                        <option key={d.duration} value={total}>
                          {total} minutter ({d.duration} min per person)
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
            </>
          )}

          <div>
            <label>
              Behandlingstype:
              <select
                value={selectedTreatment ? selectedTreatment.id : ""}
                onChange={(e) => {
                  const behandling = treatments.find((t) => t.id === e.target.value) || null;
                  setSelectedTreatment(behandling);
                  setSelectedDuration(null);
                }}
              >
                <option value="">Velg behandling</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedTreatment && !isGroupBooking && (
            <div>
              <label>
                Varighet:
                <select
                  value={selectedDuration || ""}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                >
                  <option value="">Velg varighet</option>
                  {selectedTreatment.durations.map((d) => (
                    <option key={d.duration} value={d.duration}>
                      {d.duration} minutter
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="location-display">
            <label>
              Knipetak's plassering denne dagen:
              <p className="location-value">{location || "Ikke tilgjengelig"}</p>
            </label>
            <p className="location-warning">
              ⚠️ Merk: Hvis adressen din er for langt unna {location}, 
              kan bookingen måtte kanselleres eller flyttes til en annen dato.
            </p>
          </div>

          <div>
            <label>
              Din adresse:
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Skriv inn din adresse"
              />
            </label>
          </div>
          <div>
            <label>
              By:
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Skriv inn by"
              />
            </label>
          </div>
          <div>
            <label>
              Postnummer:
              <input
                type="number"
                value={postalCode || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseInt(value, 10);
                  setPostalCode(numValue);
                }}
                placeholder="Skriv inn postnummer"
              />
            </label>
          </div>

          </div>

          <div className="modal-actions">
            <button onClick={handleBookingConfirm}>Bekreft booking</button>
            <button onClick={() => setShowConfirmation(false)}>Avbryt</button>
          </div>
        </div>
      )}

      {showCompletedBooking && selectedDate && selectedTime && selectedTreatment && location && (
        <CompletedBooking
          bookingId={completedBookingId}
          date={selectedDate}
          time={selectedTime}
          treatment={selectedTreatment}
          duration={selectedDuration || 0}
          isGroup={isGroupBooking}
          groupSize={isGroupBooking ? groupSize : undefined}
          location={{
            address: location,
            city: "",
            postalCode: 0
          }}
          onClose={handleCloseCompletedBooking}
        />
      )}
    </div>
  );
};

export default BookingCalendar;