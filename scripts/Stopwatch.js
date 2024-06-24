//Stopwatch class stores time elapsed, stores data in chrome.local
// issue #1
class Stopwatch {
    constructor() {
        this.loadData().then(() => {
            if (this.isRunning) {
                const currentTime = performance.now();
                const elapsedTimeSinceStart = currentTime - this.startTime;
                this.startTime = currentTime;
                this.elapsedTime += elapsedTimeSinceStart;
                this.interval = setInterval(() => {
                    this.saveData();
                }, 1000); // Save data every second
            }
        });
    }

    start() {
        if (!this.isRunning) {
            this.startTime = performance.now();
            this.isRunning = true;
            this.saveData();
            this.interval = setInterval(() => {
                this.saveData();
            }, 1000); // Save data every second
        }
    }

    pause() {
        if (this.isRunning) {
            const currentTime = performance.now();
            this.elapsedTime += currentTime - this.startTime;
            this.isRunning = false;
            clearInterval(this.interval);
            this.saveData();
        }
    }

    toggle() {
        this.isRunning ? this.pause() : this.start();
    }

    reset() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        clearInterval(this.interval);
        this.saveData();
    }

    time() {
        if (this.isRunning) {
            const currentTime = performance.now();
            return this.elapsedTime + (currentTime - this.startTime);
        } else {
            return this.elapsedTime;
        }
    }

    formattedTime() {
        const milliseconds = this.time();
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingSeconds = seconds % 60;
        const remainingMinutes = minutes % 60;

        return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    async loadData() {
        const data = await new Promise((resolve) => {
            chrome.storage.local.get(['startTime', 'elapsedTime', 'isRunning'], (data) => {
                resolve(data);
            });
        });
        console.log(data)
        

        this.startTime = data.startTime || 0;
        this.elapsedTime = data.elapsedTime || 0;
        this.isRunning = data.isRunning || false;
        console.log(this)
    }

    async saveData() {
        console.log(this)
        const dataToSave = {
            startTime: this.startTime,
            elapsedTime: this.elapsedTime,
            isRunning: this.isRunning,
        };
        await new Promise((resolve) => {
            chrome.storage.local.set(dataToSave, () => {
                resolve();
            });
        });
    }
}

const stopwatch = new Stopwatch();
