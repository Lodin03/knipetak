interface Window {
  gapi: any;
  google: any;
  tokenClient: any;
  calendarService: {
    syncExistingBookings: () => Promise<number>;
    cleanupDuplicateEvents: () => Promise<number>;
    removeBookingEvent: (bookingId: string, eventId: string) => Promise<void>;
    authorizeCalendar: () => Promise<boolean>;
  };
}
