import React, { useState, useEffect } from "react";
import { Location as VenueLocation } from "../../../../backend/interfaces/Location";
import { Treatment } from "../../../../backend/interfaces/Treatment";
import "./BookingForm.css";

export interface BookingFormProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedLocation: VenueLocation | null;
  treatments: Treatment[];
  onConfirm: () => void;
  onCancel: () => void;
  isGroupBooking: boolean;
  setIsGroupBooking: (isGroup: boolean) => void;
  groupSize: number;
  setGroupSize: (size: number) => void;
  selectedTreatment: Treatment | null;
  setSelectedTreatment: (treatment: Treatment | null) => void;
  selectedDuration: number | null;
  setSelectedDuration: (duration: number | null) => void;
  address: string;
  setAddress: (address: string) => void;
  city: string;
  setCity: (city: string) => void;
  postalCode: number | null;
  setPostalCode: (postalCode: number | null) => void;
  isGuestBooking: boolean;
  guestEmail: string;
  setGuestEmail: (email: string) => void;
  guestName: string;
  setGuestName: (name: string) => void;
  guestPhone: string;
  setGuestPhone: (phone: string) => void;
  customerMessage: string;
  setCustomerMessage: (message: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  selectedTime,
  selectedLocation,
  treatments,
  onConfirm,
  onCancel,
  isGroupBooking,
  setIsGroupBooking,
  groupSize,
  setGroupSize,
  selectedTreatment,
  setSelectedTreatment,
  selectedDuration,
  setSelectedDuration,
  address,
  setAddress,
  city,
  setCity,
  postalCode,
  setPostalCode,
  isGuestBooking,
  guestEmail,
  setGuestEmail,
  guestName,
  setGuestName,
  guestPhone,
  setGuestPhone,
  customerMessage,
  setCustomerMessage,
}) => {
  const [availableDurations, setAvailableDurations] = useState<
    { duration: number; price: number }[]
  >([]);
  const [isFormValid, setIsFormValid] = useState(false);

  // Format date to Norwegian format (DD.MM.YYYY)
  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Map location ID to name or use location name
  const getLocationName = (): string => {
    if (!selectedLocation) return "";
    return selectedLocation.name || "Ukjent sted";
  };

  // Validate form inputs
  useEffect(() => {
    if (
      selectedDate &&
      selectedTime &&
      selectedTreatment &&
      selectedDuration &&
      address &&
      city &&
      postalCode
    ) {
      if (isGuestBooking) {
        setIsFormValid(Boolean(guestEmail && guestName && guestPhone));
      } else {
        setIsFormValid(true);
      }
    } else {
      setIsFormValid(false);
    }
  }, [
    selectedDate,
    selectedTime,
    selectedTreatment,
    selectedDuration,
    address,
    city,
    postalCode,
    isGuestBooking,
    guestEmail,
    guestName,
    guestPhone,
  ]);

  // Update available durations when treatment changes
  useEffect(() => {
    if (selectedTreatment) {
      setAvailableDurations(selectedTreatment.durations);
      // Reset selected duration when treatment changes
      setSelectedDuration(null);
    } else {
      setAvailableDurations([]);
    }
  }, [selectedTreatment, setSelectedDuration]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onConfirm();
    }
  };

  return (
    <div className="booking-form-container">
      <h3>Fullfør booking</h3>
      <div className="form-content">
        <form onSubmit={handleSubmit}>
          <div className="booking-details">
            <h4>Bookinginformasjon:</h4>
            <p>
              <strong>Dato:</strong> {formatDate(selectedDate)}
            </p>
            <p>
              <strong>Klokkeslett:</strong> {selectedTime}
            </p>
            <p>
              <strong>Sted:</strong> {getLocationName()}
            </p>
          </div>

          <div className="form-group">
            <label>Velg behandling:</label>
            <select
              value={selectedTreatment?.id || ""}
              onChange={(e) => {
                const treatment = treatments.find(
                  (t) => t.id === e.target.value
                );
                setSelectedTreatment(treatment || null);
              }}
              required
            >
              <option value="">Velg behandling</option>
              {treatments.map((treatment) => (
                <option key={treatment.id} value={treatment.id}>
                  {treatment.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTreatment && (
            <div className="form-group">
              <label>Gruppebooking?</label>
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="isGroupBooking"
                  checked={isGroupBooking}
                  onChange={(e) => setIsGroupBooking(e.target.checked)}
                />
                <label htmlFor="isGroupBooking">
                  Ja, dette er en gruppebooking
                </label>
              </div>
            </div>
          )}

          {isGroupBooking && selectedTreatment && (
            <div className="form-group">
              <label>Gruppestørrelse:</label>
              <input
                type="number"
                min="2"
                value={groupSize < 2 ? 2 : groupSize}
                onChange={(e) => setGroupSize(parseInt(e.target.value) || 2)}
                required
              />
              <small>
                {selectedTreatment.discounts.groupSize > 0 &&
                  `Grupperabatt tilgjengelig fra ${selectedTreatment.discounts.groupSize} personer.`}
              </small>
            </div>
          )}

          {selectedTreatment && (
            <div className="form-group">
              <label>
                {isGroupBooking
                  ? "Total tid for hele gruppen:"
                  : "Velg varighet:"}
              </label>
              <select
                value={selectedDuration || ""}
                onChange={(e) => {
                  setSelectedDuration(
                    e.target.value ? parseInt(e.target.value) : null
                  );
                }}
                required
              >
                <option value="">Velg varighet</option>
                {availableDurations.map((option) => {
                  // Remove price from display text
                  let display = `${option.duration} minutter`;

                  if (isGroupBooking) {
                    // For group bookings, show the total duration for all members
                    const totalDuration = option.duration * groupSize;
                    // Remove price calculations but keep discount information
                    if (
                      groupSize >= selectedTreatment.discounts.groupSize &&
                      selectedTreatment.discounts.prices[
                        option.duration.toString()
                      ]
                    ) {
                      display = `${totalDuration} minutter (med grupperabatt)`;
                    } else {
                      display = `${totalDuration} minutter`;
                    }

                    return (
                      <option key={totalDuration} value={totalDuration}>
                        {display}
                      </option>
                    );
                  }

                  return (
                    <option key={option.duration} value={option.duration}>
                      {display}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="customerMessage">Beskjed til behandler:</label>
            <textarea
              id="customerMessage"
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              placeholder="Har du noen skader, helsetilstander eller annet Helene bør vite om? (valgfritt)"
              rows={4}
              className="message-input"
            />
          </div>

          {selectedLocation && (
            <div className="location-warning">
              <p>
                For å fullføre bookingen, trenger vi din adresse hvor
                behandlingen skal utføres.
              </p>
            </div>
          )}

          <div className="form-group">
            <label>Adresse:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Skriv inn din adresse"
              required
            />
          </div>

          <div className="form-group">
            <label>By:</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Skriv inn din by"
              required
            />
          </div>

          <div className="form-group">
            <label>Postnummer:</label>
            <input
              type="number"
              value={postalCode || ""}
              onChange={(e) => setPostalCode(parseInt(e.target.value) || null)}
              placeholder="Skriv inn ditt postnummer"
              required
            />
          </div>

          {isGuestBooking && (
            <>
              <div className="guest-info-section">
                <h4>Gjesteinformasjon</h4>
                <div className="form-group">
                  <label>Navn:</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ditt fulle navn"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>E-post:</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Din e-postadresse"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefon:</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Ditt telefonnummer"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="confirm-button"
              disabled={!isFormValid}
            >
              Bekreft booking
            </button>
            <button type="button" className="cancel-button" onClick={onCancel}>
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
