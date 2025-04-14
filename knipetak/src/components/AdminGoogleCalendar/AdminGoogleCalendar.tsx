import React, { useState, useEffect } from 'react';
import { GoogleCalendarService } from '../../backend/GoogleCalendar/GoogleCalendarService';
import { CalendarEvent, CalendarSyncStatus } from '../../backend/GoogleCalendar/types/calendar';
import './AdminGoogleCalendar.css';

interface Props {
  /** Callback when calendar events are loaded */
  onEventsLoaded?: (events: CalendarEvent[]) => void;
  /** Callback when sync status changes */
  onSyncStatusChange?: (status: CalendarSyncStatus) => void;
  /** Optional initial authorization state */
  initialAuthorized?: boolean;
  /** Calendar IDs to display (defaults to the Oskar Fritzner calendar) */
  calendarIds?: string[];
}

interface SyncDetails {
  created: Array<{ id: string; summary: string; startTime: string; endTime: string }>;
  updated: Array<{ id: string; summary: string; startTime: string; endTime: string }>;
  deleted: Array<{ id: string; summary: string; startTime: string; endTime: string }>;
  cancelled: Array<{ id: string; summary: string; startTime: string; endTime: string }>;
}

const AdminGoogleCalendar: React.FC<Props> = ({ 
  onSyncStatusChange,
  initialAuthorized = false,
  calendarIds = ['5a77682778bf92e3a8a9768cc65117703d84ab71547c94d656b693aa4c5130f6@group.calendar.google.com']
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(initialAuthorized);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus>({
    status: 'idle',
    message: ''
  });
  const [availableCalendars, setAvailableCalendars] = useState<Array<{id: string, summary: string}>>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(calendarIds[0]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [syncDetails, setSyncDetails] = useState<SyncDetails | null>(null);
  const [showSyncDetails, setShowSyncDetails] = useState(false);

  useEffect(() => {
    onSyncStatusChange?.(syncStatus);
  }, [syncStatus, onSyncStatusChange]);

  const initializeCalendar = async () => {
    setIsLoading(true);
    setError(null);
    setSyncStatus({ status: 'syncing', message: 'Initialiserer kalender...' });
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!apiKey || !clientId) {
        throw new Error('Google Calendar credentials missing');
      }

      const service = GoogleCalendarService.getInstance(apiKey, clientId);
      await service.initialize();
      
      // Bruk 'full' scope for å sikre at vi har tilgang til å opprette events
      const authorized = await service.authorize('full');
      
      if (authorized) {
        // Hent tilgjengelige kalendere
        const calendars = await service.getAvailableCalendars();
        setAvailableCalendars(calendars);
        
        // Velg første kalender som standard hvis ingen er valgt
        if (!selectedCalendarId && calendars.length > 0) {
          setSelectedCalendarId(calendars[0].id);
        }
        
        setIsAuthorized(true);
        setSyncStatus({ status: 'success', message: 'Kalender initialisert' });
      } else {
        throw new Error('Kunne ikke autorisere Google Calendar');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize calendar';
      setError(errorMessage);
      setSyncStatus({ status: 'error', message: errorMessage });
      console.error('Calendar initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    setIsLoading(true);
    setError(null);
    setSyncStatus({ status: 'syncing', message: 'Synkroniserer med Google Calendar...' });
    setSyncDetails(null);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!apiKey || !clientId) {
        throw new Error('Google Calendar credentials missing');
      }

      const service = GoogleCalendarService.getInstance(apiKey, clientId);
      await service.initialize();
      
      // Sjekk at vi har full tilgang
      const authorized = await service.authorize('full');
      if (!authorized) {
        throw new Error('Mangler nødvendig tilgang til Google Calendar');
      }
      
      // Bruk valgt kalender
      const result = await service.syncExistingBookings(selectedCalendarId);
      setSyncDetails(result.details);
      
      const message = [
        result.created > 0 ? `${result.created} nye bookinger lagt til` : null,
        result.updated > 0 ? `${result.updated} bookinger oppdatert` : null,
        result.deleted > 0 ? `${result.deleted} duplikate bookinger fjernet` : null,
        result.cancelled > 0 ? `${result.cancelled} kansellerte bookinger fjernet` : null
      ].filter(Boolean).join(', ') || 'Ingen endringer';

      setSyncStatus({ 
        status: 'success', 
        message: message
      });
      
      // Oppdater refresh key for å tvinge iframe til å laste på nytt
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with Google Calendar';
      setError(errorMessage);
      setSyncStatus({ status: 'error', message: errorMessage });
      console.error('Sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-calendar-container">
      <div className="admin-calendar-controls">
        {!isAuthorized ? (
          <button
            onClick={initializeCalendar}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Kobler til...' : 'Koble til Google Kalender'}
          </button>
        ) : (
          <div className="flex flex-col gap-6">
            {availableCalendars.length > 0 && (
              <div className="calendar-selector">
                <label htmlFor="calendar-select">
                  Velg kalender:
                </label>
                <select
                  id="calendar-select"
                  value={selectedCalendarId}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
                >
                  {availableCalendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.summary}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              onClick={handleSyncGoogleCalendar}
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Synkroniserer...' : 'Synkroniser med Google Kalender'}
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {syncStatus.message && (
          <div className={`sync-status ${syncStatus.status}`}>
            {syncStatus.message}
            {syncDetails && (
              <button 
                className="toggle-details-btn"
                onClick={() => setShowSyncDetails(!showSyncDetails)}
              >
                {showSyncDetails ? 'Skjul detaljer' : 'Vis detaljer'}
              </button>
            )}
          </div>
        )}

        {syncDetails && showSyncDetails && (
          <div className="sync-details">
            {syncDetails.created.length > 0 && (
              <div className="sync-details-section">
                <h3>Nye bookinger lagt til:</h3>
                <ul>
                  {syncDetails.created.map(item => (
                    <li key={item.id}>
                      <div className="booking-summary">{item.summary}</div>
                      <div className="booking-time">
                        <span className="time-label">Fra:</span> {item.startTime}
                        <br />
                        <span className="time-label">Til:</span> {item.endTime}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {syncDetails.updated.length > 0 && (
              <div className="sync-details-section">
                <h3>Oppdaterte bookinger:</h3>
                <ul>
                  {syncDetails.updated.map(item => (
                    <li key={item.id}>
                      <div className="booking-summary">{item.summary}</div>
                      <div className="booking-time">
                        <span className="time-label">Fra:</span> {item.startTime}
                        <br />
                        <span className="time-label">Til:</span> {item.endTime}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {syncDetails.deleted.length > 0 && (
              <div className="sync-details-section">
                <h3>Fjernede duplikate bookinger:</h3>
                <ul>
                  {syncDetails.deleted.map(item => (
                    <li key={item.id}>
                      <div className="booking-summary">{item.summary}</div>
                      <div className="booking-time">
                        <span className="time-label">Fra:</span> {item.startTime}
                        <br />
                        <span className="time-label">Til:</span> {item.endTime}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {syncDetails.cancelled.length > 0 && (
              <div className="sync-details-section cancelled-section">
                <h3>Kansellerte bookinger fjernet:</h3>
                <ul>
                  {syncDetails.cancelled.map(item => (
                    <li key={item.id}>
                      <div className="booking-summary">{item.summary}</div>
                      <div className="booking-time">
                        <span className="time-label">Fra:</span> {item.startTime}
                        <br />
                        <span className="time-label">Til:</span> {item.endTime}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {isAuthorized && (
        <div className="calendar-iframe-container">
          <iframe
            key={refreshKey}
            src={`https://calendar.google.com/calendar/embed?src=${selectedCalendarId}&ctz=Europe%2FOslo`}
            style={{ border: 0 }}
            width="100%"
            height="600"
            frameBorder="0"
            scrolling="no"
            title="Google Calendar"
          />
        </div>
      )}
    </div>
  );
};

export default AdminGoogleCalendar; 