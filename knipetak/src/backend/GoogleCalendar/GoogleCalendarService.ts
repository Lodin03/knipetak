import { CalendarEvent } from "./types/calendar";
import {
  GoogleCalendarError,
  handleGoogleCalendarError,
} from "./utils/errorHandling";

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

    await window.gapi.load("client", () => {
      window.gapi.client.init({
        apiKey: this.apiKey,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
      });
    });
  }

  private loadSavedToken(): void {
    try {
      const savedToken = localStorage.getItem(
        GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY
      );
      if (savedToken) {
        this.accessToken = savedToken;
        if (window.gapi?.client) {
          window.gapi.client.setToken({ access_token: savedToken });
        }
      }
    } catch (error) {
      console.warn("Error loading saved token:", error);
    }
  }

  private saveToken(token: string): void {
    try {
      localStorage.setItem(
        GoogleCalendarService.LOCAL_STORAGE_TOKEN_KEY,
        token
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

    const scopes = {
      readonly: "https://www.googleapis.com/auth/calendar.readonly",
      events: "https://www.googleapis.com/auth/calendar.events",
      full: "https://www.googleapis.com/auth/calendar",
    };

    return new Promise((resolve) => {
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: scopes[scope],
        callback: (response: { error?: string }) => {
          if (response.error) {
            resolve(false);
            return;
          }
          this.accessToken =
            window.gapi?.client?.getToken()?.access_token || null;
          if (this.accessToken) {
            this.saveToken(this.accessToken);
          }
          resolve(true);
        },
      });

      window.tokenClient.requestAccessToken({ prompt: "consent" });
    });
  }

  async fetchUpcomingEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
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

  async createEvent(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: "primary",
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

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: "primary",
        eventId,
      });
    } catch (error) {
      handleGoogleCalendarError(error, "Deleting event");
      throw error;
    }
  }

  async syncExistingBookings(): Promise<number> {
    if (!this.isInitialized || !this.accessToken) {
      throw new GoogleCalendarError(
        "Service not initialized or not authorized"
      );
    }

    try {
      const events = await this.fetchUpcomingEvents(100);
      return events.length;
    } catch (error) {
      handleGoogleCalendarError(error, "Syncing existing bookings");
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
