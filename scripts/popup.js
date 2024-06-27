//update timer immediately to ensure accurate display

function updateTime(){
    const display = document.getElementById('display')
    display.innerText= stopwatch.formattedTime()

}
setInterval(updateTime,500)
 //TIMER LOGIC
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