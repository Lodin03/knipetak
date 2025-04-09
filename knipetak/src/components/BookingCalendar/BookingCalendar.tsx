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
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval 
} from 'date-fns';

// Import our new components
import CalendarView from "./components/CalenderView/CalendarView";
import BookingSlotsPerDay from "./components/BookingSlotsPerDay/BookingSlotsPerDay";
import BookingForm from "./components/BookingForm/BookingForm";
import CompletedBookingComponent from "./components/CompletedBooking/CompletedBooking";

// Register Norwegian locale
registerLocale('nb', nb);

// Helper function to format date as YYYY-MM-DD
function formatDateForAPI(date: Date): string {
  return date.toLocaleDateString('sv-SE'); // Using Swedish locale which gives us YYYY-MM-DD format
}

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
  // Add this state to track if user has explicitly selected a date
  const [dateManuallySelected, setDateManuallySelected] = useState(false);
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
        
        console.log(`Loaded ${treatmentsData.length} treatments and ${locationsData.length} locations`);
        setTreatments(treatmentsData);
        setLocations(locationsData);
        
        // Once the core data is loaded, preload the current month
        // Use a local date variable for preloading, don't update selectedDate
        const today = new Date();
        const dayInfo = await fetchAvailabilityForDate(today);
        console.log('Preloaded today:', dayInfo);
        
        // Start preloading the rest of the month
        handleMonthChange(today);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch availability for a specific date
  const fetchAvailabilityForDate = async (date: Date) => {
    const dateStr = formatDateForAPI(date);
    console.log(`Fetching availability for ${dateStr}`);
    
    // Check if already fetching this date
    if (fetchingDates.current.has(dateStr)) {
      console.log(`Already fetching data for ${dateStr}, skipping`);
      return null;
    }
    fetchingDates.current.add(dateStr);
    
    // If requesting the current loading date, update the loading state
    if (dateStr === loadingDate) {
      setLoadingDate(dateStr);
    }
    
    try {
      const result = await getAvailableSlotsByDate(dateStr);
      
      if (!result) {
        console.log(`No result for ${dateStr}`);
        // Cache negative result so we don't try to fetch it again
        const emptyResult = {
          locationSlots: [],
          eventDetails: null
        };
        setDayInfoCache(prev => ({
          ...prev,
          [dateStr]: emptyResult
        }));
        return emptyResult;
      }
      
      console.log(`Got availability for ${dateStr}:`, 
                 result.availabilityByLocation.length > 0 
                 ? `${result.availabilityByLocation.length} locations` 
                 : 'No locations');
      
      if (result.eventDetails) {
        console.log(`Event for ${dateStr}:`, result.eventDetails);
      }

      // Convert availability data to match our expected interface
      const convertedLocationSlots: LocationSlots[] = result.availabilityByLocation.map(slot => {
        // Find the location by ID if it's a string
        let locationObj: VenueLocation | null = null;
        if (typeof slot.location === 'string') {
          locationObj = locations.find(loc => loc.id === slot.location) || null;
        } else {
          locationObj = slot.location;
        }

        return {
          location: locationObj,
          workHours: {
            start: typeof slot.workHours.start === 'string' 
              ? slot.workHours.start 
              : '00:00',
            end: typeof slot.workHours.end === 'string' 
              ? slot.workHours.end 
              : '00:00'
          },
          availableSlots: slot.availableSlots
        };
      });
      
      const dayInfo = {
        locationSlots: convertedLocationSlots,
        eventDetails: result.eventDetails
      };
      
      // Cache results for reuse
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
    
    console.log(`Generated ${datesToLoad.length} dates to preload`);
    
    if (datesToLoad.length === 0) {
      // Nothing to preload, we can just show the data we have
      setInitialDataLoaded(true);
      return;
    }
    
    // Start the preloading process
    setPendingDates(datesToLoad);
    setIsPreloadingMonth(true);
  };

  // Handle date selection to fetch slot data
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedLocation(null);
    // Set this to true when a date is manually selected
    setDateManuallySelected(true);
    
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

  // Handle timeslot click to select time and location
  const handleSlotClick = (time: string, location: VenueLocation | null) => {
    setSelectedTime(time);
    setSelectedLocation(location);
    
    // Scroll to booking form after a short delay
    setTimeout(() => {
      const bookingForm = document.getElementById('booking-form');
      if (bookingForm) {
        bookingForm.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }
    }, 300);
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
    
    // Navigate to homepage
    navigate('/');
  };

  const handleCancelBooking = () => {
    setSelectedTime(null);
    setSelectedLocation(null);
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

      {selectedDate && dateManuallySelected && (
        <BookingSlotsPerDay
          selectedDate={selectedDate}
          isLoading={isLoading}
          locationSlots={locationSlots}
          eventDetails={eventDetails}
          onSlotClick={handleSlotClick}
          selectedTime={selectedTime}
        />
      )}

      {selectedTime && selectedLocation && (
        <div id="booking-form">
          <BookingForm
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedLocation={selectedLocation}
            treatments={treatments}
            onConfirm={handleBookingConfirm}
            isGroupBooking={isGroupBooking}
            setIsGroupBooking={setIsGroupBooking}
            groupSize={groupSize}
            setGroupSize={setGroupSize}
            selectedTreatment={selectedTreatment}
            setSelectedTreatment={setSelectedTreatment}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
            address={address}
            setAddress={setAddress}
            city={city}
            setCity={setCity}
            postalCode={postalCode}
            setPostalCode={setPostalCode}
            isGuestBooking={isGuestBooking}
            guestEmail={guestEmail}
            setGuestEmail={setGuestEmail}
            guestName={guestName}
            setGuestName={setGuestName}
            guestPhone={guestPhone}
            setGuestPhone={setGuestPhone}
            onCancel={handleCancelBooking}
          />
        </div>
      )}

      {showCompletedBooking && selectedDate && selectedTime && selectedTreatment && (
        <CompletedBookingComponent
          bookingId={completedBookingId}
          date={selectedDate}
          time={selectedTime}
          treatment={selectedTreatment}
          duration={selectedDuration || 0}
          isGroup={isGroupBooking}
          groupSize={groupSize}
          location={{
            address,
            city,
            postalCode: Number(postalCode)
          }}
          onClose={handleCloseCompletedBooking}
        />
      )}
    </div>
  );
};

export default BookingCalendar;