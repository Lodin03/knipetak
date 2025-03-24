import React, { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { nb } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { getAvailableSlotsByDate } from "../../backend/firebase/services/firebase.availabilityservice";
import { createBooking } from "../../backend/firebase/services/firebase.bookingservice";
import { getTreatments } from "../../backend/firebase/services/firebase.treatmentservice";
import { getLocations } from "../../backend/firebase/services/firebase.locationservice";
import { BookingData } from "../../backend/interfaces/BookingData";
import "./BookingCalendar.css";
import TimeSlot from "../../backend/interfaces/TimeSlot";
import EventDetails from "../../backend/interfaces/availabilityInterfaces/EventDetails";
import { Treatment } from "../../backend/interfaces/Treatment";
import { Location as VenueLocation } from "../../backend/interfaces/Location";
import { Location as BookingLocation } from "../../backend/interfaces/UserData";

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
  location: BookingLocation;
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

interface LocationSlots {
  location: VenueLocation | null;
  workHours: {
    start: string;
    end: string;
  };
  availableSlots: string[];
}

const BookingCalendar: React.FC = () => {
  // Core booking state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [locations, setLocations] = useState<VenueLocation[]>([]);
  const [locationSlots, setLocationSlots] = useState<LocationSlots[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<VenueLocation | null>(null);
  
  // Treatment and group booking state
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  
  // Form and modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCompletedBooking, setShowCompletedBooking] = useState(false);
  const [completedBookingId, setCompletedBookingId] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [postalCode, setPostalCode] = useState<number | null>(null);

  // Fetch treatments and locations when the component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [treatmentsData, locationsData] = await Promise.all([
          getTreatments(),
          getLocations()
        ]);
        setTreatments(treatmentsData);
        setLocations(locationsData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch available timeslots when a date is selected
  useEffect(() => {
    if (!selectedDate || !locations.length) return;
    
    const fetchSlots = async () => {
      setIsLoading(true);
      const dateStr = formatDateForAPI(selectedDate);
      console.log(`Fetching slots for ${dateStr}`);
      try {
        const data = await getAvailableSlotsByDate(dateStr);
        if (data && data.availabilityByLocation?.length > 0) {
          const slotsWithLocationData = data.availabilityByLocation.map(slot => ({
            location: locations.find(loc => loc.id === slot.location) || null,
            workHours: slot.workHours,
            availableSlots: slot.availableSlots
          }));
          setLocationSlots(slotsWithLocationData);
          if (data.eventDetails) {
            const eventName = typeof data.eventDetails.name === 'string' ? data.eventDetails.name : "Ukjent arrangement";
            const eventLocation = typeof data.eventDetails.location === 'string' ? data.eventDetails.location : "Ukjent sted";
            setEventDetails({
              name: eventName,
              location: eventLocation
            });
          } else {
            setEventDetails(null);
          }
        } else {
          setLocationSlots([]);
          setEventDetails(null);
        }
      } catch (error) {
        console.error(`Error fetching slots for ${dateStr}:`, error);
        setLocationSlots([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, locations]);

  // Handle timeslot click by showing the confirmation modal
  const handleSlotClick = (slot: TimeSlot, location: VenueLocation | null) => {
    setSelectedTime(slot.start);
    setSelectedLocation(location);
    setShowConfirmation(true);
  };

  // Confirm booking by constructing the booking object and calling createBooking
  const handleBookingConfirm = async () => {
    if (!selectedDate || !selectedTime || !selectedTreatment || !selectedLocation) {
      alert("Vennligst fyll ut alle detaljer for bookingen.");
      return;
    }

    if (!address || !city || !postalCode) {
      alert("Vennligst fyll ut din adresse, by og postnummer.");
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

    // Create a booking location using the BookingLocation interface
    const bookingLocation: BookingLocation = {
      address,
      city,
      postalCode: Number(postalCode)
    };

    const bookingData: BookingData = {
      customerId: currentUser.uid,
      date: selectedDate,
      duration,
      location: bookingLocation,
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

  const handleLocationDisplay = (location: VenueLocation | null): string => {
    return location?.name || "Ukjent lokasjon";
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
              📅 Helene deltar på <strong>{eventDetails['name'] as string}</strong> på {eventDetails['location'] as string}
            </p>
          ) : isLoading ? (
            <LoadingSpinner />
          ) : locationSlots.length > 0 ? (
            <div className="locations-grid">
              {locationSlots.map((locationSlot, index) => (
                <div key={index} className="location-slots">
                  <h4>📍 {handleLocationDisplay(locationSlot.location)}</h4>
                  <p className="work-hours">
                    Arbeidstid: {locationSlot.workHours.start} - {locationSlot.workHours.end}
                  </p>
                  <div className="timeslot-grid">
                    {locationSlot.availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => handleSlotClick({ start: slot, end: "" }, locationSlot.location)}
                        className="time-slot-button"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Ingen tilgjengelige tider denne dagen.</p>
          )}
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
              <p className="location-value">{selectedLocation?.name || "Ikke tilgjengelig"}</p>
            </label>
            <p className="location-warning">
              ⚠️ Merk: Hvis adressen din er for langt unna {selectedLocation?.name}, 
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

      {showCompletedBooking && selectedDate && selectedTime && selectedTreatment && selectedLocation && (
        <CompletedBooking
          bookingId={completedBookingId}
          date={selectedDate}
          time={selectedTime}
          treatment={selectedTreatment}
          duration={selectedDuration || 0}
          isGroup={isGroupBooking}
          groupSize={isGroupBooking ? groupSize : undefined}
          location={{
            address,
            city,
            postalCode: Number(postalCode || 0)
          }}
          onClose={handleCloseCompletedBooking}
        />
      )}
    </div>
  );
};

export default BookingCalendar;