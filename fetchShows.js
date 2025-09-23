// ================= Node.js Script: fetchShows2.js =================

import fs from "fs";
import path from "path";


// ================= Telangana Cities ================= //
const telanganaCities = {
  Hyderabad: "HYD",
  Warangal: "WAR",
  Karimnagar: "KARIM",
  Nizamabad: "NIZA",
  Khammam: "KHAM",
  Mahbubnagar: "MAHB",
  Mancherial: "MANC",
  Nalgonda: "NALK",
  Adilabad: "ADIL",
  Suryapet: "SURY",
  
  
};

// ================= Event Code ================= //
const eventCode = "ET00369074";

// ================= Helper Functions ================= //
function getNextDay() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(tomorrow.getDate()).padStart(2, "0")}`;
}

function saveCSV(data, filename) {
  if (!data.length) return;
  const csvHeader = Object.keys(data[0]).join(",") + "\n";
  const csvRows = data
    .map((r) => Object.values(r).map((v) => `"${v}"`).join(","))
    .join("\n");
  const outputDir = path.join(".", "output_telangana");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, filename), csvHeader + csvRows);
}

function saveJSON(data, filename) {
  const outputDir = path.join(".", "output_telangana");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(data, null, 2));
}

// ================= Fetch Functions ================= //
async function fetchCityStats(cityName, regionCode, date = getNextDay()) {
  const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?eventCode=${eventCode}&regionCode=${regionCode}&date=${date}`;
  const headers = {
    "x-platform": "DESKTOP",
    "x-app-code": "BMSWEB",
    Accept: "application/json",
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
              City: cityName,
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
      City: cityName,
      Total_Shows: totalShows,
      Total_Seats: totalMaxSeats,
      Booked_Seats: totalBooked,
      Collection: totalCollection.toFixed(2),
      Max_Collection: totalMaxCollection.toFixed(2),
      Occupancy: totalMaxSeats
        ? ((totalBooked / totalMaxSeats) * 100).toFixed(2) + "%"
        : "0.00%",
    };

    return { showRows, citySummary };
  } catch (err) {
    console.error(`Error fetching ${cityName}: ${err.message}`);
    return { showRows: [], citySummary: null };
  }
}

// ================= Run Script ================= //
async function runTelangana(date = getNextDay()) {
  const allShowRows = [];
  const allCitySummaries = [];

  for (const [cityName, regionCode] of Object.entries(telanganaCities)) {
    console.log(`Fetching: ${cityName} (${regionCode})`);
    const { showRows, citySummary } = await fetchCityStats(cityName, regionCode, date);
    allShowRows.push(...showRows);
    if (citySummary) allCitySummaries.push(citySummary);
    await new Promise((r) => setTimeout(r, 3000)); // 3s delay per city
  }

  // Save single CSV & JSON per type
  saveCSV(allShowRows, `telangana_showwise.csv`);
  saveCSV(allCitySummaries, `telangana_citywise.csv`);
  saveJSON(allShowRows, `telangana_showwise.json`);
  saveJSON(allCitySummaries, `telangana_citywise.json`);

  console.log(
    `✅ Telangana fetch completed for ${date}. Shows: ${allShowRows.length}, Cities: ${allCitySummaries.length}`
  );
}

runTelangana();
