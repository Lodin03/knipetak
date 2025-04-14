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
}

const AdminGoogleCalendar: React.FC<Props> = ({ 
  onEventsLoaded, 
  onSyncStatusChange,
  initialAuthorized = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(initialAuthorized);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus>({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    onSyncStatusChange?.(syncStatus);
  }, [syncStatus, onSyncStatusChange]);

  const initializeCalendar = async () => {
    setIsLoading(true);
    setError(null);
    setSyncStatus({ status: 'syncing', message: 'Initializing calendar...' });
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!apiKey || !clientId) {
        throw new Error('Google Calendar credentials missing');
      }

      const service = GoogleCalendarService.getInstance(apiKey, clientId);
      await service.initialize();
      const authorized = await service.authorize('full');
      
      if (authorized) {
        setIsAuthorized(true);
        const events = await service.fetchUpcomingEvents(50);
        onEventsLoaded?.(events);
        setSyncStatus({ status: 'success', message: 'Calendar initialized successfully' });
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
    setSyncStatus({ status: 'syncing', message: 'Syncing with Google Calendar...' });

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!apiKey || !clientId) {
        throw new Error('Google Calendar credentials missing');
      }

      const service = GoogleCalendarService.getInstance(apiKey, clientId);
      await service.initialize();
      await service.authorize('full');
      
      const count = await service.syncExistingBookings();
      setSyncStatus({ 
        status: 'success', 
        message: `Successfully synced ${count} bookings`,
        count 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with Google Calendar';
      setError(errorMessage);
      setSyncStatus({ status: 'error', message: errorMessage });
      console.error('Sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsLoading(true);
    setError(null);
    setSyncStatus({ status: 'syncing', message: 'Cleaning up duplicate events...' });

    try {
      if (!window.calendarService) {
        throw new Error('Calendar service not initialized');
      }
      
      const count = await window.calendarService.cleanupDuplicateEvents();
      setSyncStatus({ 
        status: 'success', 
        message: `Successfully removed ${count} duplicate events`,
        count 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clean up duplicates';
      setError(errorMessage);
      setSyncStatus({ status: 'error', message: errorMessage });
      console.error('Cleanup error:', error);
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
          <div className="flex gap-4">
            <button
              onClick={handleSyncGoogleCalendar}
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Synkroniserer...' : 'Synkroniser med Google Kalender'}
            </button>
            <button
              onClick={handleCleanupDuplicates}
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Rydder opp...' : 'Fjern duplikater'}
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
          </div>
        )}
      </div>

      {isAuthorized && (
        <div className="calendar-iframe-container">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=primary"
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