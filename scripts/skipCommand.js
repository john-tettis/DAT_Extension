
let keysPressed = [];
let SHORTCUT = [];
//selects skip button and clicks it
function skip(){
  const skipButton = document.getElementById("skip_button")
  if(!skipButton){
    console.log("Task Not skippable, or no skip button detected")
    return
  }
  skipButton.click()
}
/*Records button presses to validate command
*ignores duplicate keypresses to sanitize values
* if global SHORTCUT is pressed, skips
*
*/
async function recordKeyCombination(event) {
    await loadStorage()
    const key = event.key.toUpperCase();
    //if key is special command key, put it first
    if (!keysPressed.includes(key) && (key === 'CONTROL' || key === 'ALT' || key === 'SHIFT')) {
        keysPressed.push(key);
    } 
    //otherwise, if there has already been an key logged, and the key is not a special key
    else if (keysPressed.length > 0 && !['CONTROL', 'ALT', 'SHIFT'].includes(key)) {
      //add key to observer
        keysPressed.push(key);
        console.log(SHORTCUT)
        if(keysPressed.join('') == SHORTCUT.join('')){
          event.preventDefault()
          skip()
        }
        stopRecording()
    }
    
    
}
//clear out keys 
function stopRecording(event) {
  keysPressed = [];
}
  keysPressed = [];



async function loadStorage(){
  chrome.storage.sync.get(['shortcut'], (result) => {
    //if it hasnt, use default
    if(!result.shortcut){
        SHORTCUT =["CONTROL","/"];
    }
    //if is has been set, use keybinds in storage
    else{
        SHORTCUT = result.shortcut;
    }
  });

}
//start event listeneres for commands
document.addEventListener('keydown', recordKeyCombination);
//reset observer
document.addEventListener('keyup', stopRecording);

