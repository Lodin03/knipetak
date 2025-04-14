import { CalendarEvent } from "./types/calendar";
import {
  GoogleCalendarError,
  handleGoogleCalendarError,
} from "./utils/errorHandling";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  cancelled: number;
  details: {
    created: Array<{
      id: string;
      summary: string;
      startTime: string;
      endTime: string;
    }>;
    updated: Array<{
      id: string;
      summary: string;
      startTime: string;
      endTime: string;
    }>;
    deleted: Array<{
      id: string;
      summary: string;
      startTime: string;
      endTime: string;
    }>;
    cancelled: Array<{
      id: string;
      summary: string;
      startTime: string;
      endTime: string;
    }>;
  };
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
}

interface GoogleCalendarErrorResponse {
  status?: number;
  message?: string;
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private isInitialized = false;
  private isGapiLoaded = false;
  private isGisLoaded = false;
  private accessToken: string | null = null;
  private static LOCAL_STORAGE_TOKEN_KEY = "google_calendar_permanent_token";

  private constructor(
    private readonly apiKey: string,
    private readonly clientId: string
  ) {}

  static getInstance(apiKey: string, clientId: string): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService(
        apiKey,
        clientId
      );
    }
    return GoogleCalendarService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await this.loadGapiScript();
      await this.loadGisScript();
      await this.initializeGapiClient();
      this.loadSavedToken();
      this.isInitialized = true;
      return true;
    } catch (error) {
      handleGoogleCalendarError(error, "Service initialization");
      return false;
    }
  }

  private async loadGapiScript(): Promise<void> {
    if (this.isGapiLoaded) return;

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isGapiLoaded = true;
        resolve();
      };
      script.onerror = () =>
        reject(new Error("Failed to load Google API script"));
      document.body.appendChild(script);
    });
  }

  private async loadGisScript(): Promise<void> {
    if (this.isGisLoaded) return;

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isGisLoaded = true;
        resolve();
      };
      script.onerror = () =>
        reject(new Error("Failed to load Google Identity Services"));
      document.body.appendChild(script);
    });
  }

  private async initializeGapiClient(): Promise<void> {
    if (!window.gapi) {
      throw new GoogleCalendarError("Google API not loaded");
    }

    try {
      await new Promise<void>((resolve, reject) => {
        window.gapi.load("client", async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.apiKey,
              discoveryDocs: [
                "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
              ],
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      throw new GoogleCalendarError(
        `Failed to initialize Google API client: ${error}`
      );
    }
  }

  private loadSavedToken(): void {
    try {
      const savedToken = localStorage.getItem(
        GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY
      );
      if (savedToken) {
        try {
          // Prøv å parse som JSON først
          const tokenData = JSON.parse(savedToken);
          if (tokenData.expires_at > Date.now()) {
            this.accessToken = tokenData.access_token;
            if (window.gapi?.client) {
              window.gapi.client.setToken({
                access_token: tokenData.access_token,
              });
            }
          } else {
            localStorage.removeItem(
              GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY
            );
          }
        } catch {
          // Hvis det ikke er JSON, bruk det direkte som token
          this.accessToken = savedToken;
          if (window.gapi?.client) {
            window.gapi.client.setToken({ access_token: savedToken });
          }
        }
      }
    } catch (error) {
      console.warn("Error loading saved token:", error);
    }
  }

  private saveToken(token: string, expiresIn: number): void {
    try {
      const tokenData = {
        access_token: token,
        expires_at: Date.now() + expiresIn * 1000, // Konverter sekunder til millisekunder
      };
      localStorage.setItem(
        GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY,
        JSON.stringify(tokenData)
      );
    } catch (error) {
      console.warn("Error saving token:", error);
    }
  }

  async authorize(
    scope: "readonly" | "events" | "full" = "readonly"
  ): Promise<boolean> {
    if (!window.google?.accounts?.oauth2) {
      throw new GoogleCalendarError("Google Identity Services not loaded");
    }

    try {
      // Fjern eksisterende token før ny autorisering
      this.accessToken = null;
      localStorage.removeItem(GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY);

      const scopes = {
        readonly: "https://www.googleapis.com/auth/calendar.readonly",
        events: "https://www.googleapis.com/auth/calendar.events",
        full: "https://www.googleapis.com/auth/calendar",
      };

      console.log("Requesting authorization with scope:", scopes[scope]);

      return new Promise((resolve) => {
        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: scopes[scope],
          callback: (response: {
            error?: string;
            access_token?: string;
            expires_in?: number;
          }) => {
            if (response.error) {
              console.error("Authorization error:", response.error);
              resolve(false);
              return;
            }

            if (response.access_token) {
              console.log("Successfully authorized with access token");
              this.accessToken = response.access_token;

              // Lagre token med utløpsdato hvis vi har expires_in
              if (response.expires_in) {
                const tokenData = {
                  access_token: response.access_token,
                  expires_at: Date.now() + response.expires_in * 1000,
                };
                localStorage.setItem(
                  GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY,
                  JSON.stringify(tokenData)
                );
              } else {
                // Ellers lagre bare tokenet
                localStorage.setItem(
                  GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY,
                  response.access_token
                );
              }

              // Sett token i gapi client
              if (window.gapi?.client) {
                window.gapi.client.setToken({
                  access_token: response.access_token,
                });
              }
            }

            resolve(true);
          },
        });

        // Be alltid om consent for å sikre at vi får et nytt token
        window.tokenClient.requestAccessToken({ prompt: "consent" });
      });
    } catch (error) {
      console.error("Authorization error:", error);
      return false;
    }
  }

  private async ensureCalendarApiLoaded(): Promise<void> {
    if (!window.gapi?.client?.calendar) {
      try {
        await this.initializeGapiClient();
        // Wait a short moment to ensure calendar API is fully loaded
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!window.gapi?.client?.calendar) {
          throw new GoogleCalendarError("Calendar API failed to load");
        }
      } catch (error) {
        throw new GoogleCalendarError(`Failed to load Calendar API: ${error}`);
      }
    }
  }

  private async ensureAuthorized(): Promise<void> {
    if (!this.accessToken) {
      console.log("No access token found, requesting authorization...");
      const authorized = await this.authorize("full");
      if (!authorized) {
        throw new GoogleCalendarError(
          "Failed to authorize with Google Calendar"
        );
      }
    } else {
      console.log("Using existing access token");
      // Check if token is still valid
      try {
        // Try to fetch calendar list with minimal data
        await window.gapi.client.calendar.calendarList.list({
          maxResults: 1,
          fields: "items(id)",
        });
      } catch (error) {
        console.log("Token validation failed:", error);
        // Remove invalid token
        this.accessToken = null;
        localStorage.removeItem(GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY);

        // Request new authorization
        console.log("Requesting new authorization...");
        const authorized = await this.authorize("full");
        if (!authorized) {
          throw new GoogleCalendarError(
            "Failed to reauthorize with Google Calendar"
          );
        }
      }
    }
  }

  async fetchUpcomingEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
      await this.ensureCalendarApiLoaded();
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults,
        orderBy: "startTime",
      });

      return (response.result.items || []).map((item) => ({
        id: item.id as string,
        summary: item.summary as string,
        description: item.description as string,
        start: item.start as { dateTime: string; timeZone: string },
        end: item.end as { dateTime: string; timeZone: string },
        location: item.location as string,
        status: item.status as string,
        attendees: item.attendees as Array<{
          email: string;
          displayName?: string;
        }>,
      }));
    } catch (error) {
      handleGoogleCalendarError(error, "Fetching events");
      return [];
    }
  }

  async createEvent(
    event: Omit<CalendarEvent, "id">,
    calendarId: string = "primary"
  ): Promise<CalendarEvent> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
      await this.ensureCalendarApiLoaded();
      const response = await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: event,
      });

      const result = response.result;
      return {
        id: result.id as string,
        summary: result.summary as string,
        description: result.description as string,
        start: result.start as { dateTime: string; timeZone: string },
        end: result.end as { dateTime: string; timeZone: string },
        location: result.location as string,
        status: result.status as string,
        attendees: result.attendees as Array<{
          email: string;
          displayName?: string;
        }>,
      };
    } catch (error) {
      handleGoogleCalendarError(error, "Creating event");
      throw error;
    }
  }

  async updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
      await this.ensureCalendarApiLoaded();

      // First, try to get the event to verify it exists
      try {
        await window.gapi.client.calendar.events.get({
          calendarId: "primary",
          eventId: eventId,
        });
      } catch (error: unknown) {
        const calendarError = error as GoogleCalendarErrorResponse;
        // If event doesn't exist (404), create a new one
        if (calendarError.status === 404) {
          console.log(`Event ${eventId} not found, creating new event`);
          const newEvent = await this.createEvent(
            event as Omit<CalendarEvent, "id">
          );
          return newEvent;
        }
        throw error;
      }

      // If event exists, update it
      const response = await window.gapi.client.calendar.events.update({
        calendarId: "primary",
        eventId,
        resource: event,
      });

      const result = response.result;
      return {
        id: result.id as string,
        summary: result.summary as string,
        description: result.description as string,
        start: result.start as { dateTime: string; timeZone: string },
        end: result.end as { dateTime: string; timeZone: string },
        location: result.location as string,
        status: result.status as string,
        attendees: result.attendees as Array<{
          email: string;
          displayName?: string;
        }>,
      };
    } catch (error) {
      handleGoogleCalendarError(error, "Updating event");
      throw error;
    }
  }

  async deleteEvent(
    eventId: string,
    calendarId: string = "primary"
  ): Promise<void> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
      await this.ensureCalendarApiLoaded();
      await window.gapi.client.calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      handleGoogleCalendarError(error, "Deleting event");
      throw error;
    }
  }

  async getAvailableCalendars(): Promise<
    Array<{ id: string; summary: string }>
  > {
    if (!this.isInitialized) {
      throw new GoogleCalendarError("Service not initialized");
    }

    try {
      await this.ensureCalendarApiLoaded();
      await this.ensureAuthorized();

      const response = await window.gapi.client.calendar.calendarList.list();

      if (!response.result?.items) {
        return [];
      }

      return response.result.items
        .filter((calendar) => calendar.id && calendar.summary)
        .map((calendar) => ({
          id: calendar.id!,
          summary: calendar.summary!,
        }));
    } catch (error) {
      handleGoogleCalendarError(error, "Fetching available calendars");
      throw error;
    }
  }

  async cleanupDuplicateEvents(calendarId?: string): Promise<number> {
    if (!this.isInitialized) {
      throw new GoogleCalendarError("Service not initialized");
    }

    try {
      await this.ensureCalendarApiLoaded();
      await this.ensureAuthorized();

      const targetCalendarId = calendarId || "primary";

      // Get all events from the calendar
      const response = await window.gapi.client.calendar.events.list({
        calendarId: targetCalendarId,
        timeMin: new Date().toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = (response.result.items ||
        []) as unknown as GoogleCalendarEvent[];
      console.log(`Found ${events.length} events in calendar`);

      // Create a map to track unique events
      const uniqueEvents = new Map<string, GoogleCalendarEvent>();
      let duplicatesRemoved = 0;

      // Process each event
      for (const event of events) {
        if (!event.summary || !event.start?.dateTime || !event.end?.dateTime) {
          continue;
        }

        // Create a unique key based on event properties
        const eventKey = `${event.summary}_${event.start.dateTime}_${
          event.end.dateTime
        }_${event.description || ""}`;

        if (uniqueEvents.has(eventKey)) {
          // This is a duplicate, delete it
          try {
            await this.deleteEvent(event.id, targetCalendarId);
            duplicatesRemoved++;
            console.log(
              `Removed duplicate event: ${event.summary} at ${event.start.dateTime}`
            );
          } catch (error) {
            const calendarError = error as GoogleCalendarErrorResponse;
            if (calendarError.status === 410) {
              console.log(`Event ${event.id} already deleted`);
              continue;
            }
            console.warn(
              `Failed to delete duplicate event ${event.id}:`,
              error
            );
          }
        } else {
          // This is the first occurrence of this event
          uniqueEvents.set(eventKey, event);
        }
      }

      console.log(`Removed ${duplicatesRemoved} duplicate events`);
      return duplicatesRemoved;
    } catch (error) {
      handleGoogleCalendarError(error, "Cleaning up duplicate events");
      throw error;
    }
  }

  async syncExistingBookings(calendarId?: string): Promise<SyncResult> {
    if (!this.isInitialized) {
      throw new GoogleCalendarError("Service not initialized");
    }

    try {
      await this.ensureCalendarApiLoaded();
      await this.ensureAuthorized();

      const result: SyncResult = {
        created: 0,
        updated: 0,
        deleted: 0,
        cancelled: 0,
        details: {
          created: [],
          updated: [],
          deleted: [],
          cancelled: [],
        },
      };

      const targetCalendarId = calendarId || "primary";

      // First clean up duplicates and cancelled events
      const duplicatesRemoved = await this.cleanupDuplicateEvents(calendarId);
      result.deleted = duplicatesRemoved;
      console.log(`Removed ${duplicatesRemoved} duplicate events`);

      // Get all bookings from Firebase
      const bookingsRef = collection(db, "bookings");
      const bookingsSnapshot = await getDocs(bookingsRef);
      console.log("Found bookings in Firebase:", bookingsSnapshot.size);

      // Process each booking
      for (const doc of bookingsSnapshot.docs) {
        const booking = doc.data();
        console.log("Processing booking:", booking);

        // Skip if no valid timeslot
        if (!booking.timeslot?.start || !booking.timeslot?.end) {
          console.warn(`Booking ${doc.id} missing timeslot`);
          continue;
        }

        const startTime = booking.timeslot.start.toDate
          ? booking.timeslot.start.toDate()
          : new Date(booking.timeslot.start);
        const endTime = booking.timeslot.end.toDate
          ? booking.timeslot.end.toDate()
          : new Date(booking.timeslot.end);

        // Handle cancelled bookings
        if (booking.status === "cancelled") {
          const calendarEventIds = booking.calendarEventIds || {};
          const existingEventId = calendarEventIds[targetCalendarId];

          if (existingEventId) {
            try {
              await this.deleteEvent(existingEventId, targetCalendarId);
              result.cancelled++;
              result.details.cancelled.push({
                id: doc.id,
                summary: `Booking: ${
                  booking.customerName || "Unknown customer"
                }`,
                startTime: startTime.toLocaleString("nb-NO", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                endTime: endTime.toLocaleString("nb-NO", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });

              // Remove event ID from booking
              await updateDoc(doc.ref, {
                calendarEventIds: {
                  ...calendarEventIds,
                  [targetCalendarId]: null,
                },
              });
            } catch (error) {
              const calendarError = error as GoogleCalendarErrorResponse;
              if (calendarError.status === 410) {
                console.log(`Event ${existingEventId} already deleted`);
                continue;
              }
              console.warn(
                `Failed to delete cancelled event ${existingEventId}:`,
                error
              );
            }
          }
          continue;
        }

        const event: Omit<CalendarEvent, "id"> = {
          summary: `Booking: ${booking.customerName || "Unknown customer"}`,
          description: `Customer: ${
            booking.customerName || "Unknown"
          }\nPhone: ${booking.customerPhone || "Not provided"}\nEmail: ${
            booking.customerEmail || "Not provided"
          }\nTreatment: ${booking.treatmentId || "Unknown"}\nStatus: ${
            booking.status || "Unknown"
          }`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "Europe/Oslo",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "Europe/Oslo",
          },
          location:
            typeof booking.location === "string"
              ? booking.location
              : "Knipetak",
          status: "confirmed",
        };

        try {
          const calendarEventIds = booking.calendarEventIds || {};
          const existingEventId = calendarEventIds[targetCalendarId];

          if (existingEventId) {
            try {
              // Try to update existing event
              await this.updateEvent(existingEventId, event);
              result.updated++;
              result.details.updated.push({
                id: doc.id,
                summary: event.summary,
                startTime: startTime.toLocaleString("nb-NO", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                endTime: endTime.toLocaleString("nb-NO", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });
            } catch (error) {
              const calendarError = error as GoogleCalendarErrorResponse;
              if (calendarError.status === 404) {
                // If update fails with 404, create new event
                const newEvent = await this.createEvent(
                  event,
                  targetCalendarId
                );
                result.created++;
                result.details.created.push({
                  id: doc.id,
                  summary: event.summary,
                  startTime: startTime.toLocaleString("nb-NO", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  endTime: endTime.toLocaleString("nb-NO", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                });

                // Update booking with new event ID
                await updateDoc(doc.ref, {
                  calendarEventIds: {
                    ...calendarEventIds,
                    [targetCalendarId]: newEvent.id,
                  },
                });
              } else {
                console.warn(
                  `Failed to update event ${existingEventId}:`,
                  error
                );
              }
            }
          } else {
            // Create new event
            const newEvent = await this.createEvent(event, targetCalendarId);
            result.created++;
            result.details.created.push({
              id: doc.id,
              summary: event.summary,
              startTime: startTime.toLocaleString("nb-NO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
              endTime: endTime.toLocaleString("nb-NO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
            });

            // Update booking with new event ID
            await updateDoc(doc.ref, {
              calendarEventIds: {
                ...calendarEventIds,
                [targetCalendarId]: newEvent.id,
              },
            });
          }
        } catch (error) {
          console.error(
            "Failed to sync calendar event for booking:",
            doc.id,
            error
          );
        }
      }

      console.log("Sync result:", result);
      return result;
    } catch (error) {
      handleGoogleCalendarError(error, "Syncing existing bookings");
      throw error;
    }
  }

  async removeBookingEvent(
    bookingId: string,
    eventId: string,
    calendarId: string
  ): Promise<void> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
      await this.ensureCalendarApiLoaded();

      // Slett event fra Google Calendar
      await this.deleteEvent(eventId, calendarId);

      // Oppdater booking i Firebase for å fjerne calendarEventId for den spesifikke kalenderen
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);

      if (bookingDoc.exists()) {
        const booking = bookingDoc.data();
        const calendarEventIds = booking.calendarEventIds || {};

        await updateDoc(bookingRef, {
          calendarEventIds: {
            ...calendarEventIds,
            [calendarId]: null,
          },
        });
      }
    } catch (error) {
      handleGoogleCalendarError(error, "Removing booking event");
      throw error;
    }
  }

  signOut(): void {
    const token = window.gapi?.client?.getToken();
    if (token) {
      window.google?.accounts?.oauth2?.revoke(token.access_token, () => {
        window.gapi.client.setToken(null);
        this.accessToken = null;
        localStorage.removeItem(GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY);
      });
    }
  }
}
