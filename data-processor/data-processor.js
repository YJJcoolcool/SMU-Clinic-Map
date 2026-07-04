import GeminiDateFormatter from './GeminiDateFormatter.js';
import NominatimService from './NominatimService.js';

// Variable to hold all the clinic information
var jsonData = {};
var editing = {};

const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", handleFileSelection);

function handleFileSelection(event) {
    jsonData = {};

    const file = event.target.files[0];

    // Check that the file exists
    if (!file) alert("No file selected. Please choose a file.", "error");

    const fileExtension = file.name.split(".").pop().toLowerCase();

    const reader = new FileReader();

    reader.onload = (e) => {
        const data = e.target.result;

        if (fileExtension === "xlsx" || fileExtension === "xls") {
            const workbook = XLSX.read(data, { type: "array" });

            // Go through each sheet (NORTH, NORTH-EAST, etc.)
            workbook.SheetNames.forEach((sheetName) => {
                let jsonDataCurrentSheet;

                const worksheet = workbook.Sheets[sheetName];

                // First extraction of entire sheet
                jsonDataCurrentSheet = XLSX.utils.sheet_to_json(worksheet);

                // Look through the worksheet to find the header row
                let headerRow = 0;
                for (const row of jsonDataCurrentSheet) {
                    // Search for the "No." header that only appears in the header row
                    if (Object.values(row).includes("No.")) {
                        headerRow = row.__rowNum__;
                        break;
                    }
                }

                // Second extraction of the worksheet with only the clinics' details
                jsonDataCurrentSheet = XLSX.utils.sheet_to_json(worksheet, {
                    range: headerRow,
                });

                console.log(sheetName);
                console.log("Excel Data:", jsonDataCurrentSheet);

                jsonData = jsonData.concat(jsonDataCurrentSheet);
            });
        } else if (fileExtension === "json") {
            jsonData = JSON.parse(data);
        }

        // Clean up data, removing whitespace and ensuring proper form of headers
        cleanAndFormatJSONData();

        // Display the raw jsonData
        displayRawJSONData();

        // Call the dataIntoRows function
        dataIntoRows();
    };

    if (fileExtension === "xlsx" || fileExtension === "xls") {
        reader.readAsArrayBuffer(file);
    } else if (fileExtension === "json") {
        reader.readAsText(file);
    }
}

function cleanAndFormatJSONData() {
    jsonData["clinics"].forEach((clinic) => {
        // Convert all keys to uppercase, trim whitespace of keys & values
        for (const [key, value] of Object.entries(clinic)) {
            let cleanedKey = key.trim().replace(/\s\s+/g, " ").toUpperCase();
            let cleanedValue =
                typeof value === "string"
                    ? value.trim().replace(/\s\s+/g, " ")
                    : value;
            delete clinic[key];
            clinic[cleanedKey] = cleanedValue;
        }

        // Remove redundant "NO." key
        delete clinic["NO."];
    });
}

/**
 * Displays the JSON data in text form in the output textarea
 */
function displayRawJSONData() {
    document.getElementById("output").innerHTML = JSON.stringify(jsonData);
}

function dataIntoRows() {
    const TABLE_BODY = document.getElementById("table-body");
    TABLE_BODY.innerHTML = "";

    jsonData["clinics"].forEach((clinic) => {
        const clone = document.importNode(
            document.getElementById("table-row-template").content,
            true,
        );

        let td = clone.querySelectorAll("textarea");

        let clinicName = (td[0].value = clinic["CLINIC"]);
        let clinicArea = (td[1].value = clinic["AREA"]);
        let clinicAddress = (td[2].value = clinic["ADDRESS"]);
        let clinicCoordinates = (td[3].value = clinic["COORDINATES"] || "");
        let clinicOpeningHours = (td[4].value =
            clinic["OPENING HOURS"] ||
            [
                clinic["OPENING HOURS 1"],
                clinic["OPENING HOURS 2"],
                clinic["OPENING HOURS 3"],
                clinic["OPENING HOURS 4"],
            ].join(";") ||
            "");

        // Clinic Name
        td[0].addEventListener("focus", () => {
            editing = {
                CLINIC: clinicName,
                ATTRIBUTE: "CLINIC",
            };
        });
        td[0].addEventListener("input", (event) => {
            editing["NEW_VALUE"] = event.target.value;
            modifyJSONData(
                editing["CLINIC"],
                editing["ATTRIBUTE"],
                editing["NEW_VALUE"],
            );
        });

        // Clinic Area
        td[1].addEventListener("focus", () => {
            editing = {
                CLINIC: clinicName,
                ATTRIBUTE: "AREA",
            };
        });
        td[1].addEventListener("input", (event) => {
            editing["NEW_VALUE"] = event.target.value;
            modifyJSONData(
                editing["CLINIC"],
                editing["ATTRIBUTE"],
                editing["NEW_VALUE"],
            );
        });

        // Clinic Address
        td[2].addEventListener("focus", () => {
            editing = {
                CLINIC: clinicName,
                ATTRIBUTE: "ADDRESS",
            };
        });
        td[2].addEventListener("input", (event) => {
            editing["NEW_VALUE"] = event.target.value;
            modifyJSONData(
                editing["CLINIC"],
                editing["ATTRIBUTE"],
                editing["NEW_VALUE"],
            );
        });

        // Clinic Coordinates
        td[3].addEventListener("focus", () => {
            editing = {
                CLINIC: clinicName,
                ATTRIBUTE: "COORDINATES",
            };
        });
        td[3].addEventListener("input", (event) => {
            editing["NEW_VALUE"] = event.target.value;
            modifyJSONData(
                editing["CLINIC"],
                editing["ATTRIBUTE"],
                editing["NEW_VALUE"],
            );
        });

        // Clinic Opening Hours
        td[4].addEventListener("focus", () => {
            editing = {
                CLINIC: clinicName,
                ATTRIBUTE: "OPENING HOURS",
            };
        });
        td[4].addEventListener("input", (event) => {
            editing["NEW_VALUE"] = event.target.value;
            modifyJSONData(
                editing["CLINIC"],
                editing["ATTRIBUTE"],
                editing["NEW_VALUE"],
            );
        });

        let buttons = clone.querySelectorAll("button");

        // Query Coordinates Button
        buttons[0].addEventListener("click", () => {
            tempDisableAllQueryButtons();

            const email = document.getElementById("email-input").value;
            const postalCode = /SINGAPORE (\d{6})/.exec(td[2].value)[1];

            const nominatimService = new NominatimService(email);
            nominatimService.searchPostalCode(postalCode)
                .then((latlon) => {
                    if (!latlon) {
                        throw new Error(
                            "Query failed for clinic: " +
                                clinicName +
                                ". Check console for more info.",
                        );
                    }
                    console.log(latlon);
                    modifyJSONData(clinicName, "COORDINATES", latlon);
                    td[3].value = latlon;
                })
                .catch((error) => {
                    alert(error.message);
                });
        });

        // Open Coordinates Button
        buttons[1].addEventListener("click", () => {
            const latlon = td[3].value.trim();

            if (!latlon) {
                alert("No coordinates entered!");
                return;
            }

            const url = `https://www.google.com/maps/search/?api=1&query=${latlon}`;

            window.open(url, "_blank");
        });

        // Format Opening Hours Button
        buttons[2].addEventListener("click", async () => {
            const originalValue = td[4].value;
            td[4].value = "Formatting...";
            buttons[2].disabled = true;

            try {
                const apiKey = document.getElementById("gemini-api-key-input").value.trim();
                const dateFormatter = new GeminiDateFormatter(apiKey);
                
                const formattedOpeningHours =
                    await dateFormatter.formatOpeningHours(originalValue);
                
                console.log("Formatted opening hours string:", formattedOpeningHours);

                if (formattedOpeningHours) {
                    modifyJSONData(
                        clinicName,
                        "OPENING HOURS",
                        formattedOpeningHours,
                    );
                    td[4].value = formattedOpeningHours;
                } else {
                    td[4].value = originalValue;
                    alert("Could not format opening hours. Check console for more info.");
                }
            } catch (error) {
                alert("Error while formatting opening hours:" + error);
                td[4].value = originalValue;
            } finally {
                buttons[2].disabled = false;
            }
        });

        TABLE_BODY.appendChild(clone);
    });
}

/**
 * Update the global jsonData variable, while also updating the last updated date
 * @param clinicName Name of the clinic to update
 * @param attributeName Name of the attribute to update
 * @param newValue The new value of the attribute
 */
function modifyJSONData(clinicName, attributeName, newValue) {
    console.log(clinicName, attributeName, newValue)
    // Set last updated attribute of the jsonData
    const date = new Date();
    const dateStr = `${date.getUTCFullYear()}-${("0" + date.getUTCMonth()).slice(-2)}-${("0"+date.getUTCDate()).slice(-2)}`;

    jsonData["last_modified"] = dateStr;

    // Find the clinic in the data, then update the respective attribute
    for (let clinic of jsonData["clinics"]) {
        if (clinic["CLINIC"] === clinicName) {
            delete clinic[attributeName];
            clinic[attributeName] = newValue;
            break;
        }
    }

    // Update the clinic name in the global editing variable if the clinic name was changed
    if (attributeName === "CLINIC") {
        editing["CLINIC"] = newValue;
    }

    displayRawJSONData();
}

document.getElementById("download-btn").addEventListener("click", () => {
    if (jsonData["clinics"].length <= 0) {
        alert(
            "No data! Check that you have uploaded a file and the data is processed successfully.",
        );
        return;
    }

    const jsonString = JSON.stringify(jsonData);

    // Create a Blob containing the JSON data
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a ObjectURL to download the file
    const url = URL.createObjectURL(blob);

    // Create a hidden link and trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.download = "clinics.json";

    // Trigger the download
    link.click();

    // Clean up by revoking the URL
    URL.revokeObjectURL(url);
});

function tempDisableAllQueryButtons() {
    document.querySelectorAll(".query-button").forEach((elem) => {
        elem.disabled = true;
    });

    window.setTimeout(() => {
        document.querySelectorAll(".query-button").forEach((elem) => {
            elem.disabled = false;
        });
    }, 1500);
}
