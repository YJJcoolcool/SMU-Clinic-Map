# SMU Clinic Map

Web-based map that shows available clinics covered under SMU's Income Insurance Policy.

<https://yjjcoolcool.github.io/SMU-Clinic-Map>

![SMU Clinic Map banner image](<SMU-Clinic-Map.webp>)

## The Problem

SMU's group insurance scheme covers clinic visits for specific clinics. However, the list of covered clinics is provided in an Excel file with multiple tabs and many rows of clinic information.

**Imagine this - you're sick and need to see a doctor quickly.** You obviously don't have the time nor energy to search through that Excel file for a nearby clinic, AND one that's currently open!

Hence, I built SMU Clinic Map, a simple and fast way to find your nearest open clinic.

## Contributing

As the panel list is updated every once in a while, clinics and their information will need to be updated here.

SMU Clinic Map has a Data Processing Tool built to handle the pre-processing of the clinic data before it is published to the user-facing side. Here's how you can contribute!

1. Download the latest **Panel GP Clinic Listing** from SMU's Medical Insurance page: <https://www.smu.edu.sg/campus-life/campus-safety/student-insurance/medical>

2. Access the Data Processing Tool here: <https://yjjcoolcool.github.io/SMU-Clinic-Map/data-processor>

3. Upload the Excel file in Step 1.

4. For Step 2, an email address is required to query the Nominatim API for the coordinates of clinics, and a Gemini API key is required for formatting the clinic's opening hours into an OSM standard string. You can create a Gemini API key for free at: <https://aistudio.google.com>

5. Below that, a table should have appeared with the listing of all clinics. This is where you can modify any incorrect details (e.g., typos) and enter in the coordinates and opening hours of the clinics either manually or using Nominatim/Gemini through the buttons.

6. Any changes are automatically updated in the final JSON file in Step 3. When you are done, press Download.

7. In this Github repository, upload the updated `clinics.json` file in the root directory and create a pull request!

## AI Declaration

Google's Gemini was used **only** for generating the code used to handle opening hours, and organising the code into different modules. Everything else was written manually by me.

## Components of the Project

While the end product looks simple, what goes on behind the scenes was immensely more complex than I thought when I started the project. For a start, here is a breakdown of components used in the project:

### Pre-Processing Side

- **[SheetJS](https://sheetjs.com/)**: Library used to read Excel files.
- **[Nominatim API](https://nominatim.org/)**: Used to lookup addresses and returns coordinates, to then place clinic markers on the map.
- **[Gemini](https://cloud.google.com/ai/gemini)**: Used to format opening hours into OSM compatible syntax (which is a lot more complex than you think!)

### User-facing Side

- **[Leaflet](https://leafletjs.com/)**: Library used to display maps and map markers.
- **[simple-opening-hours](https://github.com/wbkd/simple-opening-hours/)**: Library that parses opening hours and provides functions that calculate if a place is open.
- **[data.gov.sg (Singapore Public Holidays dataset)](https://data.gov.sg/datasets/d_8ef23381f9417e4d4254ee8b4dcdb176/view)**: Because you also have to consider public holiday opening hours!
- **Filtering module**: To show only clinics that are currently open.

## Opening Hours - More complicated than you think!

One of the biggest challenges in this project was dealing with opening hours. To us humans, something like this wouldn't be *too* bad to comprehend:

```text
MON - FRI: 8:30AM - 12:30PM
MON, TUE, THU: 130PM - 4PM, 6PM - 9PM
WED, FRI: 1PM - 4PM
SAT: 830AM - 12PM
SUN: CLOSED
PH: CLOSED
```

But, let's put ourselves into the mind of a computer. Already within the first 3 lines, we have 3 different, overlapping opening hours. Some are day ranges (`MON - FRI`), others are individual days seperated by a comma (`WED, FRI`). Some timings have colons (`8:30AM`), others are just the hour without minutes (`9PM`)... you get the idea.

I was almost thinking of storing every single minute of the day as 1s and 0s to represent open/close (thankfully I did not) when I thought - "shouldn't there already be a solution for this?"

Turns out, there is! OpenStreetMap has an `opening_hours` tag for places, and there's an entire [wiki page](https://wiki.openstreetmap.org/wiki/Key:opening_hours) just explaining how the format works. And, there's the open-source simple-opening-hours library that help to parse this data and tell you whether a place is currently open or not.

But there's still a gap - how do I convert that raw opening hours text into an OSM-standard string?

I spent a good while trying to write a formatting tool that did that, but the complexities of opening hours proved to be too difficult, until...

Introducing - ✨**AI**✨!!!! Why rack my brain trying to do this manually when AI can help me format the string in less than a second?

In all honesty though, I feel that this is one of the rare cases where using AI is the most justifiable way to approach this problem, given how complex opening hours are to format.

## Thank you for listening to my TED talk.
