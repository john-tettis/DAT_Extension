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
function storageGetFunction(options, callback, fallbackDefaults = new Array(options.length).fill(true)) {
  if (chrome?.storage?.sync?.get) {
    chrome.storage.sync.get(options, callback);
  }
  else{
    const optionObject = Object.fromEntries(options.map((key, index) => [key, fallbackDefaults[index]]));
    callback(optionObject);
  }
}

/* Sum up all integer values in a table column by index */
function sumTableColumn(table, columnIndex) {
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

function processCurrentTable() {
  console.log('[DAT] processCurrentTable called');
  const [QualHeader, ProjectHeader] = document.querySelectorAll('span.tw-inline-flex.tw-items-center.tw-font-medium');
  const table = document.querySelector('table');
  console.log('[DAT] Found headers:', QualHeader, ProjectHeader);
  console.log('[DAT] Found table:', table);

  // Remove any previously added task count spans
  [QualHeader, ProjectHeader].forEach((h, i) => {
    const oldSpan = h.querySelector('span[data-dat-task-count]');
    if (oldSpan) {
      console.log(`[DAT] Removing old task count span from header[${i}]`);
      oldSpan.remove();
    }
  });

  if (!table) {
    console.log('[DAT] No table found, returning early from processCurrentTable');
    return; // No table present, nothing to do
  }

  let header = null;
  let isQualifications = false;
  let isProjects = false;
  if (headers.length >= 2) {
    const tableHeaderText = table.tHead.firstChild.textContent.split('Filter and sort options').join('');
    console.log('[DAT] tableHeaderText:', tableHeaderText);
    if (tableHeaderText === 'NamePayTasksCreatedPinHide') {
      if (headers[0].innerText.startsWith('Qualifications')) {
        header = headers[0];
        isQualifications = true;
        console.log('[DAT] Matched Qualifications header');
      } else if (headers[1].innerText.startsWith('Projects')) {
        header = headers[1];
        isProjects = true;
        console.log('[DAT] Matched Projects header');
      } else {
        console.log('[DAT] No matching header found for table');
      }
    } else {
      console.log('[DAT] Table header text did not match expected value');
    }
  } else {
    console.log('[DAT] Not enough headers found');
  }

  if (!header) {
    console.log('[DAT] No header matched for the present table, returning');
    return;
  }

  // Add Task Counts to the Header
  const taskCount = sumTableColumn(table, 2);
  console.log('[DAT] Calculated taskCount:', taskCount);
  const headerSpan = document.createElement('span');
  headerSpan.style.fontSize = '65%';
  headerSpan.style.verticalAlign = '-15%';
  headerSpan.innerText = ` with ${formatNumber(taskCount)} tasks`;
  headerSpan.setAttribute('data-dat-task-count', 'true');
  header.append(headerSpan);
  console.log('[DAT] Appended task count span to header');

  // Only sort the table that is present
  storageGetFunction(['sortPay', 'sortQualifications'], ({sortPay, sortQualifications}) => {
    console.log('[DAT] storageGetFunction callback:', { sortPay, sortQualifications, isProjects, isQualifications });
    if (isProjects && sortPay) {
      console.log('[DAT] Sorting projects table by Pay and Tasks');
      sortTable(table, [1,2], [sanitizer_Pay,sanitizer_Tasks]);
    }
    if (isQualifications && (sortQualifications || sortQualifications === undefined)) {
      console.log('[DAT] Sorting qualifications table by Created');
      sortTable(table, [3], [sanitizer_Created]);
    }
  }, [true, true]);
}

// Initial run
console.log('[DAT] Initial processCurrentTable run');
processCurrentTable();


//capture the table tabs which
// Set up MutationObserver to watch for table/header changes
const mainContainer = document.querySelector('div.active-table').parentElement; // You may want to scope this to a more specific container if possible
console.log('[DAT] Setting up MutationObserver on', mainContainer);
// const observer = new MutationObserver((mutationsList) => {
//   let shouldProcess = false;
//   for (const mutation of mutationsList) {
//     if (
//       Array.from(mutation.addedNodes).some(node => node.nodeName === 'TABLE' || (node.nodeType === 1 && node.matches && node.matches('span.tw-inline-flex.tw-items-center.tw-font-medium')))
//       || Array.from(mutation.removedNodes).some(node => node.nodeName === 'TABLE')
//     ) {
//       shouldProcess = true;
//       console.log('[DAT] MutationObserver detected relevant node change:', mutation);
//       break;
//     }
//   }
//   if (shouldProcess) {
//     processCurrentTable();
//   }
// });
// observer.observe(mainContainer, { childList: true, subtree: true });
console.log('[DAT] MutationObserver is now observing');
