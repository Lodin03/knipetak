import React, { useState, useEffect, useRef } from "react";
import { registerLocale } from "react-datepicker";
import { nb } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { getAvailableSlotsByDate } from "../../backend/firebase/services/firebase.availabilityservice";
import { createBooking } from "../../backend/firebase/services/firebase.bookingservice";
import { getTreatments } from "../../backend/firebase/services/firebase.treatmentservice";
import { getLocations } from "../../backend/firebase/services/firebase.locationservice";
import { auth } from "../../backend/firebase/services/firebase.authservice";
import { BookingData } from "../../backend/interfaces/BookingData";
import "./BookingCalendar.css";
import EventDetails from "../../backend/interfaces/availabilityInterfaces/EventDetails";
import { Treatment } from "../../backend/interfaces/Treatment";
import { Location as VenueLocation } from "../../backend/interfaces/Location";
import { Location as BookingLocation } from "../../backend/interfaces/UserData";
import { useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';

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
  </div>
);

interface LocationSlots {
  location: VenueLocation | null;
  workHours: {
    start: string;
    end: string;
  };
  availableSlots: string[];
}

interface DayInfoCache {
  [key: string]: {
    locationSlots: LocationSlots[];
    eventDetails: EventDetails | null;
  } | null;
}

// Calendar Day component to display information for a single day
interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  dayInfo: {
    locationSlots: LocationSlots[];
    eventDetails: EventDetails | null;
  } | null;
  isLoading: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  initialDataLoaded: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isSelected,
  dayInfo,
  isLoading,
  onClick,
  onMouseEnter,
  initialDataLoaded
}) => {
  const dayNum = date.getDate();
  const dayOfWeek = date.getDay(); // 0 = søndag, 6 = lørdag
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isDisabled = date < new Date(new Date().setHours(0, 0, 0, 0));
  const hasLocationInfo = dayInfo && dayInfo.locationSlots.length > 0;
  const hasEvent = dayInfo && dayInfo.eventDetails;
  
  // Check if we've tried to load data for this date
  const isDataAttempted = dayInfo !== undefined;
  const showLoading = isLoading || (!isDataAttempted && !isDisabled && isCurrentMonth && !initialDataLoaded);

  // For location display, truncate to first 15 chars if needed
  const getLocationDisplay = () => {
    if (!hasLocationInfo || !dayInfo?.locationSlots?.length) {
      return "Ikke tilgjengelig";
    }
    
    // Check if we have multiple locations
    if (dayInfo.locationSlots.length > 1) {
      return "Flere steder";
    }
    
    // Use multiple checks to ensure we get something to display
    const locationData = dayInfo.locationSlots[0];
    const locationName = locationData?.location?.name;
    
    if (locationName) {
      // We have a proper location name
      return locationName.length > 15 ? `${locationName.substring(0, 15)}...` : locationName;
    } else if (locationData?.location) {
      // Location exists but name is missing
      return "Tilgjengelig";
    } else if (locationData) {
      // We have slot data but location is missing
      return "Tilgjengelig";
    } else {
      // Fallback
      return "Ikke tilgjengelig";
    }
  };
  
  return (
    <div 
      className={`calendar-day ${!isCurrentMonth ? 'outside-month' : ''} ${isSelected ? 'selected' : ''} ${isToday(date) ? 'today' : ''} ${isDisabled ? 'disabled' : ''} ${isWeekend ? 'weekend' : ''}`}
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={isDisabled ? undefined : onMouseEnter}
    >
      <div className="day-header">
        <span className="day-number">{dayNum}</span>
      </div>
      <div className="day-content">
        {showLoading ? (
          <div className="day-loading">
            <div className="mini-spinner"></div>
          </div>
        ) : hasLocationInfo ? (
          <div className="location-info">
            <span className="location-name">
              {getLocationDisplay()}
            </span>
            <span className="work-hours">
              {dayInfo?.locationSlots.length > 1 
                ? "Flere tidspunkter" 
                : `${dayInfo?.locationSlots[0].workHours.start}-${dayInfo?.locationSlots[0].workHours.end}`
              }
            </span>
          </div>
        ) : hasEvent ? (
          <div className="event-info">
            <span className="event-indicator">📅</span>
            <span className="event-name">{dayInfo?.eventDetails?.name as string}</span>
          </div>
        ) : isCurrentMonth && !isDisabled && isDataAttempted ? (
          <div className="no-info">
            {isWeekend ? "Helg - ikke tilgjengelig" : "Ikke tilgjengelig"}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Calendar view component
interface CalendarViewProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  dayInfoCache: DayInfoCache;
  loadingDate: string | null;
  onMonthChange: (month: Date) => void;
  initialDataLoaded: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateSelect,
  dayInfoCache,
  loadingDate,
  onMonthChange,
  initialDataLoaded
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Create days array including padding days from previous/next months
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get start of first week (might be in previous month)
  const startDate = new Date(monthStart);
  const day = startDate.getDay();
  // JavaScript days are 0-indexed with Sunday as 0, so adjust for Monday start
  startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));

  // Get end of last week (might be in next month)
  const endDate = new Date(monthEnd);
  const endDay = endDate.getDay();
  // Add days to get to end of week (Sunday)
  endDate.setDate(endDate.getDate() + (endDay === 0 ? 0 : 7 - endDay));

  const daysInMonth = eachDayOfInterval({
    start: startDate,
    end: endDate
  });
  
  const goToPreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange(newMonth);
  };
  
  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange(newMonth);
  };
  
  // Preload data when mouse enters a day
  const handleDayHover = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return; // Skip past dates
    }
    
    const dateStr = formatDateForAPI(date);
    if (!dayInfoCache[dateStr] && loadingDate !== dateStr) {
      onDateSelect(date); // This will trigger data load in the parent
    }
  };
  
  // Debug log for initialDataLoaded
  useEffect(() => {
    console.log('DEBUG: CalendarView initialDataLoaded =', initialDataLoaded);
    
    // Add a timeout to auto-close the loading spinner after a few seconds
    let loadingTimer: number | undefined = undefined;
    
    if (!initialDataLoaded) {
      loadingTimer = window.setTimeout(() => {
        console.log('DEBUG: Auto-dismissing loading overlay after timeout');
        onMonthChange(currentMonth); // Force refresh of the current month
      }, 5000); // 5 seconds timeout
    }
    
    return () => {
      if (loadingTimer) {
        window.clearTimeout(loadingTimer);
      }
    };
  }, [initialDataLoaded, currentMonth, onMonthChange]);
  
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="month-nav-button">
          &lt;
        </button>
        <h3>{format(currentMonth, 'MMMM yyyy', { locale: nb })}</h3>
        <button onClick={goToNextMonth} className="month-nav-button">
          &gt;
        </button>
      </div>
      
      <div className="weekday-header">
        {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>
      
      <div className="days-grid">
        {daysInMonth.map(day => {
          const dateStr = formatDateForAPI(day);
          const isLoading = loadingDate === dateStr;
          const dayInfo = dayInfoCache[dateStr];
          
          return (
            <CalendarDay
              key={dateStr}
              date={day}
              isCurrentMonth={isSameMonth(day, currentMonth)}
              isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
              dayInfo={dayInfo}
              isLoading={isLoading}
              onClick={() => onDateSelect(day)}
              onMouseEnter={() => handleDayHover(day)}
              initialDataLoaded={initialDataLoaded}
            />
          );
        })}
      </div>
      
      {/* Only show loading overlay if explicitly not loaded */}
      {!initialDataLoaded && (
        <div className="calendar-loading-overlay">
          <div className="spinner"></div>
          <p>Laster inn tilgjengelighet...</p>
        </div>
      )}
    </div>
  );
};

const BookingCalendar: React.FC = () => {
  const navigate = useNavigate();
  // Core booking state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [locations, setLocations] = useState<VenueLocation[]>([]);
  const [locationSlots, setLocationSlots] = useState<LocationSlots[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<VenueLocation | null>(null);
  const [dayInfoCache, setDayInfoCache] = useState<DayInfoCache>({});
  const [isPreloadingMonth, setIsPreloadingMonth] = useState(false);
  const [pendingDates, setPendingDates] = useState<Date[]>([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  // Ref to track dates currently being fetched
  const fetchingDates = useRef<Set<string>>(new Set());
  
  // Debug log for state changes
  useEffect(() => {
    console.log('DEBUG: BookingCalendar - initialDataLoaded =', initialDataLoaded, 
                'isPreloadingMonth =', isPreloadingMonth, 
                'pendingDates.length =', pendingDates.length);
  }, [initialDataLoaded, isPreloadingMonth, pendingDates.length]);
  
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
  const [isGuestBooking, setIsGuestBooking] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Fetch treatments and locations when the component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('Starting initial data fetch...');
        
        // First load locations and treatments simultaneously
        const [treatmentsData, locationsData] = await Promise.all([
          getTreatments(),
          getLocations()
        ]);
        
        console.log(`Loaded ${locationsData.length} locations and ${treatmentsData.length} treatments`);
        
        // Set state for both data types
        setTreatments(treatmentsData);
        setLocations(locationsData);
        
        // Make sure locations are loaded properly
        if (locationsData.length === 0) {
          console.warn('No locations loaded, waiting before starting calendar preload');
          // If no locations, try again after a delay
          setTimeout(async () => {
            const retryLocations = await getLocations();
            if (retryLocations.length > 0) {
              console.log(`Retry successful, loaded ${retryLocations.length} locations`);
              setLocations(retryLocations);
              // Start preloading after successful retry
              handleMonthChange(new Date());
            } else {
              console.error('Failed to load locations after retry');
              // Force initialDataLoaded to true to prevent infinite loading
              setInitialDataLoaded(true);
            }
          }, 1000);
        } else {
          // Start the preloading process since we have locations
          handleMonthChange(new Date());
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Ensure UI doesn't stay in loading state on error
        setInitialDataLoaded(true);
      }
    };
    
    fetchInitialData();
  }, []);

  // Function to fetch availability for a specific date
  const fetchAvailabilityForDate = async (date: Date) => {
    const dateStr = formatDateForAPI(date);
    
    // Skip if we already have data or are loading this date
    if (dayInfoCache[dateStr] || loadingDate === dateStr) {
      return dayInfoCache[dateStr] || null;
    }
    
    // Use a ref to track if a fetch for this date is already in progress to avoid duplicate requests
    if (fetchingDates.current.has(dateStr)) {
      return null;
    }
    
    fetchingDates.current.add(dateStr);
    setLoadingDate(dateStr);
    
    try {
      // Make sure locations are loaded before proceeding
      if (locations.length === 0) {
        console.log('No locations loaded, fetching them now...');
        const locationsData = await getLocations();
        if (locationsData.length > 0) {
          console.log(`Fetched ${locationsData.length} locations`);
          setLocations(locationsData);
        } else {
          console.error('Failed to load locations');
        }
      }
      
      // Determine if this is a high-priority date (first week of month)
      const today = new Date();
      const monthStart = startOfMonth(today); 
      const firstWeekEnd = new Date(monthStart);
      firstWeekEnd.setDate(monthStart.getDate() + 7);
      const isFirstWeek = date <= firstWeekEnd;
      
      if (isFirstWeek) {
        console.log(`Prioritizing load for first week date: ${dateStr}`);
      }
      
      const data = await getAvailableSlotsByDate(dateStr);
      
      // If data is null or undefined, or we get an empty availabilityByLocation array
      // This can happen for weekends or when no work hours are set
      if (!data || !data.availabilityByLocation || data.availabilityByLocation.length === 0) {
        // Cache empty result
        const emptyResult = {
          locationSlots: [],
          eventDetails: data?.eventDetails || null
        };
        setDayInfoCache(prev => ({
          ...prev,
          [dateStr]: emptyResult
        }));
        return emptyResult;
      }
      
      const slotsWithLocationData = data.availabilityByLocation.map(slot => {
        // Find the location by ID, using a more robust lookup
        let matchedLocation = locations.find(loc => loc.id === slot.location);
        
        // For first week dates, make an extra attempt to find the location if not found
        if (!matchedLocation && isFirstWeek && locations.length > 0) {
          console.warn(`Location not found for ID ${slot.location}, using first available location`);
          matchedLocation = locations[0]; // Use first location as fallback for UI display
        }
        
        return {
          location: matchedLocation || null,
          workHours: {
            start: slot.workHours.start instanceof Date 
              ? slot.workHours.start.toTimeString().substring(0, 5)
              : typeof slot.workHours.start === 'string'
              ? slot.workHours.start
              : (slot.workHours.start as Timestamp).toDate().toTimeString().substring(0, 5),
            end: slot.workHours.end instanceof Date
              ? slot.workHours.end.toTimeString().substring(0, 5)
              : typeof slot.workHours.end === 'string'
              ? slot.workHours.end
              : (slot.workHours.end as Timestamp).toDate().toTimeString().substring(0, 5)
          },
          availableSlots: slot.availableSlots
        };
      });
      
      const dayInfo = {
        locationSlots: slotsWithLocationData,
        eventDetails: data.eventDetails
      };
      
      // Update cache
      setDayInfoCache(prev => ({
        ...prev,
        [dateStr]: dayInfo
      }));
      
      return dayInfo;
    } catch (error) {
      console.error(`Error fetching slots for ${dateStr}:`, error);
      // Cache error as a valid empty result (not null) to prevent repeated retries
      const errorResult = {
        locationSlots: [],
        eventDetails: null
      };
      setDayInfoCache(prev => ({
        ...prev,
        [dateStr]: errorResult
      }));
      return errorResult;
    } finally {
      setLoadingDate(null);
      fetchingDates.current.delete(dateStr);
    }
  };

  // Fetch availability for selected date and update UI
  useEffect(() => {
    if (!selectedDate || !locations.length) return;
    
    const fetchSlots = async () => {
      setIsLoading(true);
      const dateStr = formatDateForAPI(selectedDate);
      
      // If we have cached data for this date, use it
      if (dayInfoCache[dateStr]) {
        const cachedData = dayInfoCache[dateStr];
        if (cachedData) {
          setLocationSlots(cachedData.locationSlots);
          setEventDetails(cachedData.eventDetails);
        } else {
          setLocationSlots([]);
          setEventDetails(null);
        }
        setIsLoading(false);
        return;
      }
      
      const dayInfo = await fetchAvailabilityForDate(selectedDate);
      
      if (dayInfo) {
        setLocationSlots(dayInfo.locationSlots);
        
        if (dayInfo.eventDetails) {
          const eventName = typeof dayInfo.eventDetails.name === 'string' ? dayInfo.eventDetails.name : "Ukjent arrangement";
          const eventLocation = typeof dayInfo.eventDetails.location === 'string' ? dayInfo.eventDetails.location : "Ukjent sted";
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
      
      setIsLoading(false);
    };
    
    fetchSlots();
  }, [selectedDate, locations]);

  // Preload data for the current month, but with limited concurrency
  useEffect(() => {
    if (!isPreloadingMonth || !locations.length || pendingDates.length === 0) return;
    
    let isMounted = true;
    
    // Safety timeout to ensure loading overlay is dismissed even if preloading fails
    const safetyTimer = setTimeout(() => {
      if (isMounted && !initialDataLoaded) {
        console.log('DEBUG: Safety timeout triggered - forcing initialDataLoaded to true');
        setIsPreloadingMonth(false);
        setInitialDataLoaded(true);
      }
    }, 5000); // Reduced from 10s to 5s for faster user experience
    
    // Optimized data loading using batching with higher concurrency
    const loadDataInBatches = async () => {
      console.log('DEBUG: Starting loadDataInBatches with', pendingDates.length, 'dates to load');
      // Increased max concurrent requests for faster loading
      const MAX_CONCURRENT_REQUESTS = 5; // Increased from 3 to 5
      let successfullyLoaded = 0;
      let failedToLoad = 0;
      
      // Eagerly load first visible week before loading the rest
      const visibleDatesFirst = [...pendingDates];
      // Sort to prioritize dates in current week
      const today = new Date();
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
      
      visibleDatesFirst.sort((a, b) => {
        const aInCurrentWeek = a <= endOfWeek;
        const bInCurrentWeek = b <= endOfWeek;
        
        if (aInCurrentWeek && !bInCurrentWeek) return -1;
        if (!aInCurrentWeek && bInCurrentWeek) return 1;
        return a.getTime() - b.getTime();
      });
      
      // Replace original pending dates with sorted ones
      setPendingDates(visibleDatesFirst);
      
      // Continue as long as we have dates to load and the component is still mounted
      while (pendingDates.length > 0 && isMounted) {
        // Take the next batch of dates (up to max number)
        const batchDates = pendingDates.slice(0, MAX_CONCURRENT_REQUESTS);
        setPendingDates(prev => prev.slice(MAX_CONCURRENT_REQUESTS));
        console.log('DEBUG: Processing batch of', batchDates.length, 'dates. Remaining dates:', pendingDates.length - batchDates.length);
        
        try {
          // Run API calls for all dates in the batch in parallel
          const results = await Promise.allSettled(batchDates.map(date => fetchAvailabilityForDate(date)));
          
          // Set initialDataLoaded to true after processing the first batch
          if (successfullyLoaded === 0 && results.some(r => r.status === 'fulfilled')) {
            // As soon as we have some data, make the UI responsive
            setInitialDataLoaded(true);
          }
          
          // Count successes and failures
          results.forEach(result => {
            if (result.status === 'fulfilled') {
              successfullyLoaded++;
            } else {
              failedToLoad++;
            }
          });
        } catch (error) {
          console.error("Error loading batch of dates:", error);
          failedToLoad += batchDates.length;
          // Continue with next batch even if there's an error
        }
        
        // Removed timeout delay to speed up loading
        // Only add a minimal delay if needed for UI responsiveness
        if (pendingDates.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 10)); // Reduced from 100ms to 10ms
        }
      }
      
      // Done loading all dates
      if (isMounted) {
        console.log(`Month data loading complete. Successful: ${successfullyLoaded}, Failed: ${failedToLoad}`);
        console.log('DEBUG: Finished loadDataInBatches. Setting initialDataLoaded=true');
        setIsPreloadingMonth(false);
        // Add a small delay to ensure state is updated after isPreloadingMonth
        setTimeout(() => {
          if (isMounted) {
            setInitialDataLoaded(true);
            console.log('DEBUG: Setting initialDataLoaded to true after batch loading');
          }
        }, 10); // Reduced from 100ms to 10ms
      } else {
        console.log('DEBUG: Component unmounted during batch loading');
      }
    };
    
    loadDataInBatches();
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(safetyTimer); // Clear the safety timeout
    };
  }, [isPreloadingMonth, locations, pendingDates, initialDataLoaded]);

  // Handle month change - only preload data for the current month
  const handleMonthChange = (month: Date) => {
    // Clear existing loading queue to stop unnecessary loading
    setPendingDates([]);
    setIsPreloadingMonth(false);
    
    // Create array of dates for current month
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    // Only include dates from today forward
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const startDate = today > monthStart ? today : monthStart;
    
    if (startDate > monthEnd) {
      // Month is in the past, nothing to preload
      setInitialDataLoaded(true);
      return;
    }
    
    const datesInMonth = eachDayOfInterval({
      start: startDate,
      end: monthEnd
    });
    
    // Filter out dates we already have in cache
    const datesToLoad = datesInMonth.filter(date => {
      const dateStr = formatDateForAPI(date);
      return dayInfoCache[dateStr] === undefined; // Only load if we haven't tried before
    });
    
    // Set initialDataLoaded to false while we load new dates
    setInitialDataLoaded(datesToLoad.length === 0);
    
    if (datesToLoad.length > 0) {
      // We'll prioritize dates in 3 groups:
      // 1. First week of visible dates (highest priority)
      // 2. Weekdays in the rest of the month
      // 3. Weekends
      
      const firstWeekEnd = new Date(monthStart);
      firstWeekEnd.setDate(firstWeekEnd.getDate() + 7); // First 7 days of month
      
      // Sort dates into priority groups
      const firstWeekDates: Date[] = [];
      const weekdayDates: Date[] = [];
      const weekendDates: Date[] = [];
      
      datesToLoad.forEach(date => {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isFirstWeek = date < firstWeekEnd;
        
        if (isFirstWeek) {
          firstWeekDates.push(date);
        } else if (!isWeekend) {
          weekdayDates.push(date);
        } else {
          weekendDates.push(date);
        }
      });
      
      // Sort each group by date
      firstWeekDates.sort((a, b) => a.getTime() - b.getTime());
      weekdayDates.sort((a, b) => a.getTime() - b.getTime());
      weekendDates.sort((a, b) => a.getTime() - b.getTime());
      
      // Start by immediately fetching the first week of dates
      if (firstWeekDates.length > 0) {
        console.log(`Immediately loading first ${firstWeekDates.length} dates of the month`);
        
        // First load the first visible dates right away (highest priority)
        Promise.all(
          firstWeekDates.map(date => 
            fetchAvailabilityForDate(date)
              .catch(err => {
                console.error(`Error loading date ${formatDateForAPI(date)}:`, err);
                return null;
              })
          )
        ).then(() => {
          // After first week loaded, set initialDataLoaded to true
          setInitialDataLoaded(true);
          
          // Then load the rest of the dates in batches
          const remainingDates = [...weekdayDates, ...weekendDates];
          if (remainingDates.length > 0) {
            setPendingDates(remainingDates);
            setIsPreloadingMonth(true);
          }
        }).catch(error => {
          console.error("Error loading first week:", error);
          setInitialDataLoaded(true);
          
          // Still try to load the rest
          const remainingDates = [...weekdayDates, ...weekendDates];
          if (remainingDates.length > 0) {
            setPendingDates(remainingDates);
            setIsPreloadingMonth(true);
          }
        });
      } else {
        // No first week dates, load the rest
        const allRemainingDates = [...weekdayDates, ...weekendDates];
        setPendingDates(allRemainingDates);
        setIsPreloadingMonth(true);
      }
    }
  };

  // Legg til denne logikken for å laste inn kun gjeldende måned ved oppstart
  useEffect(() => {
    if (locations.length > 0 && !initialDataLoaded && pendingDates.length === 0 && !isPreloadingMonth) {
      handleMonthChange(new Date());
    }
  }, [locations, initialDataLoaded, pendingDates.length, isPreloadingMonth]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    
    // Scroll to the timeslots section after a short delay to ensure rendering
    setTimeout(() => {
      const timeslotsSection = document.getElementById('available-timeslots');
      if (timeslotsSection) {
        timeslotsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }
    }, 300); // Short delay to ensure the section is rendered
  };

  // Handle timeslot click by showing the confirmation modal
  const handleSlotClick = (time: string, location: VenueLocation | null) => {
    setSelectedTime(time);
    setSelectedLocation(location);
    setShowConfirmation(true);
  };

  // Confirm booking by constructing the booking object and calling createBooking
  const handleBookingConfirm = async () => {
    if (!auth.currentUser && !isGuestBooking) {
      const confirmGuest = window.confirm("Du er ikke logget inn. Vil du fortsette som gjest?");
      if (confirmGuest) {
        setIsGuestBooking(true);
        return;
      } else {
        navigate('/login');
        return;
      }
    }

    if (!selectedDate || !selectedTime || !selectedTreatment || !selectedLocation) {
      alert("Vennligst fyll ut alle detaljer for bookingen.");
      return;
    }

    if (isGuestBooking) {
      if (!guestEmail || !guestName || !guestPhone) {
        alert("Vennligst fyll ut all gjesteinformasjon.");
        return;
      }
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
      customerId: auth.currentUser?.uid || `guest_${Date.now()}`,
      customerEmail: isGuestBooking ? guestEmail : auth.currentUser?.email || '',
      customerName: isGuestBooking ? guestName : auth.currentUser?.displayName || '',
      customerPhone: isGuestBooking ? guestPhone : '',
      date: selectedDate,
      duration,
      location: bookingLocation,
      paymentStatus: false,
      price,
      status: "pending",
      customerMessage: "",
      timeslot: {
        start: startDateTime,
        end: endDateTime,
      },
      treatmentId: selectedTreatment.id,
      isGuestBooking: isGuestBooking
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
      
      <CalendarView 
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        dayInfoCache={dayInfoCache}
        loadingDate={loadingDate}
        onMonthChange={handleMonthChange}
        initialDataLoaded={initialDataLoaded}
      />

      {/* Emergency button to clear the loading overlay */}
      {!initialDataLoaded && (
        <button 
          onClick={() => setInitialDataLoaded(true)}
          style={{ 
            padding: '8px 16px', 
            margin: '10px 0', 
            background: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          Skjul laster-skjerm (manuelt)
        </button>
      )}

      {selectedDate && (
        <>
          <h3 id="available-timeslots">Tilgjengelige tider for {formatDateNorwegian(selectedDate)}</h3>
          {eventDetails ? (
            <p>
              📅 Helene deltar på <strong>{eventDetails['name'] as string}</strong> på {eventDetails['location'] as string}
            </p>
          ) : isLoading ? (
            <div className="timeslots-loading-container">
              <LoadingSpinner />
            </div>
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
                        onClick={() => handleSlotClick(slot, locationSlot.location)}
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
          
          <div className="booking-inputs-container">
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

            {isGuestBooking && (
              <div className="guest-info">
                <h4>Gjesteinformasjon</h4>
                <div>
                  <label>
                    Navn:
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Ditt navn"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    E-post:
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Din e-post"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Telefon:
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="Ditt telefonnummer"
                      required
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button onClick={handleBookingConfirm}>Bekreft booking</button>
            <button onClick={() => {
              setShowConfirmation(false);
              setIsGuestBooking(false);
            }}>Avbryt</button>
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