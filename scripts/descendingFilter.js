/* Creates a Wrapper around a sanitizer function with error checking and fallbacks */
function makeSanitizer(baseFunction) {
  return function(element) {
    const innerText = element?.innerText?.trim() ?? '';
    if (innerText === '') {
      return 0;
    }
    try {
      const sanitizedValue = baseFunction(element);
      return Number.isNaN(sanitizedValue) ? 0 : sanitizedValue;
    } catch (error) {
      console.error('DAT: Encountered an issue when sorting table\n\terror: %s\n\telement: %o\n\tsantizer: %o', error.message, element, sanitizer);
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

function sortTable(table, sortColumnIndices, sanitizers= [((value) => value.innerText)], descending = [true ,true]) {

  let simpleCompare =  descending[0] ? ((a, b) => b.primary - a.primary) : ((a, b) => a.primary - b.primary);
  //this function is able to compare by one column or an additional second column. Implemented to enable
  //sorting by pay first, then by tasks.
   const compareFn = (a,b) =>{
       let comparison = simpleCompare(a,b)
     //if their primary value is equal, and they both have secondary values to compare:
       if(comparison === 0 && a.secondary && b.secondary){
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


    /* an object with three keys, the sanitized "primary" and  "secondary" for sorting and the "row" element */
  const workingArray = allRows.map((row) => {
    //get our primary sorting value
    const primary = sanitizers[0](row.cells[sortColumnIndices[0]]);
    //get a secondary sorting value if available
    const secondary = sanitizers[1]?.(row.cells[sortColumnIndices[1]]);
    //return the row, its primary sorting value, and its secondary value or undefined
    return {row, primary, secondary};


  });
  /* Sort the objects by value and return only the row element */
  const sortedRows = workingArray.sort(compareFn).map((object) => object.row);
  const rowCount = sortedRows.length;
  /* Append Rows to Table */
  const tBody = table.tBodies[0]
  for (let index = 0; index < rowCount; index++) {
    tBody.appendChild(sortedRows[index]);
  }
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

  if (typeof chrome !== 'undefined' && chrome.storage?.sync?.get) {
    // 2. Passing the object 'defaults' ensures Chrome returns the 
    // default value if the key is not yet set in storage.
    chrome.storage.sync.get(defaults, callback);
  } else {
    // 3. Environment fallback (testing)
    callback(defaults);
  }
}

/* Sum up all integer values in a table column by index */
function sumTableColumn(table, columnIndex) {
//   console.log('[DAT] sumTableColumn called with table:', table, 'and columnIndex:', columnIndex);
  return [...table.rows]
    .map((row) => row.children[columnIndex])
    .reduce((accumulator, cell) => {
      const value = Number.parseInt(cell.innerText);
      return accumulator + (Number.isNaN(value) ? 0 : value);
    }, 0);
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
  return Number.parseFloat(element.innerText.slice(1).split('/')[0]);
});

/*   "####"  -->  ####   */
const sanitizer_Tasks = makeSanitizer((element) => {
  return Number.parseInt(element.innerText);
});

/*   "MMM DD"  -->  ###   (Days from start of year) */
const sanitizer_Created = makeSanitizer((element) => {
  const [month, day] = element.innerText.split(' ');
  const monthArray = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthIndex = monthArray.indexOf(month.toUpperCase());
  const daysPriorToStartOfMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][monthIndex] || 0;
  const dayOfYear = daysPriorToStartOfMonth + Number.parseInt(day);
  const today = new Date();
  if (today.getMonth() < monthIndex || (today.getMonth() === monthIndex && today.getDate() < Number.parseInt(day))) {
	  return dayOfYear - 365;
  }
  return dayOfYear;
});

/* Determines if the item is pinned via className */
const sanitizer_Pin = makeSanitizer((element) => {
  return element.classList.contains('tw-animate-unstar') ? 1 : 0;
});

/* Determines if the item is priority via string matching */
const sanitizer_Priority = makeSanitizer((element) => {
  return element.innerText.toUpperCase().indexOf('PRIORITY') > -1 ? 1 : 0;
});

/* --- DYNAMIC TABLE PROCESSING FOR TAB SYSTEM --- */

function processTables() {
  const tables = document.querySelectorAll('table');
  
  tables.forEach(table => {
    // Only process tables that haven't been sorted/modified yet
    if (table.dataset.datProcessed) return;

    // Check if table is fully populated. A quick check is if it has a tBody with rows.
    if (!table.tBodies || table.tBodies.length === 0 || table.tBodies[0].rows.length === 0) {
      return; // Wait until rows are rendered
    }

    const tHeadText = table.tHead ? table.tHead.firstChild.textContent.replace(/Filter and sort options/g, '') : '';
    const container = table.closest('.active-table') || table.parentElement.parentElement;
    const h3 = container ? container.querySelector('h3') : null;
    
    let tableType = null;

    // Determine which table this is
    if (h3 && h3.innerText.includes('All Projects')) {
      tableType = 'projects';
    } else if (h3 && (h3.innerText.includes('Easier Projects') || h3.dataset.testid === 'easier-projects-header')) {
      tableType = 'easyProjects';
    } else {
      // Check active tab to infer
      const activeTabSpan = document.querySelector('div[role="button"].tw-bg-white span.tw-font-medium');
      const activeTabText = activeTabSpan ? activeTabSpan.innerText : '';

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

    if (!tableType) return;
    
    // Mark as processed so we don't apply the counts and sorting infinitely
    table.dataset.datProcessed = tableType;

    // 1. Add Task Counts
    // Flat all rows across all tBodies just in case
    const allRows = [...table.tBodies].map((tBody) => [...tBody.rows]).flat();
    const rowCount = allRows.length;
    const taskCount = sumTableColumn(table, 2);
    
    const countSpan = document.createElement('span');
    countSpan.style.fontSize = '65%';
    countSpan.style.verticalAlign = '-15%';
    countSpan.innerText = `\u0020\u0020\u0020${formatNumber(rowCount)} with ${formatNumber(taskCount)} tasks`;
    countSpan.className = 'dat-task-count';
    
    if (h3 && h3.innerText.trim() !== '') {
      h3.append(countSpan);
      h3.classList.remove('tw-flex');
    } else {
      // If there is no valid h3 (like on the Qualifications tab), insert one above the table
      const newHeader = document.createElement('h3');
      newHeader.className = 'tw-text-h3 tw-flex tw-flex-1 tw-items-center tw-mb-4 tw-mt-4';
      newHeader.innerText = tableType === 'easyProjects' ? 'Easier Projects' : (tableType.charAt(0).toUpperCase() + tableType.slice(1));
      newHeader.append(countSpan);
      if (table.parentElement) {
        table.parentElement.insertBefore(newHeader, table);
      }
    }

    // 2. Sorting
    storageGetFunction(['sortPay', 'sortQualifications'], ({sortPay, sortQualifications}) => {
      console.log({sortPay});
      if (tableType === 'projects' && sortPay) {
        sortTable(table, [1, 2], [sanitizer_Pay, sanitizer_Tasks]);
      } else if (tableType === 'easyProjects' && sortPay) {
        sortTable(table, [1, 2], [sanitizer_Pay, sanitizer_Tasks]);
      } else if (tableType === 'qualifications' && (sortQualifications || sortQualifications === undefined)) {
        sortTable(table, [3], [sanitizer_Created]);
      }
    }, [true, true]);

  });
}

// Run initially just in case they are already rendered
processTables();

// Set up MutationObserver to handle tab switching and dynamic loading
const observer = new MutationObserver((mutations) => {
  let shouldProcess = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldProcess = true;
      break;
    }
  }
  if (shouldProcess) {
    // Let React finish rendering its frame
    setTimeout(processTables, 100);
  }
});

observer.observe(document.body, { childList: true, subtree: true });