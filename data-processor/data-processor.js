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

            // Clean up data, removing whitespace and ensuring proper form of headers
            jsonData.forEach((clinic) => {
                for (const [key, value] of Object.entries(clinic)) {
                    let cleanedKey = key.trim().toUpperCase();
                    let cleanedValue =
                        typeof value === "string" ? value.trim() : value;
                    delete clinic[key];
                    clinic[cleanedKey] = cleanedValue;
                }
            });
        } else if (fileExtension === "json") {
            jsonData = JSON.parse(data);
            console.log(JSON.parse(data));
        }

        // Display the jsonData
        displayJSONData();

        // Call the dataIntoRows function
        dataIntoRows();
    };

    if (fileExtension === "xlsx" || fileExtension === "xls") {
        reader.readAsArrayBuffer(file);
    } else if (fileExtension === "json") {
        reader.readAsText(file);
    }
}

function displayJSONData() {
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
    displayJSONData();
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
