import fs from "fs";


// ---------------- Karnataka Cities ----------------
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
  { name: "Davangere", code: "DAVA", slug: "davangere", lat: 14.4646, lon: 75.921 },
  { name: "Bidar", code: "BIDR", slug: "bidar", lat: 17.9133, lon: 77.5301 },
  { name: "Chikballapur", code: "CHIK", slug: "chikballapur", lat: 13.435, lon: 77.7317 },
  { name: "Bhadravati", code: "BDVT", slug: "bhadravati", lat: 13.8476, lon: 75.7045 },
  { name: "Vijayapura", code: "VIJP", slug: "bijapur", lat: 16.8307, lon: 75.710 },
  { name: "Kolar", code: "OLAR", slug: "kolar", lat: 13.1364, lon: 78.1298 },
  { name: "Sidlaghatta", code: "SIDL", slug: "sidlaghatta", lat: 13.3036, lon: 77.8934 },
  { name: "Malur", code: "MLLR", slug: "malur", lat: 13.2817, lon: 78.2062 },
  { name: "Tiptur", code: "TIPT", slug: "tiptur", lat: 13.3153, lon: 76.4537 },
  { name: "Kunigal", code: "KUUN", slug: "kunigal", lat: 13.2113, lon: 77.0843 },
  { name: "Chikkamagalur", code: "CHUR", slug: "chikkamagalur", lat: 13.3167, lon: 75.77 },
  { name: "Gadag", code: "GADG", slug: "gadag", lat: 15.4332, lon: 75.6343 },
  { name: "Bijapur", code: "VJPR", slug: "bijapur", lat: 16.8307, lon: 75.71 },
  { name: "Magadi", code: "MAGA", slug: "magadi", lat: 12.93, lon: 77.24 },
  { name: "Mudhol", code: "MUDL", slug: "mudhol", lat: 16.22, lon: 75.43 },
];

// ---------------- Split into 4 chunks ----------------
function chunkArray(arr, chunks = 4) {
  const result = [];
  const len = Math.ceil(arr.length / chunks);
  for (let i = 0; i < chunks; i++) {
    result.push(arr.slice(i * len, (i + 1) * len));
  }
  return result;
}

const cityChunks = chunkArray(karnatakaCities, 4);

// ---------------- CSV Saver ----------------
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
async function fetchShowtimesForCities(eventCode, dateCode, cities, language = "") {
  const showRows = [];
  const cityResults = [];
  let grandTotalSeats = 0, grandBookedSeats = 0, grandBookedCollection = 0,
      grandTotalCollection = 0, grandWeightedPriceSum = 0, grandTotalShows = 0;

  function formatShowTime(raw) {
    if (!raw || raw === "N/A") return "Unknown";
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(raw)) return raw;
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
      "x-region-code": city.code,
      "x-subregion-code": city.code,
      "x-region-slug": city.slug,
      "x-platform": "AND",
      "x-platform-code": "ANDROID",
      "x-app-code": "MOBAND2",
      lang: "en",
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
              Language: language,
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
        Language: language,
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
      Language: language,
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

// ---------------- Runner with Chunks & 10-min Gap ----------------
const eventCode = "ET00395402";

async function runChunks() {
  const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, "");
  for (let i = 0; i < cityChunks.length; i++) {
    console.log(`🚀 Running chunk ${i + 1}/${cityChunks.length} at ${new Date().toLocaleTimeString()}`);
    try {
      const { showRows, cityResults } = await fetchShowtimesForCities(eventCode, dateCode, cityChunks[i]);
      saveToCSV(showRows, "show-wise");
      saveToCSV(cityResults, "city-wise");
      console.log(`✅ Chunk ${i + 1} completed.`);
    } catch (err) {
      console.error(`❌ Error in chunk ${i + 1}:`, err.message);
    }
    if (i < cityChunks.length - 1) {
      console.log("⏳ Waiting 10 minutes before next chunk...");
      await new Promise(r => setTimeout(r, 10 * 60 * 1000)); // 10 minutes
    }
  }
  console.log("✅ All chunks completed. Restarting in 5 minutes...");
  setTimeout(runChunks, 5 * 60 * 1000); // 5 minutes loop
}

// ---------------- Start ----------------
runChunks();
