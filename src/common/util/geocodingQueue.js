const MAX_REQUESTS_PER_MINUTE = 100; // slightly below 60 for safety margin
const INTERVAL_MS = Math.ceil(60000 / MAX_REQUESTS_PER_MINUTE); // ~1091ms between requests

class GeocodingQueue {
  constructor() {
    this.queue = [];
    this.isRunning = false;
    this.lastCallTime = 0;
  }

  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      if (!this.isRunning) {
        this.run();
      }
    });
  }

  async run() {
    this.isRunning = true;
    while (this.queue.length > 0) {
      const now = Date.now();
      const wait = INTERVAL_MS - (now - this.lastCallTime);
      if (wait > 0) {
        await new Promise((r) => setTimeout(r, wait));
      }
      const { fn, resolve, reject } = this.queue.shift();
      this.lastCallTime = Date.now();
      try {
        resolve(await fn());
      } catch (err) {
        reject(err);
      }
    }
    this.isRunning = false;
  }

  clear() {
    this.queue = [];
  }
}

const geocodingQueue = new GeocodingQueue();
export default geocodingQueue;
