// ================= Node.js Script: fetchShows.js =================

import fs from "fs";
import path from "path";


// ================= Cities (All Telangana: Updated) ================= //
const cities = {
  miryalaguda: { regionCode: "MRGD", subRegionCode: "MRGD", latitude: "16.8667", longitude: "79.5333" },
  siddipet: { regionCode: "SDDP", subRegionCode: "SDDP", latitude: "18.1083", longitude: "78.8533" },
  jagtial: { regionCode: "JGTL", subRegionCode: "JGTL", latitude: "18.8000", longitude: "78.9333" },
  sircilla: { regionCode: "SIRC", subRegionCode: "SIRC", latitude: "18.8000", longitude: "78.8000" },
  kamareddy: { regionCode: "KMRD", subRegionCode: "KMRD", latitude: "18.3250", longitude: "78.3322" },
  palwancha: { regionCode: "PLWA", subRegionCode: "PLWA", latitude: "17.5260", longitude: "80.6287" },
  kothagudem: { regionCode: "KTGM", subRegionCode: "KTGM", latitude: "17.5500", longitude: "80.6333" },
  bodhan: { regionCode: "BODH", subRegionCode: "BODH", latitude: "18.6723", longitude: "78.6719" },
  sangareddy: { regionCode: "SARE", subRegionCode: "SARE", latitude: "17.6200", longitude: "78.0900" },
  metpally: { regionCode: "METT", subRegionCode: "METT", latitude: "18.8000", longitude: "79.4500" },
  
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
  if (!data?.ShowDetails) return { totalShows, totalBookedSeats, totalMaxSeats, totalGross, totalBookedGross, occupancy: '0.00%' };

  data.ShowDetails.forEach(showDetail => {
    showDetail.Venues?.forEach(venue => {
      venue.ShowTimes?.forEach(showTime => {
        totalShows++;
        showTime.Categories?.forEach(category => {
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

  if(allResults.length){
    const csvHeader = Object.keys(allResults[0]).join(",") + "\n";
    const csvRows = allResults.map(r =>
      Object.values(r).map(v => `"${v}"`).join(",")
    ).join("\n");

    const outputDir = path.join(".", "output_telangana");
    fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    fs.writeFileSync(path.join(outputDir, `telangana_city_summary_${timestamp}.csv`), csvHeader+csvRows);
  }
}

run();
