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

/* Section Header and Tables, Purposefully Excluding Report Time Section */
const [qualificationsHeader, projectsHeader] = document.querySelectorAll('h3');
const [qualificationsTable, projectsTable] = document.querySelectorAll('table');

/* Simple checks to ensure the UI is what we expect */
const expectedInterface = [
  qualificationsHeader.innerText.startsWith('Qualifications'),
  projectsHeader.innerText.startsWith('Projects'),
  qualificationsTable.tHead.firstChild.textContent.split('Filter and sort options').join('') === 'NamePayTasksCreatedPinHide',
  projectsTable.tHead.firstChild.textContent.split('Filter and sort options').join('') === 'NamePayTasksCreatedPinHide',
].every((test) => test === true);

/* Throw an Error if it isn't */
if (expectedInterface === false) {
  // log each element for debugging //
  //  console.log({
  //   qualificationsHeader,
  //    projectsHeader, 
  //    qualificationsTable:qualificationsTable.tHead.firstChild.textContent.split('Filter and sort options').join(''), 
  //    projectsTable: projectsTable.tHead.firstChild.textContent.split('Filter and sort options').join('')
  // });

  throw new RangeError('DAT: Interface outside expected parameters, There may have been a site update which changed the UI');
}

/* Add Table Row Counts and Task Counts to their Respective Headers */
const qualificationsCount = qualificationsTable.rows.length - 1;
const qualificationsTaskCount = sumTableColumn(qualificationsTable, 2);
const qualificationHeaderSpan = document.createElement('span');
qualificationHeaderSpan.style.fontSize = '65%';
qualificationHeaderSpan.style.verticalAlign = '-15%';
qualificationHeaderSpan.innerText = `\u0020\u0020\u0020${formatNumber(qualificationsCount)} with ${formatNumber(qualificationsTaskCount)} tasks`;
qualificationsHeader.append(qualificationHeaderSpan);

const projectsCount = projectsTable.rows.length - 1;
const projectsTaskCount = sumTableColumn(projectsTable, 2);
const projectsHeaderSpan = document.createElement('span');
projectsHeaderSpan.style.fontSize = '65%';
projectsHeaderSpan.style.verticalAlign = '-15%';
projectsHeaderSpan.innerText = `\u0020\u0020\u0020${formatNumber(projectsCount)} with ${formatNumber(projectsTaskCount)} tasks`;
projectsHeader.append(projectsHeaderSpan);
/* Remove flex display to allow verticalAlign to function correctly */
projectsHeader.classList.remove('tw-flex');

//here we are modifying the qualification container. Often, especially when there are a ton of quals,
//it gets in the way of looking at projects. We are resizing the container, and addind a resize style to it.
const accentColor = window.getComputedStyle(document.querySelector("body > div.navbar")).backgroundColor;
const textColor = window.getComputedStyle(document.querySelector("a.navbar-brand")).color;
const qualificationsContainer = qualificationsTable.parentElement;
qualificationsContainer.style.height = '155px';
qualificationsContainer.style.resize ='vertical';
qualificationsContainer.style.scrollSnapType = 'y mandatory';
qualificationsContainer.style.scrollbarWidth = 'thin';
qualificationsContainer.style.scrollbarColor = `${textColor} ${accentColor}`;

storageGetFunction(['sortPay', 'sortQualifications'], ({sortPay, sortQualifications}) => {
  if (sortPay) {
    sortTable(projectsTable, [1,2], [sanitizer_Pay,sanitizer_Tasks]);
  }
  if (sortQualifications || sortQualifications === undefined) {
    sortTable(qualificationsTable, [3], [sanitizer_Created]);
  }
}, [true, true]);
