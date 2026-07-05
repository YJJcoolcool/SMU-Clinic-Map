const defaultCoords = [1.356, 103.8]
const maxBounds = [[1.1, 103.5], [1.6, 104.2]]

// Set default view to Singapore
export var map = L.map("map").setView(defaultCoords, 11);
map.setMaxBounds(maxBounds)

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

document.getElementById("my_location_button").addEventListener('click', () => {
    findLocation(true);
})

// Used to create and delete the animation of the location button
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