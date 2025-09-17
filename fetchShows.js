import fs from "fs";


// ---------------- Batch1 Cities (10 cities) ----------------
const batch1Cities = [
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

// ---------------- Save CSV ----------------
function saveToCSV(data, filenameBase) {
  if (!data.length) return;
  const today = new Date().toISOString().split("T")[0];
  const folder = `output_${today}`;
  fs.mkdirSync(folder, { recursive: true });
  const csvFilePath = `${folder}/${filenameBase}.csv`;
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(h => `${obj[h] ?? ""}`).join(","));
  if (!fs.existsSync(csvFilePath)) {
    fs.writeFileSync(csvFilePath, headers.join(",") + "\n" + rows.join("\n") + "\n", "utf8");
  } else {
    fs.appendFileSync(csvFilePath, rows.join("\n") + "\n", "utf8");
  }
  console.log(`💾 Appended ${data.length} rows to ${csvFilePath}`);
}

// ---------------- Fetch Showtimes ----------------
async function fetchShowtimesForCities(eventCode, dateCode, cities) {
  const showRows = [];
  const cityResults = [];
  let grandTotalSeats = 0, grandBookedSeats = 0, grandBookedCollection = 0,
      grandTotalCollection = 0, grandWeightedPriceSum = 0, grandTotalShows = 0;

  function formatShowTime(raw) {
    if (!raw || raw === "N/A") return "Unknown";
    const n = Number(raw);
    const d = !isNaN(n) ? new Date(n) : new Date(raw);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const resp = await fetch(url, options);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  for (const city of cities) {
    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&lat=${city.lat}&lon=${city.lon}&dateCode=${dateCode}`;
    const headers = {
    Host: "in.bookmyshow.com",
    "x-bms-id": "1.3158053074.1724928349489",
    "x-region-code": "BANG",
    "x-subregion-code": "BANG",
    "x-region-slug": "bengaluru",
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
    "x-latitude": "12.971599",
    "x-longitude": "77.59457",
    "x-location-selection": "manual",
    "x-location-shared": "false",
    lang: "en",
    "user-agent":
      "Dalvik/2.1.0 (Linux; U; Android 12; Pixel XL Build/SP2A.220505.008)",
  };


    try {
      const data = await fetchWithRetry(url, { method: "GET", headers });
      if (!data?.ShowDetails?.length) continue;

      let cityTotalSeats = 0, cityBookedSeats = 0, cityBookedCollection = 0,
          cityTotalPotentialCollection = 0, cityWeightedPriceSum = 0, totalShowsInCity = 0;

      for (const showDetail of data.ShowDetails) {
        for (const venue of showDetail.Venues) {
          for (const showTime of venue.ShowTimes) {
            totalShowsInCity++;
            const formattedTime = formatShowTime(showTime.ShowTime);

            let totalSeats = 0, totalBooked = 0, totalShowCollection = 0, sumCategoryPrices = 0, catCount = 0;
            for (const cat of showTime.Categories) {
              const maxSeats = parseInt(cat.MaxSeats) || 0;
              const seatsAvail = parseInt(cat.SeatsAvail) || 0;
              const booked = maxSeats - seatsAvail;
              const price = parseFloat(cat.CurPrice) || 0;
              totalSeats += maxSeats;
              totalBooked += booked;
              totalShowCollection += booked * price;
              sumCategoryPrices += price;
              catCount++;
            }
            const avgPrice = catCount > 0 ? sumCategoryPrices / catCount : 0;
            const totalPotentialCollection = totalSeats * avgPrice;
            const occupancy = totalSeats ? ((totalBooked / totalSeats) * 100).toFixed(2) : "0.00";

            showRows.push({
              City: city.name,
              Venue: venue.VenueName,
              "Show Time": formattedTime,
              "Total Seats": totalSeats,
              "Booked Seats": totalBooked,
              "Occupancy (%)": `${occupancy}%`,
              "Booked Collection (₹)": totalShowCollection.toFixed(2),
              "Total Collection (₹)": totalPotentialCollection.toFixed(2),
              "Avg Ticket Price (₹)": avgPrice.toFixed(2),
            });

            cityTotalSeats += totalSeats;
            cityBookedSeats += totalBooked;
            cityBookedCollection += totalShowCollection;
            cityTotalPotentialCollection += totalPotentialCollection;
            cityWeightedPriceSum += avgPrice * totalSeats;
          }
        }
      }

      const cityOccupancy = cityTotalSeats ? ((cityBookedSeats / cityTotalSeats) * 100).toFixed(2) : "0.00";
      const cityAvgTicketPrice = cityTotalSeats ? (cityWeightedPriceSum / cityTotalSeats).toFixed(2) : "0.00";

      cityResults.push({
        City: city.name,
        "Total Shows": totalShowsInCity,
        "Total Seats": cityTotalSeats,
        "Booked Seats": cityBookedSeats,
        "Occupancy (%)": `${cityOccupancy}%`,
        "Booked Collection (₹)": cityBookedCollection.toFixed(2),
        "Total Collection (₹)": cityTotalPotentialCollection.toFixed(2),
        "Avg Ticket Price (₹)": cityAvgTicketPrice,
      });

      grandTotalSeats += cityTotalSeats;
      grandBookedSeats += cityBookedSeats;
      grandBookedCollection += cityBookedCollection;
      grandTotalCollection += cityTotalPotentialCollection;
      grandWeightedPriceSum += cityWeightedPriceSum;
      grandTotalShows += totalShowsInCity;

    } catch (err) {
      console.error(`❌ ${city.name}: ${err.message}`);
    }
  }

  if (grandTotalShows > 0) {
    const grandOccupancy = grandTotalSeats ? ((grandBookedSeats / grandTotalSeats) * 100).toFixed(2) : "0.00";
    const grandAvgTicketPrice = grandTotalSeats ? (grandWeightedPriceSum / grandTotalSeats).toFixed(2) : "0.00";
    cityResults.push({
      City: "TOTAL",
      "Total Shows": grandTotalShows,
      "Total Seats": grandTotalSeats,
      "Booked Seats": grandBookedSeats,
      "Occupancy (%)": `${grandOccupancy}%`,
      "Booked Collection (₹)": grandBookedCollection.toFixed(2),
      "Total Collection (₹)": grandTotalCollection.toFixed(2),
      "Avg Ticket Price (₹)": grandAvgTicketPrice,
    });
  }

  return { showRows, cityResults };
}

// ---------------- Runner with 2 Chunks, 10-min gap ----------------
const eventCode = "ET00395402";
const chunks = 2;
const gapMinutes = 10;

async function run() {
  const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const chunkSize = Math.ceil(batch1Cities.length / chunks);

  for (let i = 0; i < chunks; i++) {
    const chunkCities = batch1Cities.slice(i * chunkSize, (i + 1) * chunkSize);
    console.log(`🚀 Running chunk ${i + 1} for ${chunkCities.map(c=>c.name).join(", ")}`);
    try {
      const { showRows, cityResults } = await fetchShowtimesForCities(eventCode, dateCode, chunkCities);
      saveToCSV(showRows, `show-wise-batch1-chunk${i+1}`);
      saveToCSV(cityResults, `city-wise-batch1-chunk${i+1}`);
      console.log(`✅ Chunk ${i + 1} completed.`);
    } catch (err) {
      console.error(`❌ Error in chunk ${i+1}: ${err.message}`);
    }
    if (i < chunks - 1) {
      console.log(`⏳ Waiting ${gapMinutes} minutes before next chunk...`);
      await new Promise(r => setTimeout(r, gapMinutes * 60 * 1000));
    }
  }
  console.log("🎯 Batch1 all chunks completed.");
}

run();
