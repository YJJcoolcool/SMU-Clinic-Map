// Variable to hold all the clinic information
var jsonData = [];
var editing = {};

const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", handleFileSelection);

function handleFileSelection(event) {
    jsonData = [];

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
    jsonData.forEach((clinic) => {
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

    jsonData.forEach((clinic) => {
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
            nominatimSearch(td[2].value)
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
                const formattedOpeningHours =
                    await formatOpeningHours(originalValue);

                if (formattedOpeningHours) {
                    modifyJSONData(
                        clinicName,
                        "OPENING HOURS",
                        formattedOpeningHours,
                    );
                    td[4].value = formattedOpeningHours;
                } else {
                    td[4].value = originalValue;
                    alert("Could not format opening hours.");
                }
            } catch (error) {
                alert("Error updating opening hours:" + error);
                td[4].value = originalValue;
            } finally {
                buttons[2].disabled = false;
            }
        });

        TABLE_BODY.appendChild(clone);
    });
}

async function formatOpeningHours(...args) {
    const joined = args.join(";");

    const apiKey = document.getElementById("gemini-api-key-input").value.trim();

    if (!apiKey) {
        throw new Error("No API key entered!",);
    }

    return await generateGeminiContent(
        apiKey,
        `
Convert the following raw text into a valid OpenStreetMap (OSM) "opening_hours" value. Return ONLY the final string value. Do not include conversational text and explanations.

CRITICAL OSM SYNTAX RULES:
1. Semicolons (;) separate completely different rules. If day ranges overlap across semicolons, the later rule OVERRIDES and deletes the earlier one.
2. To specify multiple open intervals on the same day (e.g., morning and evening split shifts), use a comma (,) to chain the times or separate rules, NOT a semicolon.
   - WRONG: Mo-Fr 08:00-13:00; Mo,We,Fr 18:00-21:00 (Erases morning hours for Mo, We, Fr)
   - RIGHT: Mo,We,Fr 08:00-13:00,18:00-21:00; Tu,Th 08:00-13:00
   - ALSO RIGHT: Mo-Fr 08:00-13:00, Mo,We,Fr 18:00-21:00
3. Use standard 2-letter day abbreviations: Mo, Tu, We, Th, Fr, Sa, Su, PH (Public Holidays).
4. Use 24-hour time formatting (HH:MM-HH:MM).
5. Use "off" for closed days.

Text to format: "${joined}"
`,
    );
}

/**
 * Update the global jsonData variable, while also updating the last updated date
 * @param clinicName Name of the clinic to update
 * @param attributeName Name of the attribute to update
 * @param newValue The new value of the attribute
 */
function modifyJSONData(clinicName, attributeName, newValue) {
    // Set last updated attribute of the jsonData
    const date = new Date();
    const dateStr = `${date.getUTCFullYear()}-${("0" + date.getUTCMonth()).slice(-2)}-${date.getUTCDate()}`;

    jsonData["last_modified"] = dateStr;

    // Find the clinic in the data, then update the respective attribute
    for (clinic of jsonData) {
        if (clinic["CLINIC"] === clinicName) {
            delete clinic[attributeName];
            clinic[attributeName] = newValue;
            break;
        }
    }
    displayRawJSONData();
}

function download() {
    if (jsonData.length <= 0) {
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
}

async function nominatimSearch(addressString) {
    let email = document.getElementById("email-input").value;
    email = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.exec(email);

    if (!email) {
        throw new Error(
            "No email address entered! Ensure you enter a valid email address.",
        );
    }
    email = email[0];

    let postalCode = /SINGAPORE (\d{6})/.exec(addressString)[1];

    let url = `https://nominatim.openstreetmap.org/search?country=SINGAPORE&postalcode=${postalCode}&format=json&email=${email}`;
    console.log("Querying URL: " + url);

    const response = await fetch(url);
    const data = await response.json();

    if (data.length <= 0) {
        throw new Error(
            "Nothing returned from query! The POI may not exist on OpenStreetMap.",
        );
    } else {
        console.log(data);
        return data[0]["lat"] + ", " + data[0]["lon"];
    }
}

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
