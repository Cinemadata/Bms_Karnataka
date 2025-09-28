// ================= Node.js Script: fetchShows2.js =================

import fs from "fs";
import path from "path";


// ================= Karnataka Cities (new 10 cities) ================= //
const karnatakaCities = [
  { name: "Dharwad", code: "DHAW", slug: "dharwad", lat: 15.4589, lon: 75.0078 },
  { name: "Kanakapura", code: "KAKP", slug: "kanakapura", lat: 12.5797, lon: 77.4112 },
  { name: "Karkala", code: "KARK", slug: "karkala", lat: 13.2945, lon: 74.9904 },
  { name: "Mandya", code: "MND", slug: "mandya", lat: 12.5247, lon: 76.8977 },
  { name: "Moodbidri", code: "MOOD", slug: "moodbidri", lat: 13.1587, lon: 74.9989 },
  { name: "Saligrama", code: "SGMA", slug: "saligrama", lat: 13.2569, lon: 74.9862 },
  { name: "Udupi", code: "UDUP", slug: "udupi", lat: 13.3409, lon: 74.7421 },
  { name: "Channarayapatna", code: "CHNN", slug: "channarayapatna", lat: 12.9703, lon: 76.4976 },
  { name: "Bagalkote", code: "BAGA", slug: "bagalkote", lat: 16.1814, lon: 75.6911 },
  { name: "Shahpur", code: "SUPH", slug: "shahpur", lat: 17.1823, lon: 75.1263 }
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
  const ts = Date.now(); // timestamp for API
  const url = `https://in.bookmyshow.com/api/v3/mobile/showtimes/byevent?eventCode=${eventCode}&regionCode=${city.code}&dateCode=${date}&appCode=WEBV2&_=${ts}`;

  const headers = {
    "x-bms-id": "1.3158053074.1724928349489",
    "user-agent": "Node.js Script",
    "cookie": "", // add cookie if needed
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
