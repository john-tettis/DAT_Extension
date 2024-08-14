// Function to add a new rule row to the Highlighting Rules table
function addRuleRow(regex, color) {
    const table = document.getElementById("rulesTable");
    const row = table.insertRow();
    const phraseCell = row.insertCell();
    const colorCell = row.insertCell();
    const actionCell = row.insertCell();
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('deleteBtn');
    deleteButton.innerText = '\u00D7';
    phraseCell.innerHTML = `<input type="text" value="${regex}">`;
    colorCell.innerHTML = `<input type="color" value="${color}">`;
    actionCell.appendChild(deleteButton);
    deleteButton.addEventListener('click', deleteRuleRow);
	return false;
}

/*
Takes an element and target values, animates it using animation frames
implemented because adding transition to elements was still very choppy
*/
function animatePageChange(element, targetRight, targetWidth) {
    const style = element.style;
    const currR = parseInt(style.right, 10);
	const currW = parseInt(style.width, 10);
    console.log({currW, currR, style});
    if (currR !== targetRight) {
		const increment = currR < targetRight ? 10 : -10;
		element.style.right = currR + increment + 'px';
	} else if (currW !== targetWidth) {
		console.log('setting width');
		element.style.transition = 'width .5s';
		element.style.width = targetWidth + 'px';
		return;
	}
    requestAnimationFrame(() => animatePageChange(element, targetRight, targetWidth));
}

function deleteRuleRow(event) {
	const row = event.target.parentNode.parentNode;
	row.remove();
}

// Function to populate the table with rules
function populateColorRulesTable(rules) {
    const table = document.getElementById("rulesTable");
	const ruleCount = rules.length;
	for (let index = 0; index < ruleCount; index++) {
		const rule = rules[index];
		addRuleRow(rule.regex, rule.color);
	}
}

//convert key press values to more readable values for the user
//ran just before it is displayed to user, data is stored raw computer readable
function readableKeys(pressedKeys) {
    const specialKeys = {
        CONTROL: "CTRL",
        SHIFT: "SHFT"
    };
    return pressedKeys.map((key) => {
        if (key in specialKeys) {
            return specialKeys[key];
        }
        return key;
    });
}

//records keys pressed to hold shortcut
function recordKeyCombination(event) {
    event.preventDefault();
    const key = event.key.toUpperCase();
    if (!keysPressed.includes(key) && (key === 'CONTROL' || key === 'ALT' || key === 'SHIFT')) {
        keysPressed.push(key);
        shortcutDisplay.value = readableKeys(keysPressed).join(' + ') + ' + ...';
    } else if (keysPressed.length > 0 && !['CONTROL', 'ALT', 'SHIFT'].includes(key)) {
        keysPressed.push(key);
        shortcutDisplay.value = readableKeys(keysPressed).join(' + ');
        stopRecording();
    }
	return false;
}

// Save updated rules to storage
function saveRules() {
    const table = document.getElementById('rulesTable');
    let rules = [];
    for (let i = 1; i < table.rows.length; i++) { // start from 1 to skip header
        let row = table.rows[i];
        let regex = row.cells[0].firstChild.value;
        let color = row.cells[1].firstChild.value;
        rules.push({ regex, color });
    }
    Storage.set({ 'highlightRules': rules })
      .then(() => toastSaveMessage('Rules saved successfully!'))
      .catch(error => toastSaveMessage('Error saving rules: ' + error));
	return false;
}

// Stops recording for key combination
function stopRecording() {
    document.removeEventListener('keydown', recordKeyCombination);
    document.removeEventListener('keyup', stopRecording);
    if (keysPressed.length > 0) {
        const newShortcut = readableKeys(keysPressed).join(' + ');
        shortcutDisplay.value = newShortcut;
        Storage.set({shortcut: keysPressed});
    }
    keysPressed = [];
	return false;
}
	
function toastSaveMessage(message) {
	const container = document.querySelector('#saveRulesBtn').parentElement;
	const element = document.createElement('p');
	element.innerText = message;
	container.append(element);
	window.setTimeout(() => {
		element.remove();
	}, 2500);
}

function toggleDarkMode(bool) {
    const darkModeStatus = { darkMode: bool };
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, darkModeStatus);
    });
}

function updateTime() {
    display.innerText = stopwatch.formattedTime();
    window.requestAnimationFrame(updateTime);
}

//update timer immediately to ensure accurate display
const display = document.getElementById('display');
updateTime();
 
document.addEventListener('DOMContentLoaded', () => {
    const darkMode = document.getElementById('darkMode');
    const filterProjects = document.getElementById('sort-pay');
    const resetShortcutButton = document.getElementById('resetShortcut');
    const shortcutDisplay = document.getElementById('shortcutDisplay');
    const sortQualifications = document.querySelector('#sort-qualifications');
    const stopWatchOverlay = document.getElementById('stopWatchOverlay');
    const timerReset= document.getElementById('resetBtn');
    const timerToggle = document.getElementById('toggleBtn');
    timerToggle.innerText = stopwatch.isRunning ? 'Pause' : 'Start';
    timerToggle.addEventListener('click', () => {
        stopwatch.toggle();
        timerToggle.innerText = stopwatch.isRunning ? 'Pause' : 'Start';
		return false;
    });
    timerReset.addEventListener('click', () => {
        stopwatch.reset();
        timerToggle.innerText = stopwatch.isRunning ? 'Pause' : 'Start';
		return false;
    });
    // Retreive storage data for form info
    Storage.get(['shortcut', 'sortPay','sortQualifications', 'darkMode', 'stopWatchOverlay'], [["CONTROL", "/"], true, true, false, false])
      .then((result) => {
        //shortcut info handled here
        shortcutDisplay.value = readableKeys(result.shortcut).join(" + ");       
        //project sort input and darkmode input display updated based off of chrome storage
        filterProjects.checked = result.sortPay;
        darkMode.checked = result.darkMode;
		sortQualifications.checked = result.sortQualifications;
        stopWatchOverlay.checked = result.stopWatchOverlay;
      });
    // Load Highlight rules. I'm aware of the above, but want to avoid doing everything in one function call. 
    Storage.get(["highlightRules"], [[]])
      .then((data) => {
        const rules = data.highlightRules; 
        populateColorRulesTable(rules);
      })
      .catch((error) => {
        console.error("Error loading rules:", error);
      });
    document.getElementById("addRuleBtn").addEventListener("click", () => {
        return addRuleRow("", "#000000"); // Add an empty row for a new rule
    });
    // Save Rules button event listener
    document.getElementById("saveRulesBtn").addEventListener("click", () => {
        return saveRules(); 
    });
    //listen for checkbox to be clicked to affect whether or not to filter projects on main page load
    filterProjects.addEventListener("change", (event) => {
        const value = event.target.checked;
        Storage.set({sortPay: value});
    });
    //listen for checkbox to be clicked to affect whether or not to filter qualifications on main page load
    sortQualifications.addEventListener("change", (event) => {
        const value = event.target.checked;
        Storage.set({sortQualifications: value});
    });
    //listen for stopwatch update
    stopWatchOverlay.addEventListener("change", (event) => {
        const value = event.target.checked;
        Storage.set({stopWatchOverlay: value});
    });
    //listen for darkMode to be toggled, update storage
    darkMode.addEventListener("change", (event) => {
        const value = event.target.checked;
        toggleDarkMode(value);
        Storage.set({darkMode: value});
    });
    //listen for shortcut input to be selected
    shortcutDisplay.addEventListener('click', () => {
        shortcutDisplay.value = 'Recording...';
        document.addEventListener('keydown', recordKeyCombination);
        document.addEventListener('keyup', stopRecording);
		return false;
    });
    //reset shortcut value in storage and in UI
    resetShortcutButton.addEventListener('click', () => {
        shortcutDisplay.value = 'CTRL + /';
        Storage.set({shortcut: ['CONTROL', '/']});
		return false;
    });
});

//holds keys pressed in series
let keysPressed = [];
const changePage = document.getElementById('move');
let isHomePage = true;
const container = document.querySelector('.container');
//set default values for animation
container.style.right = 0;
container.style.width = '250px';
changePage.addEventListener('click', () => {
    if (isHomePage) {
        // container.style.right = '250px';
        // setTimeout(() => {
        //     container.style.width = '350px';
        // }, 400);
        animatePageChange(container, 250, 350);
        changePage.innerText = 'Return';
    } else {
        // container.style.right = '0';
        // setTimeout(() => {
        //     container.style.width='250px';
        // },400);
        animatePageChange(container, 0, 250);
        changePage.innerText = 'Highlight Rules';
    }
    isHomePage = !isHomePage;
	return false;
});
