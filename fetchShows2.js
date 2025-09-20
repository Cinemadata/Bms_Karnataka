import fs from "fs";
import fetch from "node-fetch"; // npm install node-fetch

// ---------------- Telangana Cities ----------------
const telanganaCities = [
  { name: "Hyderabad", code: "HYD", slug: "hyderabad", lat: 17.3850, lon: 78.4867 },
  { name: "Warangal", code: "WAR", slug: "warangal", lat: 17.9789, lon: 79.5558 },
  { name: "Karimnagar", code: "KARIM", slug: "karimnagar", lat: 18.4386, lon: 79.1288 },
  { name: "Nizamabad", code: "NIZA", slug: "nizamabad", lat: 18.6722, lon: 78.0940 },
  { name: "Khammam", code: "KHAM", slug: "khammam", lat: 17.2473, lon: 80.1514 },
  { name: "Mahbubnagar", code: "MAHB", slug: "mahbubnagar", lat: 16.7426, lon: 78.0060 },
  { name: "Mancherial", code: "MANC", slug: "mancherial", lat: 18.8750, lon: 79.4436 },
  { name: "Nalgonda", code: "NALK", slug: "nalgonda", lat: 17.0560, lon: 79.2675 },
  { name: "Adilabad", code: "ADIL", slug: "adilabad", lat: 19.6667, lon: 78.5333 },
  { name: "Suryapet", code: "SURY", slug: "suryapet", lat: 17.1311, lon: 79.6210 },
  { name: "Miryalaguda", code: "MRGD", slug: "miryalaguda", lat: 16.8667, lon: 79.5833 },
  { name: "Siddipet", code: "SDDP", slug: "siddipet", lat: 18.1046, lon: 78.8519 },
  { name: "Jagtial", code: "JGTL", slug: "jagtial", lat: 18.8000, lon: 79.4333 },
  { name: "Sircilla", code: "SIRC", slug: "sircilla", lat: 18.8000, lon: 79.4333 },
  { name: "Kamareddy", code: "KMRD", slug: "kamareddy", lat: 18.3273, lon: 78.3450 },
  { name: "Palwancha", code: "PLWA", slug: "palwancha", lat: 17.5167, lon: 80.6500 },
  { name: "Kothagudem", code: "KTGM", slug: "kothagudem", lat: 17.5500, lon: 80.6500 },
  { name: "Bodhan", code: "BODH", slug: "bodhan", lat: 18.6700, lon: 78.5600 },
  { name: "Sangareddy", code: "SARE", slug: "sangareddy", lat: 17.6000, lon: 78.1000 },
  { name: "Metpally", code: "METT", slug: "metpally", lat: 18.8000, lon: 79.5833 },
  { name: "Zaheerabad", code: "ZAGE", slug: "zaheerabad", lat: 17.6700, lon: 77.5800 },
  { name: "Korutla", code: "KCKA", slug: "korutla", lat: 18.8000, lon: 78.8167 },
  { name: "Tandur", code: "TAND", slug: "tandur", lat: 17.1000, lon: 77.6500 },
  { name: "Kodad", code: "KODA", slug: "kodad", lat: 16.9000, lon: 79.9500 },
  { name: "Armoor", code: "ARMO", slug: "armoor", lat: 18.8500, lon: 78.3500 },
  { name: "Gadwal", code: "GADW", slug: "gadwal", lat: 16.2700, lon: 77.8200 },
  { name: "Wanaparthy", code: "WANA", slug: "wanaparthy", lat: 16.3000, lon: 78.4000 },
  { name: "Bellampally", code: "BELL", slug: "bellampally", lat: 18.9000, lon: 79.4000 },
  { name: "Bhongir", code: "BHUV", slug: "bhongir", lat: 17.5100, lon: 78.8880 },
  { name: "Vikarabad", code: "VKBD", slug: "vikarabad", lat: 17.3294, lon: 77.9033 },
  { name: "Mahbubabad", code: "MAHA", slug: "mahbubabad", lat: 17.8000, lon: 80.0000 },
  { name: "Jangaon", code: "JNGN", slug: "jangaon", lat: 17.7200, lon: 79.1700 },
  { name: "Bhadrachalam", code: "BHDR", slug: "bhadradri", lat: 17.6650, lon: 80.8800 },
  { name: "Bhupalapally", code: "BHUP", slug: "bhupalapally", lat: 18.5500, lon: 80.4500 },
  { name: "Narayanpet", code: "NRYN", slug: "narayanpet", lat: 16.9000, lon: 77.5000 },
  { name: "Peddapalli", code: "PEDA", slug: "peddapalli", lat: 18.6100, lon: 79.4000 },
  { name: "Huzurnagar", code: "HUZU", slug: "huzurnagar", lat: 16.8500, lon: 80.6000 },
  { name: "Medchal", code: "MDCH", slug: "medchal", lat: 17.6292, lon: 78.5586 },
  { name: "Manuguru", code: "MNGU", slug: "manuguru", lat: 17.5250, lon: 80.8800 },
  { name: "Achampet", code: "ACHM", slug: "achampet", lat: 16.5833, lon: 78.3833 }
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

// ---------------- Delay ----------------
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    await delay(3000); // 3-second delay per city
    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&lat=${city.lat}&lon=${city.lon}&dateCode=${dateCode}`;
    const headers = {
      "x-platform": "DESKTOP",
      "x-app-code": "MOBAND2",
      lang: "en"
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

// ---------------- Runner ----------------
const eventCode = "ET00395402"; // Replace with actual event code
async function run() {
  const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, "");
  console.log(`🚀 Starting Telangana showtime fetch for ${telanganaCities.length} cities`);

  const { showRows, cityResults } = await fetchShowtimesForCities(eventCode, dateCode, telanganaCities);

  saveToCSV(showRows, `telangana_showwise`);
  saveToCSV(cityResults, `telangana_citywise`);

  console.log("✅ Telangana fetch completed.");
}

run();

