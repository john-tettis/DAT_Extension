//update timer immediately to ensure accurate display
function updateTime(){
    const display = document.getElementById('display')
    display.innerText= stopwatch.formattedTime()

}
setInterval(updateTime,500)
 
//convert key press values to more readable values for the user
//ran just before it is displayed to user, data is stored raw computer readable
function readableKeys(pressedKeys){
    const specialKeys= {
        CONTROL:"CTRL",
        SHIFT:"SHFT"
    }
    return pressedKeys.map(key => {
        if (key in specialKeys) {
            return specialKeys[key];
        }
        return key;
    });
}


 
document.addEventListener('DOMContentLoaded', () => {
    //initialize timer buttons
    const timerToggle = document.getElementById('toggleBtn')
    timerToggle.innerText = stopwatch.isRunning ? 'Pause' : 'Start'
    const timerReset= document.getElementById('resetBtn')

    timerToggle.addEventListener('click',()=>{
        stopwatch.toggle()
        timerToggle.innerText = stopwatch.isRunning ? 'Pause' : 'Start'
    })
    timerReset.addEventListener('click',()=>{
        stopwatch.reset()
        timerToggle.innerText = stopwatch.isRunning ? 'Pause' : 'Start'
    })
    const shortcutDisplay = document.getElementById('shortcutDisplay');
    const resetShortcutButton = document.getElementById('resetShortcut');
    
    //FORM LOGIC
    const filterProjects = document.getElementById('sort-pay')
    const darkMode = document.getElementById('darkMode')
    
    //check for user preference on sortPay, if none found, insert default into storage.
    //Update checkbox to reflect stored value
    
    
    // retreive storage data for form info
    Storage.get(['shortcut','sortPay','darkMode'],[["CONTROL","/"],true,false])
    .then((result) => {
        //shortcut info handled here
        shortcutDisplay.value = readableKeys(result.shortcut).join(" + ")           
        //project sort input and darkmode input display updated based off of chrome storage
        filterProjects.checked = result.sortPay;
        darkMode.checked = result.darkMode
        });


    // COLOR HIGHLIGHTING CODE 
    // Load Highlight rules. I'm aware of the above, but want to avoid doing everything in one function call. 
    Storage.get(["highlightRules"], [[]])
    .then(data => {
        const rules = data.highlightRules; 
        populateColorRulesTable(rules);
    })
    .catch(error => {
        console.error("Error loading rules:", error);
    });

    // Function to populate the table with rules
    function populateColorRulesTable(rules) {
        const table = document.getElementById("rulesTable");
        rules.forEach(rule => addRuleRow(rule.regex, rule.color) );
    }

    function deleteRuleRow(e) {
        const row = e.target.parentNode.parentNode;
       
        row.parentNode.removeChild(row);
    }

    // Function to add a new rule row to the table
    function addRuleRow(regex, color) {
        const table = document.getElementById("rulesTable");
        const row = table.insertRow();
        const phraseCell = row.insertCell();
        const colorCell = row.insertCell();
        const actionCell = row.insertCell();
        const deleteButton = document.createElement('button')
        deleteButton.classList.add('deleteBtn')
        deleteButton.innerText = 'X'

        phraseCell.innerHTML = `<input type="text" value="${regex}">`;
        colorCell.innerHTML = `<input type="color" value="${color}">`;
        actionCell.appendChild(deleteButton)
        deleteButton.addEventListener('click',deleteRuleRow)
    }

    document.getElementById("addRuleBtn").addEventListener("click", () => {
        addRuleRow("", ""); // Add an empty row for a new rule
    });

    // Save Rules button event listener
    document.getElementById("saveRulesBtn").addEventListener("click", () => {
        saveRules(); 
    });

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
            .then(() => alert('Rules saved successfully!'))
            .catch(err => alert('Error saving rules: ' + err));
    }
    ////// END COLOR HIGHLIGHTING CODE

    //listen for checkbox to be clicked to affect whether or not to filter projects on main page load
    filterProjects.addEventListener("change",(e)=>{
        const value = e.target.checked
        Storage.set({sortPay:value})
    })
    //listen for darkMode to be toggled, update storage
    darkMode.addEventListener("change",(e)=>{
        function toggleDarkMode(bool) {
            const darkModeStatus = { darkMode: bool };
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, darkModeStatus);
            });
        }
        
        const value = e.target.checked
        toggleDarkMode(value)
        Storage.set({darkMode:value})
    })
    //listen for shortcut input to be selected
    shortcutDisplay.addEventListener('click', () => {
        shortcutDisplay.value = 'Recording...';
        document.addEventListener('keydown', recordKeyCombination);
        document.addEventListener('keyup', stopRecording);
    });

    resetShortcutButton.addEventListener('click', () => {
        shortcutDisplay.value = 'CTRL + /';
        Storage.set({shortcut: ['CONTROL', '/']});
    });

    let keysPressed = [];

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
        
    }

    function stopRecording() {
        document.removeEventListener('keydown', recordKeyCombination);
        document.removeEventListener('keyup', stopRecording);
        if (keysPressed.length > 0) {
            const newShortcut = readableKeys(keysPressed).join(' + ');
            
            shortcutDisplay.value = newShortcut;
            Storage.set({shortcut: keysPressed });
        }
        keysPressed = [];
    }


});