/* ==========================================================================
   DEBUGGING CONFIGURATION
   Set DEBUG to true to enable console logs in dev mode, or false to silence them.
   Alternatively, run `localStorage.setItem('DAT_DEBUG', 'true')` in DevTools.
   ========================================================================== */
const DEBUG = false;

function isDebug() {
  if (DEBUG) return true;
  try {
    if (typeof window !== 'undefined' && window.DAT_DEBUG) return true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('DAT_DEBUG') === 'true') return true;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('DAT_DEBUG') === 'true') return true;
  } catch (e) {
    // Ignore cross-origin / private browsing storage restrictions
  }
  return false;
}

const debug = {
  log: (...args) => { if (isDebug()) console.log(...args); },
  warn: (...args) => { if (isDebug()) console.warn(...args); },
  error: (...args) => { if (isDebug()) console.error(...args); },
  group: (...args) => { if (isDebug()) console.group(...args); },
  groupEnd: () => { if (isDebug()) console.groupEnd(); },
};

debug.log('[DAT descendingFilter] Script loaded at:', new Date().toLocaleTimeString(), {
  url: window.location.href,
  readyState: document.readyState
});

/* Creates a Wrapper around a sanitizer function with error checking and fallbacks */
function makeSanitizer(baseFunction, sanitizerName = 'sanitizer') {
  return function (element) {
    const innerText = element?.innerText?.trim() ?? '';
    if (innerText === '') {
      return 0;
    }
    try {
      const sanitizedValue = baseFunction(element);
      const finalValue = Number.isNaN(sanitizedValue) ? 0 : sanitizedValue;
      return finalValue;
    } catch (error) {
      debug.error(`[DAT descendingFilter] Encountered an issue in ${sanitizerName} when sorting table:\n\terror: %s\n\telement: %o`, error.message, element);
    }
    return 0;
  }
}

/**
 * Sorts an HTML table based on the values in one or two columns.
 * The three Array/ Tuple parameters must be the same length
 * @param {HTMLTableElement} table - The HTML table element to be sorted.
 * @param {number[]} sortColumnIndices - An array or tuple (maximum length 2) specifying the column indices to be used for sorting. The first element is the primary column, and the second element is the secondary column (optional).
 * @param {Function[]} [sanitizers=[(value) => value.innerText]] - An array or tuple (maximum length 2) of functions to sanitize values in the respective columns before comparison. Each function should accept a table cell (td element) and return a sanitized value. Defaults to using the `innerText` of each cell.
 * @param {boolean[]} [descending=[true, true]] - An array or tuple (maximum length 2) specifying the sort order for each column. `true` means descending order, and `false` means ascending order. Defaults to `[true, true]` for descending order for both columns.
 */

function sortTable(table, sortColumnIndices, sanitizers = [((value) => value.innerText)], descending = [true, true]) {
  debug.group('[DAT descendingFilter] sortTable() called');
  debug.log('sortTable arguments:', { table, sortColumnIndices, sanitizers, descending });

  let simpleCompare = descending[0] ? ((a, b) => b.primary - a.primary) : ((a, b) => a.primary - b.primary);
  //this function is able to compare by one column or an additional second column. Implemented to enable
  //sorting by pay first, then by tasks.
  const compareFn = (a, b) => {
    let comparison = simpleCompare(a, b)
    //if their primary value is equal, and they both have secondary values to compare:
    if (comparison === 0 && a.secondary && b.secondary) {
      //return the appropriate comparison between their two value
      return descending[1] ? b.secondary - a.secondary : a.secondary - b.secondary;
    }
    //otherwise, if the primary comparison is non-zero, or if there is no secondary value, just return primary comparison
    return comparison
  }
  /* Get all tBody elements in the table as an array. iterate through each,
   * returning an array of rows, then flatten the result. I've seen tables in
   * other parts of the site with multiple tBodys.  This ia a just-in-case.
   */
  const allRows = [...table.tBodies].map((tBody) => [...tBody.rows]).flat();
  debug.log(`[DAT descendingFilter] Found ${allRows.length} total rows in table across ${table.tBodies.length} tBodies.`);

  if (allRows.length === 0) {
    debug.warn('[DAT descendingFilter] sortTable(): Aborted because no rows were found.');
    debug.groupEnd();
    return;
  }

  // Log sample row cells to verify column index alignment
  if (allRows[0]) {
    debug.log('[DAT descendingFilter] First row cell texts (to verify column indices):',
      Array.from(allRows[0].cells).map((cell, idx) => `[${idx}]: "${cell.innerText?.trim()}"`)
    );
  }

  /* an object with three keys, the sanitized "primary" and  "secondary" for sorting and the "row" element */
  const workingArray = allRows.map((row, rowIdx) => {
    const primaryCell = row.cells[sortColumnIndices[0]];
    const secondaryCell = sortColumnIndices[1] !== undefined ? row.cells[sortColumnIndices[1]] : undefined;

    //get our primary sorting value
    const primary = sanitizers[0](primaryCell);
    //get a secondary sorting value if available
    const secondary = sanitizers[1]?.(secondaryCell);

    if (rowIdx < 3 || rowIdx === allRows.length - 1) {
      debug.log(`[DAT descendingFilter] Row #${rowIdx} parsed:`, {
        primaryRaw: primaryCell?.innerText?.trim(),
        primary,
        secondaryRaw: secondaryCell?.innerText?.trim(),
        secondary
      });
    }

    //return the row, its primary sorting value, and its secondary value or undefined
    return { row, primary, secondary };
  });

  const allPrimaryZero = workingArray.every((item) => item.primary === 0);
  if (allPrimaryZero && workingArray.length > 0) {
    debug.warn('[DAT descendingFilter] Warning: ALL parsed primary values are 0! Column indices or sanitizers may not match current table structure.');
  }

  /* Sort the objects by value and return only the row element */
  const sortedRows = workingArray.sort(compareFn).map((object) => object.row);
  const rowCount = sortedRows.length;
  debug.log(`[DAT descendingFilter] Rows sorted. First 3 primary values after sort:`, workingArray.slice(0, 3).map(o => o.primary));

  /* Append Rows to Table */
  const tBody = table.tBodies[0];
  if (!tBody) {
    debug.error('[DAT descendingFilter] table.tBodies[0] is undefined! Cannot append sorted rows.');
    debug.groupEnd();
    return;
  }

  for (let index = 0; index < rowCount; index++) {
    tBody.appendChild(sortedRows[index]);
  }
  debug.log(`[DAT descendingFilter] sortTable() complete: Re-appended ${rowCount} rows.`);
  debug.groupEnd();
}


/* Wrapper function to allow for easier testing regardless of API availability */
function storageGetFunction(options, callback, fallbackDefaults) {
  // 1. Create a default object: { key1: true, key2: true }
  // We use the provided defaults or fall back to 'true' for every key
  const defaults = Object.fromEntries(
    options.map((key, index) => [
      key,
      fallbackDefaults && fallbackDefaults[index] !== undefined ? fallbackDefaults[index] : true
    ])
  );

  debug.log('[DAT descendingFilter] storageGetFunction: Querying keys:', options, 'Defaults:', defaults);

  if (typeof chrome !== 'undefined' && chrome.storage?.sync?.get) {
    // 2. Passing the object 'defaults' ensures Chrome returns the 
    // default value if the key is not yet set in storage.
    chrome.storage.sync.get(defaults, (result) => {
      if (chrome.runtime?.lastError) {
        debug.error('[DAT descendingFilter] chrome.storage.sync.get error:', chrome.runtime.lastError);
      }
      debug.log('[DAT descendingFilter] chrome.storage.sync.get returned:', result);
      callback(result);
    });
  } else {
    // 3. Environment fallback (testing)
    debug.log('[DAT descendingFilter] Environment fallback (no chrome.storage.sync.get): using defaults:', defaults);
    callback(defaults);
  }
}

/* Sum up all integer values in a table column by index */
function sumTableColumn(table, columnIndex) {
  debug.log(`[DAT descendingFilter] sumTableColumn called with columnIndex=${columnIndex}`);
  const sum = [...table.rows]
    .map((row) => row.children[columnIndex])
    .reduce((accumulator, cell) => {
      if (!cell) return accumulator;
      const rawText = cell.innerText?.replace(/,/g, '')?.trim() || '';
      const value = Number.parseInt(rawText);
      return accumulator + (Number.isNaN(value) ? 0 : value);
    }, 0);
  debug.log(`[DAT descendingFilter] sumTableColumn(columnIndex=${columnIndex}) result = ${sum}`);
  return sum;
}

/* Should probably add an option to change this, both for personal preference3 and i18l */
function formatNumber(number, thousandsSeparator = ',') {
  let decimalValue = '';
  let string = number.toString();
  if (string.indexOf('.') > -1) {
    const array = string.split('.');
    decimalValue = `.${array[1]}`;
    string = array[0];
  }
  if (string.length > 3) {
    string = string.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  }
  return `${string}${decimalValue}`;
}

/*   "$##.##/hr"  -->  ##.##   */
const sanitizer_Pay = makeSanitizer((element) => {
  const text = element.innerText?.trim() ?? '';
  const match = text.match(/\$?([0-9]+(?:\.[0-9]+)?)/);
  const parsed = match ? Number.parseFloat(match[1]) : Number.parseFloat(text.slice(1).split('/')[0]);
  if (Number.isNaN(parsed)) {
    debug.warn('[DAT descendingFilter] sanitizer_Pay parsed NaN from text:', text, 'element:', element);
  }
  return parsed;
}, 'sanitizer_Pay');

/*   "####"  -->  ####   */
const sanitizer_Tasks = makeSanitizer((element) => {
  const text = element.innerText?.replace(/,/g, '')?.trim() ?? '';
  const parsed = Number.parseInt(text);
  if (Number.isNaN(parsed)) {
    debug.warn('[DAT descendingFilter] sanitizer_Tasks parsed NaN from text:', text, 'element:', element);
  }
  return parsed;
}, 'sanitizer_Tasks');

/*   "MMM DD"  -->  ###   (Days from start of year) */
const sanitizer_Created = makeSanitizer((element) => {
  const [month, day] = element.innerText?.trim()?.split(' ') ?? [];
  const monthArray = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthIndex = month ? monthArray.indexOf(month.toUpperCase()) : -1;
  const daysPriorToStartOfMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][monthIndex] || 0;
  const dayOfYear = daysPriorToStartOfMonth + Number.parseInt(day || '0');
  const today = new Date();
  if (today.getMonth() < monthIndex || (today.getMonth() === monthIndex && today.getDate() < Number.parseInt(day || '0'))) {
    return dayOfYear - 365;
  }
  return dayOfYear;
}, 'sanitizer_Created');

/* Determines if the item is pinned via className */
const sanitizer_Pin = makeSanitizer((element) => {
  return element.classList.contains('tw-animate-unstar') ? 1 : 0;
}, 'sanitizer_Pin');

/* Determines if the item is priority via string matching */
const sanitizer_Priority = makeSanitizer((element) => {
  return element.innerText.toUpperCase().indexOf('PRIORITY') > -1 ? 1 : 0;
}, 'sanitizer_Priority');

/* --- DYNAMIC TABLE PROCESSING FOR TAB SYSTEM --- */

function processTables() {
  debug.group('[DAT descendingFilter] processTables() invoked');
  const tables = document.querySelectorAll('table');
  debug.log(`Found ${tables.length} <table> elements on page.`);

  if (tables.length === 0) {
    debug.log('[DAT descendingFilter] No tables present on page right now.');
    debug.groupEnd();
    return;
  }

  tables.forEach((table, index) => {
    debug.group(`[DAT descendingFilter] Evaluating Table #${index}`);
    debug.log('Table element:', table);

    // Only process tables that haven't been sorted/modified yet
    if (table.dataset.datProcessed) {
      debug.log(`Table #${index} already processed as "${table.dataset.datProcessed}". Skipping.`);
      debug.groupEnd();
      return;
    }

    // Check if table is fully populated. A quick check is if it has a tBody with rows.
    const tBodiesCount = table.tBodies ? table.tBodies.length : 0;
    const firstBodyRows = tBodiesCount > 0 ? table.tBodies[0].rows.length : 0;
    debug.log(`Table #${index} structure: tBodies=${tBodiesCount}, first tBody rows=${firstBodyRows}`);

    if (tBodiesCount === 0 || firstBodyRows === 0) {
      debug.log(`Table #${index} has no rows rendered yet. Waiting for render.`);
      debug.groupEnd();
      return;
    }

    const tHeadText = table.tHead ? table.tHead.firstChild.textContent.replace(/Filter and sort options/g, '').trim() : '';
    const container = table.closest('.active-table') || table.parentElement?.parentElement;
    const h3 = container ? container.querySelector('h3') : null;

    // Check active tab to infer
    const activeTabSpan = document.querySelector('div[role="button"].tw-bg-white span.tw-font-medium');
    const activeTabText = activeTabSpan ? activeTabSpan.innerText.trim() : '';

    debug.log(`Table #${index} context details:`, {
      tHeadText,
      container,
      h3Found: !!h3,
      h3Text: h3 ? h3.innerText.trim() : null,
      h3TestId: h3?.dataset?.testid,
      activeTabSpanFound: !!activeTabSpan,
      activeTabText
    });

    let tableType = null;

    // Determine which table this is
    if (h3 && h3.innerText.includes('All Projects')) {
      tableType = 'projects';
    } else if (h3 && (h3.innerText.includes('Easier Projects') || h3.dataset.testid === 'easier-projects-header')) {
      tableType = 'easyProjects';
    } else if (h3 && h3.innerText.includes('Projects')) {
      debug.log(`Table #${index}: h3 text "${h3.innerText.trim()}" contains "Projects" but not "All Projects". Assuming 'projects'.`);
      tableType = 'projects';
    } else {
      if (activeTabText.includes('Qualifications')) {
        tableType = 'qualifications';
      } else if (activeTabText.includes('Projects')) {
        if (tHeadText.includes('Hide')) {
          tableType = 'projects';
        } else {
          tableType = 'easyProjects';
        }
      }
    }

    debug.log(`Table #${index} resolved tableType:`, tableType);

    if (!tableType) {
      debug.warn(`[DAT descendingFilter] Table #${index}: Could not determine tableType! Dumping DOM diagnostics:`, {
        table,
        tHeadText,
        container,
        h3Text: h3 ? h3.innerText.trim() : null,
        activeTabText,
        allH3sOnPage: Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim()),
        allTabButtons: Array.from(document.querySelectorAll('button, div[role="button"], [role="tab"]')).map(b => b.innerText?.trim()).filter(Boolean)
      });
      debug.groupEnd();
      return;
    }

    // Mark as processed so we don't apply the counts and sorting infinitely
    table.dataset.datProcessed = tableType;

    // 1. Add Task Counts
    // Flat all rows across all tBodies just in case
    const allRows = [...table.tBodies].map((tBody) => [...tBody.rows]).flat();
    const rowCount = allRows.length;
    const taskCount = sumTableColumn(table, 2);
    debug.log(`Table #${index} (${tableType}): rowCount=${rowCount}, taskCount=${taskCount}`);

    const countSpan = document.createElement('span');
    countSpan.style.fontSize = '65%';
    countSpan.style.verticalAlign = '-15%';
    countSpan.innerText = `\u0020\u0020\u0020${formatNumber(rowCount)} with ${formatNumber(taskCount)} tasks`;
    countSpan.className = 'dat-task-count';

    if (h3 && h3.innerText.trim() !== '') {
      debug.log(`Table #${index} (${tableType}): Appending countSpan to existing h3: "${h3.innerText.trim()}"`);
      h3.append(countSpan);
      h3.classList.remove('tw-flex');
    } else {
      // If there is no valid h3 (like on the Qualifications tab), insert one above the table
      debug.log(`Table #${index} (${tableType}): No existing h3 found. Creating new header element above table.`);
      const newHeader = document.createElement('h3');
      newHeader.className = 'tw-text-h3 tw-flex tw-flex-1 tw-items-center tw-mb-4 tw-mt-4';
      newHeader.innerText = tableType === 'easyProjects' ? 'Easier Projects' : (tableType.charAt(0).toUpperCase() + tableType.slice(1));
      newHeader.append(countSpan);
      if (table.parentElement) {
        table.parentElement.insertBefore(newHeader, table);
      }
    }

    // 2. Sorting
    storageGetFunction(['sortPay', 'sortQualifications'], ({ sortPay, sortQualifications }) => {
      debug.log(`[DAT descendingFilter] Table #${index} (${tableType}) storage settings:`, { sortPay, sortQualifications });
      if (tableType === 'projects' && sortPay) {
        debug.log(`Table #${index} (${tableType}): Sorting projects table by Pay (col 1) and Tasks (col 2)...`);
        sortTable(table, [1, 2], [sanitizer_Pay, sanitizer_Tasks]);
      } else if (tableType === 'easyProjects' && sortPay) {
        debug.log(`Table #${index} (${tableType}): Sorting easyProjects table by Pay (col 1) and Tasks (col 2)...`);
        sortTable(table, [1, 2], [sanitizer_Pay, sanitizer_Tasks]);
      } else if (tableType === 'qualifications' && (sortQualifications || sortQualifications === undefined)) {
        debug.log(`Table #${index} (${tableType}): Sorting qualifications table by Created (col 3)...`);
        sortTable(table, [3], [sanitizer_Created]);
      } else {
        debug.log(`Table #${index} (${tableType}): Sorting condition not met.`, { tableType, sortPay, sortQualifications });
      }
    }, [true, true]);

    debug.groupEnd();
  });

  debug.groupEnd();
}

// Run initially just in case they are already rendered
debug.log('[DAT descendingFilter] Initial run of processTables()...');
processTables();

// Set up MutationObserver to handle tab switching and dynamic loading
debug.log('[DAT descendingFilter] Initializing MutationObserver...');
const observer = new MutationObserver((mutations) => {
  let shouldProcess = false;
  let addedNodesCount = 0;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldProcess = true;
      addedNodesCount += mutation.addedNodes.length;
    }
  }
  if (shouldProcess) {
    debug.log(`[DAT descendingFilter] MutationObserver detected ${addedNodesCount} added nodes across ${mutations.length} mutations. Scheduling processTables in 100ms.`);
    // Let React finish rendering its frame
    setTimeout(processTables, 100);
  }
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
  debug.log('[DAT descendingFilter] MutationObserver attached to document.body.');
} else {
  debug.warn('[DAT descendingFilter] document.body is not available yet. Listening for DOMContentLoaded...');
  window.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    debug.log('[DAT descendingFilter] MutationObserver attached on DOMContentLoaded.');
    processTables();
  });
}