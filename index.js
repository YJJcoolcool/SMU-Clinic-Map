// Set default view to Singapore
var map = L.map("map").setView([1.356, 103.8], 11);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Check if geolocation permission is enabled, and automatically get location if so
navigator.permissions.query({ name: "geolocation" }).then((result) => {
    if (result.state === "granted") {
        findLocation();
    }
});

var searching_animation;

function findLocation(setView = false) {
    console.log(`Finding location with setView = ${setView}`);
    document.getElementById("my_location").classList.remove("text-blue-500");
    document.getElementById("my_location").classList.remove("text-red-500");

    var searching_animation_state = false;
    searching_animation = window.setInterval(() => {
        document.getElementById("my_location").innerHTML =
            searching_animation_state ? "my_location" : "location_searching";
        searching_animation_state = !searching_animation_state;
    }, 600);

    map.locate({ setView: setView, maxZoom: 16 });
}

map.on("locationfound", (e) => {
    console.log("Location found!");
    clearInterval(searching_animation);
    document.getElementById("my_location").innerHTML = "my_location";
    document.getElementById("my_location").classList.add("text-blue-500");

    L.circle(e.latlng, {
        stroke: false,
        fillColor: "#2b7fff",
        fillOpacity: 0.3,
        radius: e.accuracy,
    }).addTo(map);

    L.circleMarker(e.latlng, {
        color: "white",
        weight: 3,
        fillColor: "#2b7fff",
        fillOpacity: 1,
        radius: 8,
    }).addTo(map);
});

map.on("locationerror", (e) => {
    clearInterval(searching_animation);
    document.getElementById("my_location").innerHTML = "my_location";
    document.getElementById("my_location").classList.add("text-red-500");
    alert(e.message);
});

fetch("./clinics.json")
    .then((res) => res.json())
    .then((out) => displayClinics(out))
    .catch((err) => console.error(err));

function displayClinics(jsonData) {
    // Create a Cluster Group for Leaflet markers
    var markers = L.markerClusterGroup();

    for (clinic of jsonData) {
        console.log(clinic);
        markers.addLayer(
            L.marker(clinic["COORDINATES"].split(", ")).bindPopup(
                `<b>${clinic["CLINIC"]}</b><br>${clinic["ADDRESS"]}`,
            ),
        );
    }

    map.addLayer(markers);
}
