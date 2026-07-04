export default class NominatimService {
    /**
     * @param {string} email - Email used for identification when using Nominatim.
     * @param {string} country Country to search in. Defaults to Singapore
     */
    constructor(email, country = "SINGAPORE") {
        email = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.exec(email);

        if (!email) {
            throw new Error(
                "Invalid email address entered! Ensure you enter a valid email address.",
            );
        }

        this.email = email[0];
        this.baseURL = `https://nominatim.openstreetmap.org/search?country=${country}&format=json&email=${this.email}`;
    }

    /**
     * Perform a Nominatim lookup using a postal code.
     * @param {string} postalCode String containing the postal code to search
     * @returns A string with the latitude and longitude seperated by ", " e.g., "1.23456, 201.65432"
     */
    async searchPostalCode(postalCode) {
        let url = this.baseURL + `&postalcode=${postalCode}`;
        console.log("Querying URL: " + url);

        const response = await fetch(url);
        const data = await response.json();

        if (data.length <= 0) {
            return null;
        } else {
            console.log(data);
            return data[0]["lat"] + ", " + data[0]["lon"];
        }
    }
}