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

    const reader = new FileReader();

    reader.onload = (e) => {
        const data = e.target.result;
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

        // Display the jsonData
        displayJSONData();

        // Call the dataIntoRows function
        dataIntoRows();
    };

    reader.readAsArrayBuffer(file);
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

        let clinicName = td[0].value = clinic["CLINIC"];
        let clinicArea = td[1].value = clinic["AREA"];
        let clinicAddress = td[2].value = clinic["ADDRESS"];
        let clinicCoordinates = td[3].value = clinic["COORDINATES"] || "";

        td[0].addEventListener('focus', () => {
            editing = {
                'CLINIC': clinicName,
                'ATTRIBUTE': "CLINIC"
            }
        })
        td[0].addEventListener('input', (event) => {
            editing['NEW_VALUE'] = event.target.value;
            modifyJSONData(editing['CLINIC'], editing['ATTRIBUTE'], editing['NEW_VALUE']);
        })
        td[1].addEventListener('focus', () => {
            editing = {
                'CLINIC': clinicName,
                'ATTRIBUTE': "AREA"
            }
        })
        td[1].addEventListener('input', (event) => {
            editing['NEW_VALUE'] = event.target.value;
            modifyJSONData(editing['CLINIC'], editing['ATTRIBUTE'], editing['NEW_VALUE']);
        })
        td[2].addEventListener('focus', () => {
            editing = {
                'CLINIC': clinicName,
                'ATTRIBUTE': "ADDRESS"
            }
        })
        td[2].addEventListener('input', (event) => {
            editing['NEW_VALUE'] = event.target.value;
            modifyJSONData(editing['CLINIC'], editing['ATTRIBUTE'], editing['NEW_VALUE']);
        })
        td[3].addEventListener('focus', () => {
            editing = {
                'CLINIC': clinicName,
                'ATTRIBUTE': "COORDINATES"
            }
        })
        td[3].addEventListener('input', (event) => {
            editing['NEW_VALUE'] = event.target.value;
            modifyJSONData(editing['CLINIC'], editing['ATTRIBUTE'], editing['NEW_VALUE']);
        })

        TABLE_BODY.appendChild(clone);

        nominatimSearch(clinic["ADDRESS"])
    });
}

function modifyJSONData(clinicName, attributeName, newValue) {
    for (clinic of jsonData) {
        if (clinic['CLINIC'] === clinicName) {
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

function nominatimSearch(addressString) {
    console.log(/SINGAPORE (\d{6})/.exec(addressString)[1])
}