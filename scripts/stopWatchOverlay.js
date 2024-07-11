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
        top: 100px;
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
chrome.storage.local.get(['startTime','isRunning', 'elapsedTime'],(data)=>{
    const {elapsedTime,startTime, isRunning} = data;
    console.log(data)
    stopwatch = { 
        elapsedTime: elapsedTime ? elapsedTime : stopwatch.elapsedTime,
        startTime: startTime ? startTime : stopwatch.startTime,
        isRunning: isRunning ? isRunning : stopwatch.isRunni
     };
    //  console.log(stopwatch)
     function updateTimer(){
        if(stopwatch.isRunning){
            const time = formattedTime(stopwatch.startTime === 0 ? 0 : stopwatch.elapsedTime +(Date.now() - stopwatch.startTime))
            display.textContent = time;
            
        }
        else{
            const time = formattedTime(stopwatch.elapsedTime)
            display.textContent = time;
        }
        window.requestAnimationFrame(updateTimer)
     }
     updateTimer()

})
// Add a listener to detect changes in chrome.storage.local
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if(namespace == 'local'){
        const {elapsedTime,startTime, isRunning} = changes
        console.log(changes)
        let newStopWatch = {
            elapsedTime: elapsedTime ? elapsedTime.newValue : stopwatch.elapsedTime,
            startTime: startTime ? startTime.newValue : stopwatch.startTime,
            isRunning: isRunning ? isRunning.newValue : stopwatch.isRunning
         };
         stopwatch =newStopWatch
        console.log(stopwatch)
    }
});

//event listener to make sure stopwatch does not go on top off navbar
window.addEventListener('scroll', function() {
    // var fixedDiv = document.getElementById('fixedDiv');
    var navbar = document.querySelector('.navbar');
    // console.log(navbar)
    // console.log(window.scrollY,navbar.clientHeight, container.style.top)
    
    if (window.scrollY >= navbar.clientHeight) {
       container.style.top = '50px';
    } else {
      container.style.top =  `${navbar.clientHeight - window.scrollY + 50}px`;
    }
  });
