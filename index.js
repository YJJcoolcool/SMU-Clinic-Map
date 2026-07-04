import { map } from "./Map.js";
import OpeningHours from "./OpeningHours.js";
import Filters from "./Filters.js";

// Initialise filters, running displayClinics() each time filters are updated
const filters = new Filters(displayClinics);

const toggleOpenBtn = document.getElementById("btn-toggle-open");
toggleOpenBtn.addEventListener("click", () => {
    filters.toggleFilter("open_only");

    if (filters.get("open_only")) {
        toggleOpenBtn.classList.remove("bg-white");
        toggleOpenBtn.classList.add("bg-slate-300");
    } else {
        toggleOpenBtn.classList.remove("bg-slate-300");
        toggleOpenBtn.classList.add("bg-white");
    }
});

var jsonData;

fetch("./clinics.json")
    .then((res) => res.json())
    .then((out) => {
        jsonData = out;

        document.getElementById("last-updated").innerHTML = jsonData["last_modified"];

        displayClinics();
    })
    .catch((err) => console.error(err));

// Create a Cluster Group for Leaflet markers
var markers = L.markerClusterGroup();
map.addLayer(markers);

function displayClinics() {
    // Clear currently displayed markers if any
    markers.clearLayers();

    for (const clinic of jsonData["clinics"]) {
        const openingHours = new OpeningHours(clinic["OPENING HOURS"]);

        // Check if the open_only filter is applied and filter if so
        if (filters.get("open_only") && !openingHours.isOpen()) {
            continue;
        }

        // console.log(clinic);

        const clone = document.importNode(
            document.getElementById("popup-template").content,
            true,
        );

        const popupContent = clone.firstElementChild;

        let openStatus = "";
        const oneHourFromNow = new Date();
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        if (openingHours.parser) {  
            if (openingHours.isOpen()) {
                if (openingHours.isOpen(oneHourFromNow)) {
                    openStatus = "🟢OPEN - ";
                } else {
                    openStatus = "🟠CLOSES SOON - ";
                }
            } else {
                if (openingHours.isOpen(oneHourFromNow)) {
                    openStatus = "🟡OPENS SOON - "
                } else {
                    openStatus = "🔴CLOSED - ";    
                }
            }
        }
        popupContent.querySelector(".clinic-name").innerHTML = openStatus + clinic["CLINIC"];
        popupContent.querySelector(".clinic-address").innerHTML =
            clinic["ADDRESS"];
        popupContent.querySelector(".clinic-address").href =
            `https://www.google.com/maps/search/?api=1&query=${clinic["CLINIC"]}`;
        popupContent.querySelector(".clinic-phone").innerHTML =
            clinic["TEL NO."];
        popupContent.querySelector(".clinic-phone").href =
            `tel:${clinic["TEL NO."]}`;

        if ("REMARKS" in clinic && clinic["REMARKS"]) {
            popupContent.querySelector(".clinic-remarks").innerHTML =
                clinic["REMARKS"];
            popupContent
                .querySelector(".clinic-remarks")
                .parentNode.classList.remove("hidden");
        }

        if (openingHours.parser) {
            const table = openingHours.parser.getTable();
            const gridContainer = popupContent.querySelector(".clinic-oh-grid");

            const dayLabels = {
                mo: [1, "Mon"],
                tu: [2, "Tue"],
                we: [3, "Wed"],
                th: [4, "Thu"],
                fr: [5, "Fri"],
                sa: [6, "Sat"],
                su: [0, "Sun"],
                ph: [-1, "PH"],
            };

            let gridHTML = "";
            for (const [key, value] of Object.entries(dayLabels)) {
                const times = table[key];
                const timeString =
                    times && times.length > 0 ? times.join(", ") : "Closed";
                const isToday = new Date().getDay() === value[0];

                gridHTML += `<div ${(isToday)?"class='font-bold'":""}>${value[1]}:</div><div class="${(isToday)?"font-bold":""} ${timeString === "Closed" ? "text-red-500" : ""}">${timeString}</div>`;
            }

            gridContainer.innerHTML = gridHTML;

            const detailsElement = popupContent.querySelector(
                ".clinic-oh-container",
            );
            detailsElement.classList.remove("hidden");

            detailsElement.addEventListener("toggle", (event) => {
                if (event.target.open) {
                    map.panBy([0, -200], { animate: true });
                } else {
                    map.panBy([0, 200], { animate: true });
                }
            });
        }

        let marker = L.marker(clinic["COORDINATES"].split(", ")).bindPopup(
            popupContent,
        );

        marker.on("click", (e) => {
            map.panTo(e.latlng);
        });
        markers.addLayer(marker);
    }
}
