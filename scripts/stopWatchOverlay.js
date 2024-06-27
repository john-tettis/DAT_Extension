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
//add styles here to fix to screen
//add logic to update time
const style = document
container.innerHTML = html;
console.log(container)
document.body.appendChild(container);