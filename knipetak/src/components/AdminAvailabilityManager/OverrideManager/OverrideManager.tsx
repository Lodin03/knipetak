import { useState, useCallback } from "react";
import type { Location } from "../../../backend/interfaces/Location";
import type { OverrideData } from "../../../backend/interfaces/availabilityInterfaces/OverrideData";
import type { TimeSlot } from "../../../backend/interfaces/availabilityInterfaces/WorkHours";
import { setOverrideWorkHours, getOverrideWorkHours } from "../../../backend/firebase/services/firebase.availabilityservice";
import { format, isValid, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import "./OverrideManager.css";

interface OverrideManagerProps {
  locations: Location[];
}

interface ValidationError {
  index: number;
  message: string;
}

export function OverrideManager({ locations }: OverrideManagerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { start: "09:00", end: "17:00", location: locations[0]?.id || "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDayOff, setIsDayOff] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateTimeSlots = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    timeSlots.forEach((slot, index) => {
      const start = parseISO(`2000-01-01T${slot.start}`);
      const end = parseISO(`2000-01-01T${slot.end}`);
      
      if (!isValid(start) || !isValid(end)) {
        errors.push({
          index,
          message: "Ugyldig tidsformat"
        });
        return;
      }

      if (end <= start) {
        errors.push({
          index,
          message: "Sluttid må være etter starttid"
        });
      }

      if (!slot.location) {
        errors.push({
          index,
          message: "Velg en lokasjon"
        });
      }
    });

    return errors;
  }, [timeSlots]);

  const handleAddTimeSlot = () => {
    setTimeSlots((prev) => [
      ...prev,
      { start: "09:00", end: "17:00", location: locations[0]?.id || "" },
    ]);
    setValidationErrors([]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));
    setValidationErrors([]);
  };

  const handleTimeChange = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    setTimeSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
    setValidationErrors([]);
  };

  const handleLocationChange = (index: number, locationId: string) => {
    setTimeSlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, location: locationId } : slot
      )
    );
    setValidationErrors([]);
  };

  const loadOverride = async (date: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setValidationErrors([]);
      const override = await getOverrideWorkHours(date);
      
      if (override) {
        setTimeSlots(override.workhours.timeSlots);
        setIsDayOff(override.workhours.timeSlots.length === 0);
        if (override.eventId) {
          const [title, description] = override.eventId.split("||");
          setEventTitle(title || "");
          setEventDescription(description || "");
        }
      } else {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to load override:", error);
      setError("Kunne ikke laste data for valgt dato");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTimeSlots([
      { start: "09:00", end: "17:00", location: locations[0]?.id || "" },
    ]);
    setIsDayOff(false);
    setEventTitle("");
    setEventDescription("");
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadOverride(date);
  };

  const handleSubmit = async () => {
    try {
      const errors = validateTimeSlots();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(null);
      setValidationErrors([]);

      const overrideData: OverrideData = {
        workhours: {
          timeSlots: isDayOff ? [] : timeSlots,
        },
        location: timeSlots[0]?.location || "",
      };

      if (eventTitle || eventDescription) {
        overrideData.eventId = `${eventTitle}||${eventDescription}`;
      }

      await setOverrideWorkHours(selectedDate, overrideData);
      setSuccess("Overstyring ble lagret!");
    } catch (error) {
      console.error("Failed to save override:", error);
      setError("Kunne ikke lagre overstyring. Prøv igjen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = selectedDate
    ? format(new Date(selectedDate), "EEEE d. MMMM yyyy", { locale: nb })
    : "";

  const getSlotError = (index: number) => {
    return validationErrors.find(error => error.index === index)?.message;
  };

  return (
    <div className="override-manager">
      <div className="override-header">
        <h2 className="override-title">Overstyring av Arbeidstimer</h2>
        <p className="override-description">
          Her kan du overstyre arbeidstimer for spesifikke datoer, for eksempel ved
          ferier, helligdager eller spesielle arrangementer.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="override-form">
        <div className="form-group">
          <label className="form-label" htmlFor="date">
            Velg dato
          </label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="form-input"
            min={format(new Date(), "yyyy-MM-dd")}
          />
        </div>

        <div className="selected-date">
          Valgt dato: <strong>{formattedDate}</strong>
        </div>

        <div className="event-section">
          <div className="form-group">
            <label className="form-label" htmlFor="eventTitle">
              Hendelse (valgfritt)
            </label>
            <input
              id="eventTitle"
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="F.eks. Ferie, Helligdag, etc."
              className="form-input"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="eventDescription">
              Beskrivelse (valgfritt)
            </label>
            <input
              id="eventDescription"
              type="text"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Legg til mer informasjon om hendelsen"
              className="form-input"
              maxLength={100}
            />
          </div>
        </div>

        <div className="day-off-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isDayOff}
              onChange={(e) => {
                setIsDayOff(e.target.checked);
                setValidationErrors([]);
              }}
              className="checkbox-input"
            />
            <span>Ingen arbeidstimer denne dagen</span>
          </label>
        </div>

        {!isDayOff && (
          <div className="time-slots">
            {timeSlots.map((slot, index) => (
              <div key={index} className="time-slot">
                <div className="time-slot-header">
                  <span className="time-slot-title">Tidsperiode {index + 1}</span>
                  {index > 0 && (
                    <button
                      onClick={() => handleRemoveTimeSlot(index)}
                      className="remove-slot-button"
                      type="button"
                    >
                      Fjern
                    </button>
                  )}
                </div>

                <div className="time-slot-inputs">
                  <div className="form-group">
                    <label className="form-label" htmlFor={`start-${index}`}>
                      Start
                    </label>
                    <input
                      id={`start-${index}`}
                      type="time"
                      value={slot.start}
                      onChange={(e) =>
                        handleTimeChange(index, "start", e.target.value)
                      }
                      className={`form-input ${getSlotError(index) ? 'error' : ''}`}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={`end-${index}`}>
                      Slutt
                    </label>
                    <input
                      id={`end-${index}`}
                      type="time"
                      value={slot.end}
                      onChange={(e) =>
                        handleTimeChange(index, "end", e.target.value)
                      }
                      className={`form-input ${getSlotError(index) ? 'error' : ''}`}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={`location-${index}`}>
                      Lokasjon
                    </label>
                    <select
                      id={`location-${index}`}
                      value={slot.location}
                      onChange={(e) =>
                        handleLocationChange(index, e.target.value)
                      }
                      className={`form-input ${getSlotError(index) ? 'error' : ''}`}
                    >
                      <option value="">Velg lokasjon</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {getSlotError(index) && (
                    <div className="error-message">
                      {getSlotError(index)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button 
              onClick={handleAddTimeSlot} 
              className="add-slot-button"
              type="button"
            >
              + Legg til tidsperiode
            </button>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading || validationErrors.length > 0}
          className="submit-button"
          type="button"
        >
          {isLoading ? "Lagrer..." : "Lagre Overstyring"}
        </button>
      </div>
    </div>
  );
} 