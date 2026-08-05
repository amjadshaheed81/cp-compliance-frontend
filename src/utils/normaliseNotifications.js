/**
 * Converts the notification API response into a safe array.
 *
 * The notification endpoint should return an array. However, an API error,
 * proxy issue or future response change could return an object or string.
 * Returning an empty array prevents the UI from crashing when using .map().
 */
export const normaliseNotifications = (response) => {
  // Normal response from the current notification API
  if (Array.isArray(response)) {
    return response;
  }

  // Also support a paged or wrapped API response
  if (Array.isArray(response?.content)) {
    return response.content;
  }

  console.error(
    "Invalid notification response. Expected an array but received:",
    response
  );

  return [];
};