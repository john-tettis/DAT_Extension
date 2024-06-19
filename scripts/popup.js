
console.log(Storage)
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




    const filterProjects = document.getElementById('sort-pay')
    //check for user preference on sortPay, if none found, insert default into storage.
    //Update checkbox to reflect stored value
    
    
    // retreive storage data for form info
    Storage.get(['shortcut','sortPay'],[["CONTROL","/"],true])
    .then((result) => {
        //shortcut info handled here
        shortcutDisplay.value = readableKeys(result.shortcut).join(" + ")           
        //sort projects handled here
            filterProjects.checked = result.sortPay;
        })

 

    //listen for checkbox to be clicked to affect whether or not to filter projects on main page load
    filterProjects.addEventListener("change",(e)=>{
        const value = e.target.checked
        chrome.storage.sync.set({sortPay:value})
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