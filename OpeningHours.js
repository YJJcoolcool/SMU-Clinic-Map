import { SimpleOpeningHours } from 'https://cdn.jsdelivr.net/npm/simple-opening-hours@0.1.1/+esm';

export default class OpeningHours {
    constructor(osmString) {
        if (!osmString) {
            this.parser = null;
            return;
        }

        try {
            this.parser = new SimpleOpeningHours(osmString);
        } catch (error) {
            console.error(error);
            this.parser = null;
        }
    }

    isOpen(date = new Date()) {
        if (!this.parser) return false;
        return this.parser.isOpenOn(date);
    }
}