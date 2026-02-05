/**
 * Notification group filter: same (type, subType, category, siteId, dueDate) = one notification.
 * Backend sends groupKey in FCM payload.data.groupKey; we dedupe within windowMs.
 */

const RECENT_GROUP_KEYS = new Map();
const DEFAULT_WINDOW_MS = 10000; // 10 seconds

/**
 * Gets group key from FCM payload (sent by backend for Site Check Due/Overdue).
 * @param {object} payload - FCM message payload (payload.data.groupKey)
 * @returns {string|null} groupKey or null if not present
 */
export function getGroupKeyFromPayload(payload) {
    if (!payload?.data?.groupKey) return null;
    const key = payload.data.groupKey;
    return typeof key === 'string' && key.length > 0 ? key : null;
}

/**
 * Returns true if we should show this notification (not a duplicate of same group within window).
 * Call this only when groupKey is present; when null, always show.
 * @param {string} groupKey - from getGroupKeyFromPayload(payload)
 * @param {number} windowMs - dedupe window in ms (default 10000)
 * @returns {boolean} true = show, false = skip (duplicate)
 */
export function shouldShowNotification(groupKey, windowMs = DEFAULT_WINDOW_MS) {
    if (!groupKey) return true;
    const now = Date.now();
    // Prune old entries
    for (const [k, ts] of RECENT_GROUP_KEYS.entries()) {
        if (now - ts > windowMs) RECENT_GROUP_KEYS.delete(k);
    }
    const lastShown = RECENT_GROUP_KEYS.get(groupKey);
    if (lastShown != null && now - lastShown < windowMs) {
        return false;
    }
    RECENT_GROUP_KEYS.set(groupKey, now);
    return true;
}
