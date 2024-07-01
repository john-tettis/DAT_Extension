//formats milliseconds into hour:min:sec
function formattedTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingSeconds = seconds % 60;
    const remainingMinutes = minutes % 60;

    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
//timer HTML
const html = `
<div class="timer timer-ext">
    <p id="display">00:00:00</p>
    <div class="buttons">
    </div>
</div>
`
//timer container
const container = document.createElement('div')
container.classList.add('stopwatch-container')


const styles = document.createElement('style')
// css for the timer element
styles.textContent = `
    .stopwatch-container{
        position: fixed;
        right:10px;
        top: 50px;
    }
    .timer-ext{
        position: absolute;
        padding:4px;
        border-radius:5px;
        border: solid black 2px;
    }
    #display{
        margin:0;
        }
`;
//add logic to update time
//put the stopwatch display inside the container
container.innerHTML = html;
console.log(container);
document.body.appendChild(container);
document.body.appendChild(styles);
//displaty element
const display = document.getElementById('display')


//where we store our stopwatch data
let stopwatch = {
    startTime:0,
    elapsedTime:0,
    isRunning:false
}


//fetch initial stopwatch time
chrome.storage.local.get(['startTime','isRunning', 'elapsedTimeg'],(data)=>{
    const {elapsedTime,startTime, isRunning} = data;
    stopwatch = { 
        elapsedTime: elapsedTime ? elapsedTime : stopwatch.elapsedTime,
        startTime: startTime ? startTime : stopwatch.startTime,
        isRunning: isRunning ? isRunning : stopwatch.isRunni
     };
     setInterval(()=>{
        const time = formattedTime(stopwatch.elapsedTime +(Date.now() - stopwatch.startTime))
        display.textContent = time;

    },500)
    

})
// Add a listener to detect changes in chrome.storage.local
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if(namespace == 'local'){
        const {elapsedTime,startTime, isRunning} = changes
        let newStopWatch = {
            elapsedTime: elapsedTime ? elapsedTime.newValue : stopwatch.elapsedTime,
            startTime: startTime ? startTime.newValue : stopwatch.startTime,
            isRunning: isRunning ? isRunning.newValue : stopwatch.isRunning
         };
         stopwatch =newStopWatch
    }
});

