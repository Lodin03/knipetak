import { useEffect, useState } from "react";
import { getDefaultWorkHours, setDefaultWorkHours } from "../../../backend/firebase/services/firebase.availabilityservice";
import type { Location } from "../../../backend/interfaces/Location";
import type WeeklySchedule from "../../../backend/interfaces/availabilityInterfaces/WeeklySchedule";
import "./WorkhoursManager.css";
import { LocationModal } from "../LocationSetter/LocationModal";

const DAYS = [
  "mandag",
  "tirsdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lørdag",
  "søndag",
] as const;

// Mapping between Norwegian display names and database keys
const DAY_MAPPING: Record<string, string> = {
  "mandag": "monday",
  "tirsdag": "tuesday",
  "onsdag": "wednesday",
  "torsdag": "thursday",
  "fredag": "friday",
  "lørdag": "saturday",
  "søndag": "sunday",
};

interface WorkHoursManagerProps {
  locations: Location[];
  onLocationCreated: (newLocation: Location) => void;
}

export function WorkHoursManager({ locations, onLocationCreated }: WorkHoursManagerProps) {
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    return DAYS.reduce<WeeklySchedule>((acc, norwegianDay) => {
      const englishDay = DAY_MAPPING[norwegianDay];
      acc[englishDay] = {
        workhours: {
          timeSlots: []
        }
      };
      return acc;
    }, {});
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const defaultHours = await getDefaultWorkHours();
        
        const initialSchedule = DAYS.reduce<WeeklySchedule>((acc, norwegianDay) => {
          const englishDay = DAY_MAPPING[norwegianDay];
          acc[englishDay] = defaultHours?.[englishDay] || {
            workhours: {
              timeSlots: [{
                start: "09:00",
                end: "17:00",
                location: locations[0]?.id || "",
              }]
            }
          };
          return acc;
        }, {});

        setSchedule(initialSchedule);
      } catch (error) {
        setError("Kunne ikke laste data. Prøv igjen senere.");
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [locations]);

  const handleAddTimeSlot = (norwegianDay: string) => {
    const englishDay = DAY_MAPPING[norwegianDay];
    setSchedule((prev) => ({
      ...prev,
      [englishDay]: {
        ...prev[englishDay],
        workhours: {
          timeSlots: [
            ...prev[englishDay].workhours.timeSlots,
            { start: "09:00", end: "17:00", location: locations[0]?.id || "" }
          ]
        }
      }
    }));
  };

  const handleRemoveTimeSlot = (norwegianDay: string, index: number) => {
    const englishDay = DAY_MAPPING[norwegianDay];
    setSchedule((prev) => ({
      ...prev,
      [englishDay]: {
        ...prev[englishDay],
        workhours: {
          timeSlots: prev[englishDay].workhours.timeSlots.filter((_, i) => i !== index),
        },
      },
    }));
  };

  const handleTimeChange = (
    norwegianDay: string,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const englishDay = DAY_MAPPING[norwegianDay];
    setSchedule((prev) => ({
      ...prev,
      [englishDay]: {
        ...prev[englishDay],
        workhours: {
          timeSlots: prev[englishDay].workhours.timeSlots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          ),
        },
      },
    }));
  };

  const handleLocationChange = (norwegianDay: string, index: number, locationId: string) => {
    const englishDay = DAY_MAPPING[norwegianDay];
    if (locationId === "new") {
      setActiveDay(englishDay);
      setIsLocationModalOpen(true);
      return;
    }

    setSchedule((prev) => ({
      ...prev,
      [englishDay]: {
        ...prev[englishDay],
        workhours: {
          timeSlots: prev[englishDay].workhours.timeSlots.map((slot, i) =>
            i === index ? { ...slot, location: locationId } : slot
          )
        }
      }
    }));
  };

  const handleDayOffToggle = (norwegianDay: string, isDayOff: boolean) => {
    const englishDay = DAY_MAPPING[norwegianDay];
    setSchedule((prev) => ({
      ...prev,
      [englishDay]: {
        workhours: {
          timeSlots: isDayOff ? [] : [{
            start: "09:00",
            end: "17:00",
            location: locations[0]?.id || ""
          }]
        }
      }
    }));
  };

  const handleNewLocation = (newLocation: Location) => {
    if (activeDay) {
      setSchedule(prev => ({
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          workhours: {
            timeSlots: prev[activeDay].workhours.timeSlots.map(slot => ({
              ...slot,
              location: slot.location === "" ? newLocation.id : slot.location
            }))
          }
        }
      }));
    }
    onLocationCreated(newLocation);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      
      await setDefaultWorkHours(schedule);
      setSuccess("Arbeidstimer ble oppdatert!");
    } catch (error) {
      setError("Kunne ikke oppdatere arbeidstimer. Prøv igjen senere.");
      console.error("Failed to update work hours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="work-hours-manager">Laster...</div>;
  }

  return (
    <div className="work-hours-manager">
      <div className="work-hours-header">
        <h2 className="work-hours-title">Standard Arbeidstimer</h2>
        <p className="work-hours-description">
          Her kan du sette dine standard arbeidstimer for hver ukedag. Du kan legge til flere tidsperioder per dag med forskjellige lokasjoner.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="work-hours-schedule">
        {DAYS.map((norwegianDay) => {
          const englishDay = DAY_MAPPING[norwegianDay];
          const isDayOff = !schedule[englishDay]?.workhours?.timeSlots?.length;
          
          return (
            <div key={norwegianDay} className="day-schedule">
              <div className="day-header">
                <h3 className="day-title">{norwegianDay}</h3>
                <label className="day-off-toggle">
                  <input
                    type="checkbox"
                    checked={isDayOff}
                    onChange={(e) => handleDayOffToggle(norwegianDay, e.target.checked)}
                    className="day-off-checkbox"
                  />
                  <span className="day-off-label">Fri</span>
                </label>
              </div>
              
              <div className={`schedule-grid ${isDayOff ? 'disabled' : ''}`}>
                {!isDayOff && schedule[englishDay]?.workhours.timeSlots.map((timeSlot, index) => (
                  <div key={index} className="time-slot">
                    <div className="time-slot-header">
                      <span className="time-slot-title">Tidsperiode {index + 1}</span>
                      {index > 0 && (
                        <button
                          onClick={() => handleRemoveTimeSlot(norwegianDay, index)}
                          className="remove-slot-button"
                        >
                          Fjern
                        </button>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor={`${norwegianDay}-${index}-start`}>Start</label>
                      <input
                        id={`${norwegianDay}-${index}-start`}
                        type="time"
                        value={timeSlot.start || ""}
                        onChange={(e) => handleTimeChange(norwegianDay, index, "start", e.target.value)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" htmlFor={`${norwegianDay}-${index}-end`}>Slutt</label>
                      <input
                        id={`${norwegianDay}-${index}-end`}
                        type="time"
                        value={timeSlot.end || ""}
                        onChange={(e) => handleTimeChange(norwegianDay, index, "end", e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor={`${norwegianDay}-${index}-location`}>Lokasjon</label>
                      <select
                        id={`${norwegianDay}-${index}-location`}
                        value={timeSlot.location || ""}
                        onChange={(e) => handleLocationChange(norwegianDay, index, e.target.value)}
                        className="form-input"
                      >
                        <option value="">Velg lokasjon</option>
                        {locations.map((location) => (
                          <option 
                            key={location.id} 
                            value={location.id}
                          >
                            {location.name}
                          </option>
                        ))}
                        <option value="new">+ Legg til ny lokasjon</option>
                      </select>
                    </div>
                  </div>
                ))}

                {!isDayOff && (
                  <button
                    onClick={() => handleAddTimeSlot(norwegianDay)}
                    className="add-slot-button"
                  >
                    + Legg til tidsperiode
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => {
            setIsLocationModalOpen(false);
            setActiveDay(null);
          }}
          onLocationCreated={handleNewLocation}
        />

        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="submit-button"
        >
          {isLoading ? "Lagrer..." : "Lagre Arbeidstimer"}
        </button>
      </div>
    </div>
  );
} 