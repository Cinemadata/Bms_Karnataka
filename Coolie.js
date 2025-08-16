import fs from "fs";

// ---------------- Save to CSV ----------------
function saveToCSV(data, folderName, filenameBase) {
  if (!data.length) return;

  const folder = `output_${folderName}`;
  fs.mkdirSync(folder, { recursive: true });
  const csvFilePath = `${folder}/${filenameBase}.csv`;

  const headers = Object.keys(data[0]);
  const rows = data.map(obj =>
    headers.map(h => `"${obj[h] !== undefined ? obj[h] : ""}"`).join(",")
  );

  fs.writeFileSync(csvFilePath, headers.join(",") + "\n" + rows.join("\n") + "\n", "utf8");
  console.log(`💾 Saved ${data.length} rows to ${csvFilePath}`);
}

// ---------------- Delay to avoid rate-limiting ----------------
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------- Fetch Showtimes ----------------
async function fetchShowtimesForCities(eventCode, cities, language) {
  const showRows = [];
  const cityResults = [];

  function formatShowTime(raw) {
    if (!raw || raw === "N/A") return "Unknown";
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(raw)) return raw;
    const n = Number(raw);
    const d = !isNaN(n) ? new Date(n) : new Date(raw);
    return isNaN(d.getTime()) ? "Unknown" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  for (const city of cities) {
    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.3158053074.1724928349489&lat=${city.lat}&lon=${city.lon}&query=&dateCode=${new Date().toISOString().split("T")[0].replace(/-/g,'')}`;

    try {
      const res = await fetch(url, {
        headers: {
          "x-bms-id": "1.3158053074.1724928349489",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "cookie": ""
        }
      });
      const data = await res.json();
      if (!data?.ShowDetails) {
        console.warn(`⚠️ No show data for ${city.name}`);
        continue;
      }

      let cityTotalSeats = 0, cityBookedSeats = 0, cityBookedCollection = 0, cityTotalPotentialCollection = 0, cityWeightedPriceSum = 0, totalShowsInCity = 0;

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

      await delay(1500); // 1.5s delay per city to reduce rate-limiting
    } catch (err) {
      console.error(`❌ Failed fetch for ${city.name}:`, err);
    }
  }

  return { showRows, cityResults };
}

// ---------------- Cities ----------------
const tamilCities = [
  { name: "Bengaluru", code: "BANG", slug: "bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Mysore", code: "MYS", slug: "mysore", lat: 12.2958, lon: 76.6394 },
  { name: "Hubli", code: "HUBL", slug: "hubli", lat: 15.3647, lon: 75.1237 },
  { name: "Mangalore", code: "MALE", slug: "mangalore", lat: 12.9141, lon: 74.8560 },
  { name: "Belagavi", code: "BELG", slug: "belagavi", lat: 15.8497, lon: 74.4977 },
  { name: "Kalaburagi", code: "KALB", slug: "kalaburagi", lat: 17.3297, lon: 76.8343 },
  { name: "Shivamogga", code: "SHIV", slug: "shivamogga", lat: 13.9299, lon: 75.5681 },
  { name: "Tumkur", code: "TUMK", slug: "tumkur", lat: 13.3392, lon: 77.1135 },
  { name: "Davangere", code: "DAVA", slug: "davangere", lat: 14.4646, lon: 75.921 },
  { name: "Raichur", code: "RAUR", slug: "raichur", lat: 16.2076, lon: 77.3439 },
  { name: "Hospet", code: "HOSP", slug: "hospet", lat: 15.2695, lon: 76.3871 },
  { name: "Bellary", code: "BLRY", slug: "bellary", lat: 15.1394, lon: 76.9214 },
  { name: "Kolar", code: "OLAR", slug: "kolar", lat: 13.1364, lon: 78.1298 },
  { name: "Chikballapur", code: "CHIK", slug: "chikballapur", lat: 13.435, lon: 77.7317 },
  { name: "Tiptur", code: "TIPT", slug: "tiptur", lat: 13.3153, lon: 76.4537 },
  { name: "Malur", code: "MLLR", slug: "malur", lat: 13.2817, lon: 78.2062 },
  { name: "Vijayapura", code: "VIJP", slug: "bijapur", lat: 16.8307, lon: 75.710 },
  { name: "Karwar", code: "KRWR", slug: "karwar", lat: 14.8026, lon: 74.1326 }
];

const teluguCities = [
  { name: "Bengaluru", code: "BANG", slug: "bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Bellary", code: "BLRY", slug: "bellary", lat: 15.1394, lon: 76.9214 },
  { name: "Tumkur", code: "TUMK", slug: "tumkur", lat: 13.3392, lon: 77.1135 },
  { name: "Davangere", code: "DAVA", slug: "davangere", lat: 14.4646, lon: 75.921 },
  { name: "Chikballapur", code: "CHIK", slug: "chikballapur", lat: 13.435, lon: 77.7317 },
  { name: "Raichur", code: "RAUR", slug: "raichur", lat: 16.2076, lon: 77.3439 },
  { name: "Hospet", code: "HOSP", slug: "hospet", lat: 15.2695, lon: 76.3871 },
  { name: "Kalaburagi", code: "KALB", slug: "kalaburagi", lat: 17.3297, lon: 76.8343 },
  { name: "Mysore", code: "MYS", slug: "mysore", lat: 12.2958, lon: 76.6394 },
  { name: "Shivamogga", code: "SHIV", slug: "shivamogga", lat: 13.9299, lon: 75.5681 },
  { name: "Belagavi", code: "BELG", slug: "belagavi", lat: 15.8497, lon: 74.4977 },
  { name: "Mangalore", code: "MALE", slug: "mangalore", lat: 12.9141, lon: 74.8560 }
];

const tamilEventCode = "ET00395817";
const teluguEventCode = "ET00446734";

// ---------------- Main Execution ----------------
(async () => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  console.log("Fetching Tamil shows...");
  const { showRows: tamilShowRows, cityResults: tamilCityResults } =
    await fetchShowtimesForCities(tamilEventCode, tamilCities, "Tamil");
  saveToCSV(tamilShowRows, today, "show-wise-tamil");
  saveToCSV(tamilCityResults, today, "city-wise-tamil");
  console.log("✅ Tamil data fetched and saved.");

  console.log("Fetching Telugu shows...");
  const { showRows: teluguShowRows, cityResults: teluguCityResults } =
    await fetchShowtimesForCities(teluguEventCode, teluguCities, "Telugu");
  saveToCSV(teluguShowRows, today, "show-wise-telugu");
  saveToCSV(teluguCityResults, today, "city-wise-telugu");
  console.log("✅ Telugu data fetched and saved.");
})();
