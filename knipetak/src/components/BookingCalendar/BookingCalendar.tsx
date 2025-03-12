import React, { useState, useEffect } from "react";
import { getAvailableSlotsByDate } from "../../backend/firebase/services/firebase.availabilityservice";
import { createBooking } from "../../backend/firebase/services/firebase.bookingservice";
import { getTreatments} from "../../backend/firebase/services/firebase.treatmentservice";
import { BookingData } from "../../backend/interfaces/BookingData";
import "./BookingCalendar.css";
import TimeSlot from "../../backend/interfaces/TimeSlot";
import EventDetails from "../../backend/interfaces/EventDetails";
import { Treatment } from "../../backend/interfaces/Treatment";

// Dummy currentUser for demonstration—replace with your authentication context/hook.
const currentUser = { uid: "user123" };

const BookingCalendar: React.FC = () => {
  // State for available times, selected date, location, event details, and selected time
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
  // State for tracking the appointment address
  const [address, setAddress] = useState<string>("");

  // State for treatments fetched from Firestore
  const [treatments, setTreatments] = useState<Treatment[]>([]);

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
      console.log(`Fetching slots for ${selectedDate}`);
      try {
        const data = await getAvailableSlotsByDate(selectedDate);
        if (data) {
          // Format available slots into TimeSlot objects (displaying only start times)
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
          console.warn(`No data found for ${selectedDate}`);
          setAvailableSlots([]);
          setLocation(null);
          setEventDetails(null);
        }
      } catch (error) {
        console.error(`Error fetching slots for ${selectedDate}:`, error);
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
    if (!selectedDate || !selectedTime || !selectedTreatment) {
      alert("Vennligst fyll ut alle detaljer for bookingen.");
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
    const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const bookingData: BookingData = {
      customerId: currentUser.uid,
      date: new Date(selectedDate),
      duration,
      location: "Haukeland",
      address,
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
      alert(`Booking bekreftet! Din booking-ID er: ${bookingId}`);
      setShowConfirmation(false);
      setSelectedTime(null);
      // Optionally reset additional modal fields...
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Det oppsto en feil ved oppretting av booking, vennligst prøv igjen.");
    }
  };

  return (
    <div className="booking-calendar">
      <h2>Velg en dato</h2>
      <input
        type="date"
        onChange={(e) => {
          setSelectedDate(e.target.value);
          setSelectedTime(null);
        }}
      />

      {selectedDate && (
        <>
          <h3>Tilgjengelige tider for {selectedDate}</h3>
          {eventDetails ? (
            <p>
              📅 Helene deltar på <strong>{eventDetails.name}</strong> på {eventDetails.location}
            </p>
          ) : (
            <p>📍 Sted: {location || "Ikke tilgjengelig"}</p>
          )}
          <div className="timeslot-grid">
            {availableSlots.length > 0 ? (
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
            <strong>Dato:</strong> {selectedDate}
          </p>
          <p>
            <strong>Starttid:</strong> {selectedTime}
          </p>
          <div>
            <label>
              Adresse:
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Skriv inn adresse"
              />
            </label>
          </div>
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
          {selectedTreatment && isGroupBooking && (
            <>
              <div>
                <label>
                  Gruppestørrelse:
                  <input
                    type="number"
                    min="1"
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
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
                    {selectedTreatment.durations.map((d) => {
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
          <button onClick={handleBookingConfirm}>Bekreft booking</button>
          <button onClick={() => setShowConfirmation(false)}>Avbryt</button>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;