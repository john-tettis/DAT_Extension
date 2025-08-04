function stopWatchOverlay(){
    // Formats milliseconds into hour:min:sec
    function formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingSeconds = seconds % 60;
        const remainingMinutes = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function updateTimer() {
        let formattedTime = '';
        if (stopwatch.isRunning) {
            formattedTime = formatTime(stopwatch.startTime === 0 ? 0 : stopwatch.elapsedTime + (Date.now() - stopwatch.startTime));
        } else {
            formattedTime = formatTime(stopwatch.elapsedTime);
        }
        // Throttle DOM updates to improve performance
        if (display.innerText !== formattedTime) {
            display.innerText = formattedTime;
        }
        window.requestAnimationFrame(updateTimer);
    }

    // Object to hold our Stopwatch data
    const stopwatch = {
        startTime: 0,
        elapsedTime: 0,
        isRunning: false
    };

    // Change from innerHTML to programati c construction; Will
    // save trouble if ever published to an extension store.
    const container = document.createElement('div');
    container.classList.add('stopwatch-container');

    const timerExt = document.createElement('div');
    timerExt.classList.add('timer', 'timer-ext');
    container.append(timerExt);

    const display = document.createElement('p');
    display.id = 'display';
    display.innerText = '00:00:00';
    timerExt.append(display);

    const buttons = document.createElement('div');
    buttons.classList.add('buttons');
    timerExt.append(buttons);

    document.body.append(container);

    // Styling for the timer element
    const styles = document.createElement('style');
    styles.textContent = `
        .stopwatch-container {
            position: fixed;
            right: 10px;
            top: 60px;
            transition: top 0.4s;
            margin-right: 10px;
            width:100px
            height:50px;
            display: inline-block;
            z-index:100;
        }

        .timer-ext{
            padding: 4px;
            border-radius: 5px;
            border: solid black 2px;
            background:white;
            cursor: pointer;
        }

        #display{
            margin: 0;
        }
    `;
    document.head.append(styles);

    //fetch initial stopwatch time
    chrome.storage.local.get(['startTime', 'isRunning', 'elapsedTime'], (data) => {
        const { elapsedTime, startTime, isRunning } = data;
        stopwatch.elapsedTime = elapsedTime || stopwatch.elapsedTime;
        stopwatch.startTime = startTime || stopwatch.startTime;
        stopwatch.isRunning = isRunning || stopwatch.isRunning;
        updateTimer();
    });

    // Add a listener to detect changes in chrome.storage.local
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local') {
            const { elapsedTime, startTime, isRunning } = changes;
            stopwatch.elapsedTime = elapsedTime ? elapsedTime.newValue : stopwatch.elapsedTime;
            stopwatch.startTime = startTime ? startTime.newValue : stopwatch.startTime;
            stopwatch.isRunning = isRunning ? isRunning.newValue : stopwatch.isRunning;
        }
    });

    // Height of navbar excluding padding
    const navbarHeight = document.querySelector('.navbar').clientHeight;
    const tableHeaderArray = [...document.querySelectorAll('.thead')];
    // The height of the tallest table header
    const tableHeaderHeight = tableHeaderArray.reduce((accumulator, element) => {
        return Math.max(element.getBoundingClientRect().height, accumulator);
    }, 0);
    // Because the timer has no inherent height, we use the height of the first child
    // const timerHeight = container.firstChild.getBoundingClientRect().height;
     const timerHeight = container.getBoundingClientRect().height;
    window.addEventListener('scroll', function() {
        if (window.scrollY < navbarHeight) {
            container.style.top =  `${navbarHeight - window.scrollY + 10}px`;
        } else {
            // Same as before, but withe the y value of the timer
            const timerY = container.firstChild.getBoundingClientRect().y;
            // The y values of our table headers
            const yValues = tableHeaderArray.map((element) => element.getBoundingClientRect().y);
            const length = yValues.length;
            const max = 10 + timerHeight + tableHeaderHeight;
            for (let index = 0; index < length; index++) {
                const y = yValues[index];
                if (y < 1) {
                    // Assume the header is stuck to the top, place the top value 10px below it.
                    container.style.top =  `${tableHeaderHeight +  + 10}px`;
                    continue;
                }
                // If the top of the header is below the bottom of the timer, skip it
                if (y > timerY + timerHeight) continue;
                // If the bottom of the header is above the top of the timer, skip it
                if (y + tableHeaderHeight < timerY) continue;
                // Position the timer below the header when covered
                if (timerY < 10 + timerHeight + tableHeaderHeight) {
                    container.style.top = `${y + tableHeaderHeight + 10}px`;
                    container.style.top = `${y + tableHeaderHeight  + 10}px`;
                // Position the timer above the header when possible (Convenient fallback)
                } else {
                    container.style.top = `10px`;
                }
            }
        }
    });
}

chrome.storage.sync.get(['stopWatchOverlay'], (response) => {
    if (response.stopWatchOverlay) {
        stopWatchOverlay();
    }
});
