// ================= Node.js Script: fetchShows2.js =================

import fs from "fs";
import path from "path";

// Karnataka cities
const karnatakaCities = [
  { name: "Bengaluru", code: "BANG", slug: "bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Mysore", code: "MYS", slug: "mysore", lat: 12.2958, lon: 76.6394 },
  { name: "Hubli", code: "HUBL", slug: "hubli", lat: 15.3647, lon: 75.1237 },
  { name: "Gulbarga", code: "GULB", slug: "gulbarga", lat: 17.3297, lon: 76.8343 },
  { name: "Shivamogga", code: "SHIA", slug: "shivamogga", lat: 13.9299, lon: 75.5681 },
  { name: "Belagavi", code: "BELG", slug: "belagavi", lat: 15.8497, lon: 74.4977 },
  { name: "Tumkur", code: "TUMK", slug: "tumkur", lat: 13.3392, lon: 77.1135 },
  { name: "Kundapura", code: "KUNA", slug: "kundapura", lat: 13.4333, lon: 74.75 },
  { name: "Manipal", code: "MANI", slug: "manipal", lat: 13.3567, lon: 74.7861 },
  { name: "Mangalore", code: "MLR", slug: "mangalore", lat: 12.9141, lon: 74.856 },
];

// Event code
const eventCode = "ET00377351";

// ================= Helpers ================= //
function getDateString(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function getOutputDir(date) {
  const baseDir = path.join(".", "output_karnataka1", date);
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  return baseDir;
}

function saveCSV(data, filename, date) {
  if (!data.length) return;
  const csvHeader = Object.keys(data[0]).join(",") + "\n";
  const csvRows = data.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
  const outputDir = getOutputDir(date);
  fs.writeFileSync(path.join(outputDir, filename), csvHeader + csvRows);
}

function saveJSON(data, filename, date) {
  const outputDir = getOutputDir(date);
  fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(data, null, 2));
}

// ================= Fetch Function ================= //
async function fetchCityStats(city, date) {
  const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.21345445.1703250084656&token=67x1xa33b4x422b361ba&lat=${city.lat}&lon=${city.lon}&query=&dateCode=${date}`;

  const headers = {
    Host: "in.bookmyshow.com",
    "x-bms-id": "1.21345445.1703250084656",
    "x-region-code": city.code,
    "x-subregion-code": city.code,
    "x-region-slug": city.slug,
    "x-platform": "AND",
    "x-platform-code": "ANDROID",
    "x-app-code": "MOBAND2",
    "x-device-make": "Google-Pixel XL",
    "x-screen-height": "2392",
    "x-screen-width": "1440",
    "x-screen-density": "3.5",
    "x-app-version": "14.3.4",
    "x-app-version-code": "14304",
    "x-network": "Android | WIFI",
    "x-latitude": city.lat.toString(),
    "x-longitude": city.lon.toString(),
    "x-location-selection": "manual",
    "x-location-shared": "false",
    lang: "en",
    "user-agent":
      "Dalvik/2.1.0 (Linux; U; Android 12; Pixel XL Build/SP2A.220505.008)",
  };

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.ShowDetails) return { showRows: [], citySummary: null };

    let showRows = [];
    let totalShows = 0,
      totalMaxSeats = 0,
      totalBooked = 0,
      totalCollection = 0,
      totalMaxCollection = 0;

    data.ShowDetails.forEach((detail) => {
      detail.Venues.forEach((venue) => {
        venue.ShowTimes.forEach((show) => {
          totalShows += 1;
          show.Categories.forEach((cat) => {
            const max = +cat.MaxSeats || 0;
            const avail = +cat.SeatsAvail || 0;
            const booked = max - avail;
            const price = +cat.CurPrice || 0;

            totalMaxSeats += max;
            totalBooked += booked;
            totalCollection += booked * price;
            totalMaxCollection += max * price;

            showRows.push({
              City: city.name,
              Venue: venue.VenueName,
              Show_Time: show.ShowTime,
              Category: cat.CategoryName || "",
              Max_Seats: max,
              Booked_Seats: booked,
              Price: price.toFixed(2),
              Collection: (booked * price).toFixed(2),
              Max_Collection: (max * price).toFixed(2),
              Occupancy: max ? ((booked / max) * 100).toFixed(2) + "%" : "0.00%",
            });
          });
        });
      });
    });

    const citySummary = {
      City: city.name,
      Total_Shows: totalShows,
      Total_Seats: totalMaxSeats,
      Booked_Seats: totalBooked,
      Collection: totalCollection.toFixed(2),
      Max_Collection: totalMaxCollection.toFixed(2),
      Occupancy: totalMaxSeats ? ((totalBooked / totalMaxSeats) * 100).toFixed(2) + "%" : "0.00%",
    };

    return { showRows, citySummary };
  } catch (err) {
    console.error(`Error fetching ${city.name}: ${err.message}`);
    return { showRows: [], citySummary: null };
  }
}

// ================= Run Script ================= //
async function runKarnataka() {
  const date = getDateString();
  const allShowRows = [];
  const allCitySummaries = [];

  for (const city of karnatakaCities) {
    console.log(`Fetching: ${city.name} (${city.code})`);
    const { showRows, citySummary } = await fetchCityStats(city, date);
    allShowRows.push(...showRows);
    if (citySummary) allCitySummaries.push(citySummary);
    await new Promise((r) => setTimeout(r, 3000)); // 3 sec delay between cities
  }

  saveCSV(allShowRows, `karnataka_showwise_${date}.csv`, date);
  saveCSV(allCitySummaries, `karnataka_citywise_${date}.csv`, date);
  saveJSON(allShowRows, `karnataka_showwise_${date}.json`, date);
  saveJSON(allCitySummaries, `karnataka_citywise_${date}.json`, date);

  console.log(`✅ Completed Karnataka fetch for ${date}`);
}

runKarnataka();
