/**
 * Safely scroll to an element by ID, with retry mechanism for async rendering
 * Handles cases where element might not be in DOM yet
 */
export function scrollToElement(elementId: string, maxRetries = 20): Promise<boolean> {
  return new Promise((resolve) => {
    let retries = 0;
    
    const attemptScroll = () => {
      const element = document.getElementById(elementId);
      
      if (element) {
        // Element found, scroll to it
        try {
          element.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
          // Give a small delay to ensure scroll has started
          setTimeout(() => resolve(true), 100);
          return;
        } catch (err) {
          console.error(`[scrollToElement] Error scrolling to ${elementId}:`, err);
          resolve(false);
          return;
        }
      }
      
      // Element not found, retry if we haven't exceeded max retries
      if (retries < maxRetries) {
        retries++;
        // Wait 100ms before retrying (allows async rendering to complete)
        setTimeout(attemptScroll, 100);
      } else {
        // Max retries exceeded, element doesn't exist
        console.warn(`[scrollToElement] Element #${elementId} not found after ${maxRetries} retries`);
        resolve(false);
      }
    };
    
    // Start the first attempt immediately
    attemptScroll();
  });
}

/**
 * Alternative approach: Use MutationObserver to detect when element is added to DOM
 * More efficient for deeply async rendering
 */
export function scrollToElementObserver(elementId: string, timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    // First, check if element already exists
    let element = document.getElementById(elementId);
    if (element) {
      try {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => resolve(true), 100);
        return;
      } catch (err) {
        console.error(`[scrollToElementObserver] Error scrolling:`, err);
        resolve(false);
        return;
      }
    }

    // Element doesn't exist yet, set up observer
    const observer = new MutationObserver(() => {
      element = document.getElementById(elementId);
      if (element) {
        observer.disconnect();
        try {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => resolve(true), 100);
        } catch (err) {
          console.error(`[scrollToElementObserver] Error scrolling:`, err);
          resolve(false);
        }
      }
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    // Timeout after 5 seconds to prevent infinite observation
    setTimeout(() => {
      observer.disconnect();
      console.warn(`[scrollToElementObserver] Timeout waiting for #${elementId}`);
      resolve(false);
    }, timeout);
  });
}
