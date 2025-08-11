// merged-scraper.js
// ✅ Node.js script to merge BookMyShow & District showtimes for Bengaluru
// Run with: node merged-scraper.js

import fetch from "node-fetch";

const proxyUrl = "http://localhost:8080/";

// 🎯 Config
const cityName = "Bengaluru";
const cityCode = "BANG";
const eventCodes = [
  "ET00395817", // Tamil
  "ET00395820", // Telugu
  "ET00395821"  // Kannada
];
const dateCode = "20250814";
const districtMovieId = "MV172677"; // From your input

// 🚀 Fetch BookMyShow Data
async function fetchBMS(eventCode) {
  const url = `${proxyUrl}https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${cityCode}&subRegion=${cityCode}&bmsId=1.21345445.1703250084656&token=67x1xa33b4x422b361ba&lat=12.971599&lon=77.59457&query='&dateCode=${dateCode}`;

  const headers = {
    "x-bms-id": "1.21345445.1703250084656",
    "x-region-code": cityCode,
    "x-subregion-code": cityCode,
    "x-region-slug": cityCode.toLowerCase(),
    "x-platform": "AND",
    "x-app-code": "MOBAND2",
    lang: "en",
    "user-agent": "Dalvik/2.1.0 (Linux; Android 12; Pixel XL)"
  };

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`BMS fetch failed: ${res.statusText}`);
  const data = await res.json();

  const shows = [];
  for (const showDetail of data.ShowDetails || []) {
    for (const venue of showDetail.Venues || []) {
      for (const showTime of venue.ShowTimes || []) {
        let maxSeats = 0, bookedSeats = 0;
        for (const category of showTime.Categories || []) {
          const max = parseInt(category.MaxSeats || "0", 10);
          const avail = parseInt(category.SeatsAvail || "0", 10);
          bookedSeats += max - avail;
          maxSeats += max;
        }
        shows.push({
          source: "BMS",
          venue: venue.VenueName.trim(),
          time: showTime.ShowTiming.trim(),
          bookedSeats,
          maxSeats
        });
      }
    }
  }
  return shows;
}

// 🚀 Fetch District Data
async function fetchDistrict() {
  // Replace this URL with your actual District scraping endpoint
  const url = `${proxyUrl}https://your-district-endpoint.com/api?movieId=${districtMovieId}&city=${cityName}&date=${dateCode}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`District fetch failed: ${res.statusText}`);
  const data = await res.json();

  return data.map(show => ({
    source: "District",
    venue: show.venue.trim(),
    time: show.time.trim(),
    bookedSeats: show.bookedSeats,
    maxSeats: show.maxSeats
  }));
}

// 🧹 Merge and Remove Duplicates
function mergeShows(bmsData, districtData) {
  const merged = [...bmsData];
  for (const dist of districtData) {
    const duplicate = merged.find(
      s => s.venue === dist.venue && s.time === dist.time
    );
    if (!duplicate) merged.push(dist);
  }
  return merged;
}

// 📊 Main
(async () => {
  try {
    let bmsAll = [];
    for (const code of eventCodes) {
      console.log(`🔍 Fetching BMS Event: ${code}`);
      const data = await fetchBMS(code);
      bmsAll.push(...data);
    }

    console.log(`🔍 Fetching District Data for Movie ID: ${districtMovieId}`);
    const districtAll = await fetchDistrict();

    const mergedData = mergeShows(bmsAll, districtAll);

    console.log("\n🎟️ Merged Shows (BMS + District, No Duplicates)\n");
    console.table(
      mergedData.map(s => ({
        Source: s.source,
        Venue: s.venue,
        Time: s.time,
        "Booked Seats": s.bookedSeats,
        "Max Seats": s.maxSeats,
        Occupancy: ((s.bookedSeats / s.maxSeats) * 100).toFixed(2) + "%"
      }))
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
