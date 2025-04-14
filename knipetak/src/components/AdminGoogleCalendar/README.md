# Admin Google Calendar Integration

This implementation provides a simplified Google Calendar integration specifically for the admin calendar page. It allows Helene to:

1. View her Google Calendar events in the admin calendar
2. Sync Firebase bookings with her Google Calendar

## Components

### AdminGoogleCalendar

A simple component that provides:

- Google Calendar authorization
- Calendar sync functionality
- Loading and error states

## Setup

1. Ensure these environment variables are set:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_API_KEY=your_api_key
```

2. Add the component to AdminCalendarPage:

```tsx
import AdminGoogleCalendar from "@/components/AdminGoogleCalendar/AdminGoogleCalendar";

// Inside your AdminCalendarPage component:
<AdminGoogleCalendar onEventsLoaded={handleCalendarEvents} />;
```

## Usage

1. Click "Koble til Google Kalender" to authorize access
2. Once authorized, click "Synkroniser med Google Kalender" to sync Firebase bookings

## Error Handling

The component handles common errors:

- Missing credentials
- Authorization failures
- Sync failures

## Security

- Only accessible on the admin page
- Uses OAuth 2.0 for secure authorization
- Credentials stored in environment variables
