// // Fetch the HTML content file
// fetch(chrome.runtime.getURL('./html/stopWatchOverlay.html'))
//     .then(response => response.text())
//     .then(html => {
//         const container = document.createElement('div')
//         container.textContent = html;
//         console.log(container)
//         document.body.appendChild(container);
        
//     });
const html = `
<!-- <script src='main.js'></script> -->
<div class="timer">
    <p id="display">00:00:00</p>
    <div class="buttons">
        <button id="toggleBtn">Start</button>
        <button id="resetBtn">Reset</button>
    </div>
</div>
`
const container = document.createElement('div')
container.classList.add('stopwatch-container')
//add styles here to fix to screen
const styles = document.createElement('style')
// Apply CSS rules to the style element
styles.textContent = `
    .stopwatch-container{
        position: fixed;
        right:10px;
        top: 50px;
        width: 100px; /* Set width as needed */
        height: 100px; /* Set height as needed */
        background-color: blue; /* Set background color */
    }
    .timer{
        position: absolute;
    }
`;
//add logic to update time
//put the stopwatch display inside the container
container.innerHTML = html;
console.log(container);
document.body.appendChild(container);
document.body.appendChild(styles);