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
  miryalaguda: { regionCode: "MRGD", subRegionCode: "MRGD", latitude: "16.8667", longitude: "79.5833" },
  siddipet: { regionCode: "SDDP", subRegionCode: "SDDP", latitude: "18.1033", longitude: "78.8489" },
  jagtial: { regionCode: "JGTL", subRegionCode: "JGTL", latitude: "18.8000", longitude: "79.5333" },
  sircilla: { regionCode: "SIRC", subRegionCode: "SIRC", latitude: "18.8000", longitude: "78.8667" },
  kamareddy: { regionCode: "KMRD", subRegionCode: "KMRD", latitude: "18.3269", longitude: "78.3361" },
  palwancha: { regionCode: "PLWA", subRegionCode: "PLWA", latitude: "17.5556", longitude: "80.6364" },
  kothagudem: { regionCode: "KTGM", subRegionCode: "KTGM", latitude: "17.5500", longitude: "80.6333" },
  bodhan: { regionCode: "BODH", subRegionCode: "BODH", latitude: "18.6700", longitude: "78.6700" },
  sangareddy: { regionCode: "SARE", subRegionCode: "SARE", latitude: "17.6231", longitude: "78.0860" },
  metpally: { regionCode: "METT", subRegionCode: "METT", latitude: "18.8167", longitude: "79.5667" },
  zaheerabad: { regionCode: "ZAGE", subRegionCode: "ZAGE", latitude: "17.6790", longitude: "77.5970" },
  korutla: { regionCode: "KCKA", subRegionCode: "KCKA", latitude: "18.8200", longitude: "78.5500" },
  tandur: { regionCode: "TAND", subRegionCode: "TAND", latitude: "17.1600", longitude: "77.5800" },
  kodad: { regionCode: "KODA", subRegionCode: "KODA", latitude: "16.9000", longitude: "79.9333" },
  armoor: { regionCode: "ARMO", subRegionCode: "ARMO", latitude: "18.8700", longitude: "78.4300" },
  gadwal: { regionCode: "GADW", subRegionCode: "GADW", latitude: "16.2667", longitude: "77.8000" },
  wanaparthy: { regionCode: "WANA", subRegionCode: "WANA", latitude: "16.2667", longitude: "78.0167" },
  bellampally: { regionCode: "BELL", subRegionCode: "BELL", latitude: "18.9000", longitude: "79.3833" },
  bhongir: { regionCode: "BHUV", subRegionCode: "BHUV", latitude: "17.5150", longitude: "78.8880" },
  vikarabad: { regionCode: "VKBD", subRegionCode: "VKBD", latitude: "17.3300", longitude: "77.9000" },
  mahbubabad: { regionCode: "MAHA", subRegionCode: "MAHA", latitude: "17.5500", longitude: "80.5500" },
  jangaon: { regionCode: "JNGN", subRegionCode: "JNGN", latitude: "17.7200", longitude: "79.1500" },
  bhadrachelam: { regionCode: "BHDR", subRegionCode: "BHDR", latitude: "17.6650", longitude: "80.8800" },
  bhupalapally: { regionCode: "BHUP", subRegionCode: "BHUP", latitude: "18.4600", longitude: "79.5700" },
  narayanpet: { regionCode: "NRYN", subRegionCode: "NRYN", latitude: "16.9000", longitude: "77.4800" },
  peddapalli: { regionCode: "PEDA", subRegionCode: "PEDA", latitude: "18.6100", longitude: "79.4000" },
  huzurnagar: { regionCode: "HUZU", subRegionCode: "HUZU", latitude: "17.1200", longitude: "79.6000" },
  medchal: { regionCode: "MDCH", subRegionCode: "MDCH", latitude: "17.5300", longitude: "78.6000" },
  manuguru: { regionCode: "MNGU", subRegionCode: "MNGU", latitude: "17.5500", longitude: "80.8200" },
  achampet: { regionCode: "ACHM", subRegionCode: "ACHM", latitude: "16.5800", longitude: "78.3500" }
};

// ================= Event Codes ================= //
const eventCodes = [
  { movie: "They Call Him OG", code: "ET00369074" }
];

// ================= Helper Functions ================= //
function getNextDay() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
}

function processShowtimeData(data, movieName) {
  const results = [];
  let grandTotalMaxSeats = 0, grandTotalBookedTickets = 0, grandTotalGross = 0, grandBookedGross = 0, totalShows = 0;

  data.ShowDetails.forEach(showDetail => {
    showDetail.Venues.forEach(venue => {
      venue.ShowTimes.forEach(showTime => {
        totalShows++;
        let totalMaxSeats = 0, totalBookedTickets = 0, totalGross = 0, bookedGross = 0;

        showTime.Categories.forEach(category => {
          const maxSeats = parseInt(category.MaxSeats, 10) || 0;
          const seatsAvail = parseInt(category.SeatsAvail, 10) || 0;
          const bookedTickets = maxSeats - seatsAvail;
          const price = parseFloat(category.CurPrice) || 0;

          totalMaxSeats += maxSeats;
          totalBookedTickets += bookedTickets;
          totalGross += maxSeats * price;
          bookedGross += bookedTickets * price;
        });

        grandTotalMaxSeats += totalMaxSeats;
        grandTotalBookedTickets += totalBookedTickets;
        grandTotalGross += totalGross;
        grandBookedGross += bookedGross;

        results.push({
          Movie: movieName,
          VenueName: venue.VenueName,
          ShowTime: showTime.ShowTime,
          MaxSeats: totalMaxSeats,
          BookedSeats: totalBookedTickets,
          Occupancy: totalMaxSeats > 0 ? `${((totalBookedTickets / totalMaxSeats) * 100).toFixed(2)}%` : "0.00%",
          TotalGross: totalGross.toFixed(0),
          BookedGross: bookedGross.toFixed(0)
        });
      });
    });
  });

  return {
    results,
    totalShows,
    totalBookedGross: grandBookedGross.toFixed(0),
    totalGross: grandTotalGross.toFixed(0),
    totalOccupancy: grandTotalMaxSeats > 0 ? `${((grandTotalBookedTickets / grandTotalMaxSeats) * 100).toFixed(2)}%` : "0.00%"
  };
}

async function fetchShowtimes(city, cityName, eventCode, movieName) {
  const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?eventCode=${eventCode}&regionCode=${city.regionCode}&subRegion=${city.subRegionCode}&lat=${city.latitude}&lon=${city.longitude}&date=${getNextDay()}`;

  const headers = {
    "x-platform": "DESKTOP",
    "x-app-code": "BMSWEB",
    "Accept": "application/json"
  };

  try {
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return processShowtimeData(data, movieName);
  } catch (error) {
    console.error(`Error fetching data for ${cityName} (${movieName}, ${eventCode}):`, error);
    return null;
  }
}

async function fetchAllCitiesAndEvents() {
  const allData = [];
  for (const [cityName, cityData] of Object.entries(cities)) {
    console.log(`\n📍 Fetching data for ${cityName.toUpperCase()}...`);
    for (const event of eventCodes) {
      console.log(`🎬 Fetching data for "${event.movie}" (${event.code})...`);
      const results = await fetchShowtimes(cityData, cityName, event.code, event.movie);
      if (results) {
        const cityOutput = {
          City: cityName.toUpperCase(),
          Movie: event.movie,
          EventCode: event.code,
          "Total Shows": results.totalShows,
          "Booked Seats": results.results.reduce((sum, r) => sum + r.BookedSeats, 0),
          "Max Seats": results.results.reduce((sum, r) => sum + r.MaxSeats, 0),
          "Occupancy": results.totalOccupancy,
          "Booked Gross": `₹${results.totalBookedGross}`,
          "Total Gross": `₹${results.totalGross}`
        };

        allData.push(cityOutput);

        // Write individual city CSV
        const csvHeader = Object.keys(cityOutput).join(",") + "\n";
        const csvRow = Object.values(cityOutput).join(",") + "\n";
        const outputDir = path.join(".", "output_telangana");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
        fs.appendFileSync(path.join(outputDir, `${cityName}.csv`), csvHeader + csvRow);
      }
    }
  }

  console.table(allData);
}

// ================= Run Script ================= //
fetchAllCitiesAndEvents();

