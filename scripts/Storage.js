class Storage {
    /**
     * Retrieves values from chrome.storage.sync based on given keys and default values.
     *
     * @param {string[]} keys - An array of keys to look up in storage.
     * @param {any[]} defaultValues - An array of default values corresponding to the keys.
     * @returns {Promise<object>} A promise that resolves with an object containing the retrieved values.
     */
    static get(keys, defaultValues) {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError); // Handle potential errors
          } else {
            // Merge retrieved values with defaults for missing keys
            const values = Object.fromEntries(
              keys.map((key, i) => [key, result[key] ?? defaultValues[i]])
            );
            resolve(values);
          }
        });
      });
    }
   
    /**
     * Sets key-value pairs in chrome.storage.sync, updating existing data.
     *
     * @param {object} data - An object containing key-value pairs to store.
     * @returns {Promise<void>} A promise that resolves when the data is successfully stored.
     */
    static set(data) {
      return new Promise((resolve, reject) => {
        // Fetch existing data first
        chrome.storage.sync.get(null, (existingData) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            // Merge new data with existing data
            const updatedData = { ...existingData, ...data };
  
            // Store the updated data
            chrome.storage.sync.set(updatedData, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          }
        });
      });
    }
  }

