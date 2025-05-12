// Application configuration

// API endpoints
export const API_BASE_URL = 'http://localhost:8000/api';

// Polling intervals (in milliseconds)
export const CHECK_CALLS_INTERVAL = 3000; // 3 seconds
export const STATUS_REFRESH_INTERVAL = 5000; // 5 seconds

// Feature flags
export const ENABLE_PREDICTIVE_DIALING = true;
export const ENABLE_MANUAL_DIALING = true;
export const ENABLE_CALL_RECORDING = true;

// Call status options
export const AGENT_STATUSES = {
  READY: 'READY',
  PAUSED: 'PAUSED',
  DIALING: 'DIALING',
  INCALL: 'INCALL',
  WAITING: 'WAITING',
  OFFLINE: 'OFFLINE'
};

// Pause reasons (can be fetched from API in production)
export const DEFAULT_PAUSE_REASONS = [
  { code: 'BREAK', label: 'Break' },
  { code: 'LUNCH', label: 'Lunch' },
  { code: 'MEETING', label: 'Meeting' },
  { code: 'TRAINING', label: 'Training' },
  { code: 'OTHER', label: 'Other' }
];
