import React, { useState } from "react";

interface AdminGoogleCalendarProps {
  onCalendarConnected?: (isConnected: boolean) => void;
}

const AdminGoogleCalendar: React.FC<AdminGoogleCalendarProps> = ({
  onCalendarConnected,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCalendars, setAvailableCalendars] = useState<Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("primary");

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await window.calendarService.authorizeCalendar();
      if (success) {
        const calendars = await window.calendarService.getAvailableCalendars();
        setAvailableCalendars(calendars);
        setIsConnected(true);
        onCalendarConnected?.(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Google Calendar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await window.calendarService.syncExistingBookings(selectedCalendar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync bookings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Google Calendar Integration</h2>
          <p className="text-sm text-gray-500">
            {isConnected
              ? "Connected to Google Calendar"
              : "Connect your Google Calendar to sync bookings"}
          </p>
        </div>
        {!isConnected && (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Connecting..." : "Connect Calendar"}
          </button>
        )}
      </div>

      {isConnected && (
        <div className="space-y-4">
          <div>
            <label htmlFor="calendar" className="block text-sm font-medium text-gray-700">
              Select Calendar
            </label>
            <select
              id="calendar"
              value={selectedCalendar}
              onChange={(e) => setSelectedCalendar(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {availableCalendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSyncBookings}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? "Syncing..." : "Sync Bookings"}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default AdminGoogleCalendar; 