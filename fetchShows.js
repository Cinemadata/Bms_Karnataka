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
  { name: "Chikkamagalur", code: "CHUR", slug: "chikkamagalur", lat: 13.3167, lon: 75.7700 },
  { name: "Gadag", code: "GADG", slug: "gadag", lat: 15.4332, lon: 75.6343 },
  { name: "Bijapur", code: "VJPR", slug: "bijapur", lat: 16.8307, lon: 75.7100 },
  { name: "Magadi", code: "MAGA", slug: "magadi", lat: 12.9300, lon: 77.2400 },
  { name: "Mudhol", code: "MUDL", slug: "mudhol", lat: 16.2200, lon: 75.4300 },
  { name: "Krishnarajanagara", code: "KRJT", slug: "krishnarajanagara", lat: 12.2413, lon: 76.4407 },
  { name: "Baindur", code: "BAND", slug: "baindur", lat: 13.9500, lon: 74.5500 },
  { name: "Gundlupet", code: "GUND", slug: "gundlupet", lat: 12.1067, lon: 76.1697 },
  { name: "Belur", code: "BELU", slug: "belur", lat: 13.1633, lon: 75.8667 },
  { name: "Bhatkal", code: "BAKL", slug: "bhatkal", lat: 13.9693, lon: 74.5154 },
  { name: "Dharwad", code: "DHAW", slug: "dharwad", lat: 15.4589, lon: 75.0078 },
  { name: "Kanakapura", code: "KAKP", slug: "kanakapura", lat: 12.5797, lon: 77.4112 },
  { name: "Karkala", code: "KARK", slug: "karkala", lat: 13.2945, lon: 74.9904 },
  { name: "Mandya", code: "MND", slug: "mandya", lat: 12.5247, lon: 76.8977 },
  { name: "Moodbidri", code: "MOOD", slug: "moodbidri", lat: 13.1587, lon: 74.9989 },
  { name: "Saligrama", code: "SGMA", slug: "saligrama", lat: 13.2569, lon: 74.9862 },
  { name: "Udupi", code: "UDUP", slug: "udupi", lat: 13.3409, lon: 74.7421 },
  { name: "Channarayapatna", code: "CHNN", slug: "channarayapatna", lat: 12.9703, lon: 76.4976 },
  { name: "Bagalkote", code: "BAGA", slug: "bagalkote", lat: 16.1814, lon: 75.6911 },
  { name: "Shahpur", code: "SUPH", slug: "shahpur", lat: 17.1823, lon: 75.1263 },
  { name: "Chitradurga", code: "CHIT", slug: "chitradurga", lat: 14.2304, lon: 76.4019 },
  { name: "Ranebennuru", code: "RANE", slug: "ranebennuru", lat: 14.6239, lon: 75.6235 },
  { name: "Nanjangud", code: "NJGU", slug: "nanjangud", lat: 12.0345, lon: 76.6494 },
  { name: "Ramanagara", code: "RANG", slug: "ramanagara", lat: 12.7202, lon: 77.2810 },
  { name: "Chamrajanagar", code: "CHAJ", slug: "chamrajanagar", lat: 11.9185, lon: 76.6788 },
  { name: "Karwar", code: "KWAR", slug: "karwar", lat: 14.8054, lon: 74.1304 },
  { name: "Puttur", code: "PTTU", slug: "puttur", lat: 12.7594, lon: 75.2422 },
  { name: "Channapatana", code: "CPTN", slug: "channapatana", lat: 12.6579, lon: 77.1512 },

  ];

// ---------------- Save to CSV ----------------
function saveToCSV(data, filenameBase) {
  if (!data.length) return;

  const today = new Date().toISOString().split("T")[0];
  const folder = `output_${today}`;
  fs.mkdirSync(folder, { recursive: true });

  const csvFilePath = `${folder}/${filenameBase}.csv`;

  const headers = Object.keys(data[0]);
  const rows = data.map(obj =>
    headers.map(h => `${obj[h] !== undefined ? obj[h] : ""}`).join(",")
  );

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

  let grandTotalSeats = 0,
    grandBookedSeats = 0,
    grandBookedCollection = 0,
    grandTotalCollection = 0,
    grandWeightedPriceSum = 0,
    grandTotalShows = 0;

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
    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.3158053074.1724928349489&token=67x1xa33b4x422b361ba&lat=${city.lat}&lon=${city.lon}&query=&dateCode=${dateCode}`;

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
      "user-agent": "Dalvik/2.1.0 (Linux; U; Android 12; Pixel XL Build/SP2A.220505.008)",
    };

    try {
      const data = await fetchWithRetry(url, { method: "GET", headers });
      if (!data?.ShowDetails?.length) continue;

      let cityTotalSeats = 0,
        cityBookedSeats = 0,
        cityBookedCollection = 0,
        cityTotalPotentialCollection = 0,
        cityWeightedPriceSum = 0,
        totalShowsInCity = 0;

      for (const showDetail of data.ShowDetails) {
        for (const venue of showDetail.Venues) {
          for (const showTime of venue.ShowTimes) {
            totalShowsInCity++;
            const formattedTime = formatShowTime(showTime.ShowTime);

            let totalSeats = 0,
              totalBooked = 0,
              totalShowCollection = 0,
              sumCategoryPrices = 0,
              catCount = 0;

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
      console.error(`Error ${city.name}:`, err);
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

// ---------------- Chunking ----------------
async function runInChunks(eventCode, dateCode, cities, language = "", chunkCount = 4) {
  const chunkSize = Math.ceil(cities.length / chunkCount);

  for (let i = 0; i < chunkCount; i++) {
    const chunk = cities.slice(i * chunkSize, (i + 1) * chunkSize);
    if (!chunk.length) continue;

    console.log(`🚀 Running chunk ${i + 1}/${chunkCount} (${chunk.length} cities)`);
    const { showRows, cityResults } = await fetchShowtimesForCities(eventCode, dateCode, chunk, language);

    saveToCSV(showRows, "show-wise");
    saveToCSV(cityResults, "city-wise");

    if (i < chunkCount - 1) {
      console.log("⏳ Waiting 10 minutes before next chunk...");
      await new Promise(r => setTimeout(r, 10 * 60 * 1000));
    }
  }
}

// ---------------- Main Execution ----------------
const eventCode = "ET00395402";
const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

(async () => {
  console.log("Fetching BMS shows for all Karnataka cities...");
  await runInChunks(eventCode, dateCode, karnatakaCities);
  console.log("✅ All chunks completed.");
})();
