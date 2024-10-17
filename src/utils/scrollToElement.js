/**
 * Scroll to a specific element based on class or ID selector.
 * @param {string} selector - The class or ID selector of the element to scroll to.
 * @param {boolean} smooth - Whether the scroll should be smooth (default: true).
 */
export const scrollToElement = (selector, smooth = true) => {
  const element = document.querySelector(selector);

  if (element) {
    element.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "start", // Aligns the element to the start of the scrollable area
    });
  } else {
    console.warn(`Element with selector '${selector}' not found.`);
  }
};
