// ================= Node.js Script: fetchShows2.js =================

import fs from "fs";
import path from "path";


// ================= Karnataka Cities (replacement 10 cities) ================= //
const karnatakaCities = [
  { name: "Padubidri", code: "PUYI", slug: "padubidri", lat: 13.1408, lon: 74.7721 },
  { name: "Puttur", code: "PTTU", slug: "puttur", lat: 12.7594, lon: 75.2422 },
  { name: "Bijapur", code: "VJPR", slug: "bijapur", lat: 16.8307, lon: 75.7100 },
  { name: "Magadi", code: "MAGA", slug: "magadi", lat: 12.9300, lon: 77.2400 },
  { name: "Mudhol", code: "MUDL", slug: "mudhol", lat: 16.2200, lon: 75.4300 },
  { name: "Karwar", code: "KWAR", slug: "karwar", lat: 14.8054, lon: 74.1304 },
  { name: "Baindur", code: "BAND", slug: "baindur", lat: 13.9500, lon: 74.5500 },
  { name: "Raichur", code: "RAUR", slug: "raichur", lat: 16.2076, lon: 77.3439 },
  { name: "Bellary", code: "BLRY", slug: "bellary", lat: 15.1394, lon: 76.9214 },
  { name: "Belur", code: "BELU", slug: "belur", lat: 13.1633, lon: 75.8667 },
];

// ================= Event Code ================= //
const eventCode = "ET00377351";

// ================= Helpers ================= //
function getDateString(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function saveCSV(data, filename) {
  if (!data.length) return;
  const csvHeader = Object.keys(data[0]).join(",") + "\n";
  const csvRows = data
    .map((r) => Object.values(r).map((v) => `"${v}"`).join(","))
    .join("\n");
  const outputDir = path.join(".", "output_karnataka");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, filename), csvHeader + csvRows);
}

function saveJSON(data, filename) {
  const outputDir = path.join(".", "output_karnataka");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(data, null, 2));
}

// ================= Fetch Function ================= //
async function fetchCityStats(city, date) {
  const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.3158053074.1724928349489&token=67x1xa33b4x422b361ba&lat=${city.lat}&lon=${city.lon}&query=&dateCode=${date}`;

  const headers = {
    Host: "in.bookmyshow.com",
    "x-bms-id": "1.3158053074.1724928349489",
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
    "user-agent": "Node.js Script",
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
      detail.Venues?.forEach((venue) => {
        venue.ShowTimes?.forEach((show) => {
          totalShows += 1;
          show.Categories?.forEach((cat) => {
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
    await new Promise((r) => setTimeout(r, 3000)); // 3s delay
  }

  saveCSV(allShowRows, `karnataka_showwise_${date}.csv`);
  saveCSV(allCitySummaries, `karnataka_citywise_${date}.csv`);
  saveJSON(allShowRows, `karnataka_showwise_${date}.json`);
  saveJSON(allCitySummaries, `karnataka_citywise_${date}.json`);

  console.log(`✅ Completed Karnataka fetch for ${date}`);
}

runKarnataka();
