// Centralized polling interval configuration.
// Only two primary modes: fast (active) and slow (background).

/** Fast polling for active operations (2 seconds) */
export const POLL_FAST = 2000;

/** Slow polling for background monitoring (10 seconds) */
export const POLL_SLOW = 10000;

/** Very slow polling for rarely-changing data like ink levels (30 seconds) */
export const POLL_INFREQUENT = 30000;
