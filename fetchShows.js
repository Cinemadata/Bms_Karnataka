// ================= Node.js Script: fetchShows.js =================

// ================= Node.js Script: fetchShowsTelanganaFull.js =================

import fs from "fs";
import path from "path";


// ================= Telangana Cities ================= //
const cities = {
  hyderabad: { regionCode: "HYD", subRegionCode: "HYD", latitude: "17.3850", longitude: "78.4867" },
  warangal: { regionCode: "WAR", subRegionCode: "WAR", latitude: "17.9787", longitude: "79.5948" },
  karimnagar: { regionCode: "KARIM", subRegionCode: "KARIM", latitude: "18.4386", longitude: "79.1288" },
  nizamabad: { regionCode: "NIZA", subRegionCode: "NIZA", latitude: "18.6739", longitude: "78.0941" },
  khammam: { regionCode: "KHAM", subRegionCode: "KHAM", latitude: "17.2473", longitude: "80.1514" },
  mahbubnagar: { regionCode: "MAHB", subRegionCode: "MAHB", latitude: "16.7441", longitude: "77.9862" },
  mancherial: { regionCode: "MANC", subRegionCode: "MANC", latitude: "18.8741", longitude: "79.4476" },
  nalgonda: { regionCode: "NALK", subRegionCode: "NALK", latitude: "17.0540", longitude: "79.2672" },
  adilabad: { regionCode: "ADIL", subRegionCode: "ADIL", latitude: "19.6669", longitude: "78.5322" },
  suryapet: { regionCode: "SURY", subRegionCode: "SURY", latitude: "17.1302", longitude: "79.6217" },
};

// ================= Event Codes ================= //
const eventCodes = [{ movie: "They Call Him OG", code: "ET00369074" }];

// ================= Helper Functions ================= //
function getNextDay() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
}

function formatShowTime(raw) {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function saveCSV(data, filename) {
  if (!data.length) return;
  const csvHeader = Object.keys(data[0]).join(",") + "\n";
  const csvRows = data.map(r => Object.values(r).join(",")).join("\n");
  const outputDir = path.join(".", "output_telangana");
  if(!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, filename), csvHeader + csvRows);
}

// ================= Fetch Functions ================= //
async function fetchShowtimes(cityData) {
  const date = getNextDay();
  const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?eventCode=${eventCodes[0].code}&regionCode=${cityData.regionCode}&subRegion=${cityData.subRegionCode}&lat=${cityData.latitude}&lon=${cityData.longitude}&date=${date}`;
  const headers = { "x-platform": "DESKTOP", "x-app-code": "BMSWEB", "Accept": "application/json" };

  try {
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const showRows = [];
    let cityTotalSeats = 0, cityBookedSeats = 0, cityBookedCollection = 0, cityTotalCollection = 0;

    data.ShowDetails?.forEach(showDetail => {
      showDetail.Venues?.forEach(venue => {
        venue.ShowTimes?.forEach(showTime => {
          showTime.Categories?.forEach(category => {
            const maxSeats = parseInt(category.MaxSeats, 10) || 0;
            const bookedSeats = maxSeats - (parseInt(category.SeatsAvail, 10) || 0);
            const price = parseFloat(category.CurPrice) || 0;
            const occupancy = maxSeats ? ((bookedSeats / maxSeats) * 100).toFixed(2) + "%" : "0.00%";

            showRows.push({
              City: cityData.regionCode,
              Venue: venue.VenueName,
              "Show Time": formatShowTime(showTime.ShowTime),
              "Category": category.CategoryName || "",
              "Max Seats": maxSeats,
              "Booked Seats": bookedSeats,
              "Occupancy": occupancy,
              "Price (₹)": price.toFixed(2),
              "Booked Collection (₹)": (bookedSeats * price).toFixed(2),
              "Total Potential Collection (₹)": (maxSeats * price).toFixed(2),
            });

            // Aggregate for city summary
            cityTotalSeats += maxSeats;
            cityBookedSeats += bookedSeats;
            cityBookedCollection += bookedSeats * price;
            cityTotalCollection += maxSeats * price;
          });
        });
      });
    });

    const cityOccupancy = cityTotalSeats ? ((cityBookedSeats / cityTotalSeats) * 100).toFixed(2) + "%" : "0.00%";

    const citySummary = {
      City: cityData.regionCode,
      "Total Shows": data.ShowDetails?.reduce((sum, d) => sum + d.Venues?.reduce((s, v) => s + (v.ShowTimes?.length || 0),0),0) || 0,
      "Total Seats": cityTotalSeats,
      "Booked Seats": cityBookedSeats,
      "Occupancy": cityOccupancy,
      "Booked Collection (₹)": cityBookedCollection.toFixed(2),
      "Total Collection (₹)": cityTotalCollection.toFixed(2),
    };

    return { showRows, citySummary };

  } catch(e) {
    console.error(`Error fetching city ${cityData.regionCode}:`, e.message);
    return { showRows: [], citySummary: null };
  }
}

// ================= Run Script ================= //
async function run() {
  const allShowRows = [];
  const allCitySummaries = [];

  for (const [cityName, cityData] of Object.entries(cities)) {
    console.log(`Fetching: ${cityName.toUpperCase()}`);
    const { showRows, citySummary } = await fetchShowtimes(cityData);
    allShowRows.push(...showRows);
    if(citySummary) allCitySummaries.push(citySummary);
    await new Promise(r => setTimeout(r, 3000)); // 3s delay per city
  }

  // Save CSVs
  saveCSV(allShowRows, "telangana_showwise.csv");
  saveCSV(allCitySummaries, "telangana_citywise.csv");

  console.log(`✅ Telangana fetch completed. Total shows: ${allShowRows.length}, Total cities: ${allCitySummaries.length}`);
}

run();
