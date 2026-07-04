/**
 * Service to fetch and manage Singapore Public Holidays from data.gov.sg
 */
export default class SGPublicHolidays {
    constructor() {
        this.baseURL = "https://data.gov.sg/api/action/datastore_search?resource_id=d_8ef23381f9417e4d4254ee8b4dcdb176",
        this.holidays = [];
    }

    /**
     * Fetches public holidays from the API and caches them in the instance.
     * @returns {Promise<string[]>} An array of date strings in YYYY-MM-DD format.
     */
    async loadHolidays() {
        const url = this.baseURL;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Map records directly to an array of string dates: ["2026-01-01", "2026-02-17", ...]
            this.holidays = data.result.records.map(record => record.date);
            console.log("Successfully loaded public holidays from API.");
            
            return this.holidays;
        } catch (error) {
            console.error("Failed to fetch public holidays from API:", error);
            
            return null;
        }
    }

    /**
     * Checks if a given date string or Date object is a public holiday.
     * @param {Date|string} dateInput - The date to check.
     * @returns {boolean} True if the date is a holiday.
     */
    isHoliday(dateInput) {
        const dateStr = dateInput instanceof Date 
            ? dateInput.toISOString().split('T')[0] 
            : dateInput;
            
        return this.holidays.includes(dateStr);
    }

    /**
     * Returns the raw array of stored holiday strings.
     * @returns {string[]}
     */
    getHolidayDates() {
        return this.holidays;
    }
}