// ================= Node.js Script: fetchShows.js =================

import fs from "fs";
import path from "path";

// ================= Cities (All Telangana) ================= //
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

function processShowtimeData(data) {
  let totalShows = 0, totalBookedSeats = 0, totalMaxSeats = 0, totalBookedGross = 0, totalGross = 0;

  data.ShowDetails.forEach(showDetail => {
    showDetail.Venues.forEach(venue => {
      venue.ShowTimes.forEach(showTime => {
        totalShows++;
        showTime.Categories.forEach(category => {
          const maxSeats = parseInt(category.MaxSeats,10)||0;
          const bookedSeats = maxSeats - (parseInt(category.SeatsAvail,10)||0);
          const price = parseFloat(category.CurPrice)||0;

          totalMaxSeats += maxSeats;
          totalBookedSeats += bookedSeats;
          totalGross += maxSeats * price;
          totalBookedGross += bookedSeats * price;
        });
      });
    });
  });

  const occupancy = totalMaxSeats > 0 ? ((totalBookedSeats/totalMaxSeats)*100).toFixed(2)+'%' : '0.00%';
  return { totalShows, totalBookedSeats, totalMaxSeats, totalGross, totalBookedGross, occupancy };
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
    return processShowtimeData(data);
  } catch(e) {
    console.error(`Error fetching city ${cityData.regionCode}:`, e.message);
    return null;
  }
}

// ================= Run Script ================= //
async function run() {
  const allResults = [];
  for (const [cityName, cityData] of Object.entries(cities)) {
    console.log(`Fetching: ${cityName.toUpperCase()}`);
    const stats = await fetchShowtimes(cityData);
    if(stats){
      allResults.push({
        City: cityName.toUpperCase(),
        "Total Shows": stats.totalShows,
        "Booked Seats": stats.totalBookedSeats,
        "Max Seats": stats.totalMaxSeats,
        Occupancy: stats.occupancy,
        "Booked Gross": `₹${stats.totalBookedGross.toFixed(0)}`,
        "Total Gross": `₹${stats.totalGross.toFixed(0)}`
      });
    }
  }

  console.table(allResults);

  // Save consolidated CSV
  const csvHeader = Object.keys(allResults[0]).join(",") + "\n";
  const csvRows = allResults.map(r => Object.values(r).join(",")).join("\n");
  const outputDir = path.join(".", "output_telangana");
  if(!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, `telangana_city_summary.csv`), csvHeader+csvRows);
}

run();
