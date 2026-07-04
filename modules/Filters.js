export default class Filters {
    constructor(onFilterChangeCallback) {
        // Default filters
        this.state = {
            open_only: false,
            open_in_mins: 0,
        };

        // Run the callback function whenever a filter changes
        this.onFilterChange = onFilterChangeCallback;
    }

    /**
     * Toggles boolean filters like 'open_only'
     * @param {string} filterName
     */
    toggleFilter(filterName) {
        if (typeof this.state[filterName] !== "boolean") {
            throw new Error(`Filter "${filterName}" is not a boolean!`);
        }

        this.state[filterName] = !this.state[filterName];

        // Trigger the map update callback
        if (this.onFilterChange) this.onFilterChange();
    }

    /**
     * Sets valued filters like 'open_in_mins'
     * @param {string} filterName
     * @param {*} value
     */
    setFilter(filterName, value) {
        this.state[filterName] = value;

        // Trigger the map update callback
        if (this.onFilterChange) this.onFilterChange();
    }

    /**
     * Helper to get a quick look at current state
     * @param {string} filterName
     */
    get(filterName) {
        return this.state[filterName];
    }
}
