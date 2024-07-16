/*
 * Get the style element for dark mode
 * @returns {HTMLStyleElement} the style element
 */
async function getStyleElement() {
  /* Populate the stylesheet if it hasn't already been done */
  if (styleElement.innerText === '') {
    const string = await getStylesheetFromExtension();
    styleElement.innerText = string;
  }
  return styleElement;
}

/* 
 * Loads the stylesheet contents from web accessible resources
 * @returns {string} the stylesheet string
 * @throws {Error} Fetch errors that are considered fatal
 */
async function getStylesheetFromExtension() {
  /* This calculates the URL we pass to the fetch function */
  const url = chrome.runtime.getURL(`styles/dark-mode.css`);
  let cssString = '';
  try {
    const response = await fetch(url);
    /* Fatal fetch errors */
    if (!response.ok) {
      throw new Error(`DAT: Error fetching dark mode stylesheet`);
    }
    cssString = await response.text();
  } catch (error) {
    /* Recoverable fetch errors */
    console.error(`DAT: ${error.message}`);
  }
  return cssString;
}

/*
 * Injects the Dark Mode Stylesheet
 * @param isToggle {boolean} If the current call is due to a user toggle
 * @returns {number} The milliseconds spent on delays during initialization
 * @throws {RangeError} If over 12 seconds are spent delaying injection
 */
async function injectStyleElement(isToggle) {
  if (injectionAttemptMs > 12000) {
    throw new RangeError('DAT: Failed to inject Dark Mode Styles');
  }
  /* document.head can become available prior to the load event */
  if (document?.head === undefined) {
    /* 50ms is the widely accepted minimum (excluding 0) that
       should be used for setTimeout in content scripts */
    window.setTimeout(()=> injectStyleElement, 50);
    return injectionAttemptMs += isToggle ? 0 : 50;
  }
  /* If it's already injected, we can stop testing for it */
  if (styleElement.parentElement === document.head) {
    return injectionAttemptMs;
  }
  const element = await getStyleElement();
  /* In case of a recoverable fetch error */
  if (styleElement.innerText === '') {
    window.setTimeout(()=> injectStyleElement, 250);
    return injectionAttemptMs += isToggle ? 0 : 250;
  }
  document.head.append(element);
  /* Verify that the injection worked after 1 second,
     if not, we do it again until it does! */
  window.setTimeout(()=> injectStyleElement, 1000);
  return injectionAttemptMs += isToggle ? 0 : 1000;
}

/*
 * Updates the page to (en/dis)able Dark Mode
 * @param {boolean} status Whether or not Dark Mode should be enabled
 * @param {boolean} isToggle Was this call user initiated
 */
function setDarkMode(status, isToggle = false) {
  if (status) {
    injectStyleElement(isToggle);
    isDark = true;
  } else {
    /* We don't want to attempt removal of elements that aren't there */
    if (styleElement.parentElement === document.head) {
      style.parentNode.removeChild(styleElement);
    }
    isDark = false;
  }
}

/* Runtime */
/* Style Element to be injected into the head */
const styleElement = document.createElement('style');
/* Whether dark mode is currently enabled */
let isDark = false;
/* Number of injection attempts by delay time to limit failed retries */
let injectionAttemptMs = 0;

/* Get option from storage and pass it to the setDarkMode function */
chrome.storage.sync.get({ darkMode: false }, (result) => {
  setDarkMode(result.darkMode, true);
});

/* Listen for messages that toggle dark mode */
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  /* Verify the message has a property 'darkMode' */
  if (Object.hasOwnProperty(message, 'darkMode')) {
  /* If so, pass it to the setDarkMode function */
    setDarkMode(message.darkMode, true);
  }
});
