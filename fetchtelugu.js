import fs from "fs";
import fetch from "node-fetch";

// ---------------- Save to CSV ----------------
function saveToCSV(data, filenameBase, language) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const rows = data.map(obj =>
    headers.map(h => `"${obj[h] !== undefined ? obj[h] : ""}"`).join(",")
  );
  const csvContent = [headers.join(","), ...rows].join("\n");

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, "").split(".")[0];
  const folder = "output";

  fs.mkdirSync(folder, { recursive: true });
  const filename = `${folder}/${filenameBase}_${language}_${timestamp}.csv`;
  fs.writeFileSync(filename, csvContent, "utf8");
  console.log(`💾 Saved ${filename}`);
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
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  for (const city of cities) {
    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.21345445.1703250084656&token=67x1xa33b4x422b361ba&lat=${city.lat}&lon=${city.lon}&query='&dateCode=20250814`;

    const headers = {
      Host: "in.bookmyshow.com",
      "x-bms-id": "1.21345445.1703250084656",
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
      "x-latitude": city.lat,
      "x-longitude": city.lon,
      "x-location-selection": "manual",
      "x-location-shared": "false",
      lang: "en",
      "user-agent": "Dalvik/2.1.0 (Linux; U; Android 12; Pixel XL Build/SP2A.220505.008)",
    };

    let cityTotalSeats = 0, cityBookedSeats = 0, cityBookedCollection = 0, cityTotalPotentialCollection = 0, cityWeightedPriceSum = 0, totalShowsInCity = 0;

    try {
      const resp = await fetch(url, { method: "GET", headers });
      if (!resp.ok) { console.error(`Failed fetch for ${city.name}`); continue; }
      const data = await resp.json();
      if (!data.ShowDetails?.length) continue;

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
    } catch (err) { console.error(`Error ${city.name}:`, err); }
  }

  return { showRows, cityResults };
}

// ---------------- Telugu Cities ----------------
const teluguCities = [
  { name: "Bengaluru", code: "BANG", slug: "bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Hubli", code: "HUBL", slug: "hubli", lat: 15.3647, lon: 75.1237 },
  { name: "Gulbarga", code: "GULB", slug: "gulbarga", lat: 17.3297, lon: 76.8343 },
  { name: "Tumkur", code: "TUMK", slug: "tumkur", lat: 13.3392, lon: 77.1135 },
  { name: "Manipal", code: "MANI", slug: "manipal", lat: 13.3567, lon: 74.7861 },
  { name: "Mangalore", code: "MLR", slug: "mangalore", lat: 12.9141, lon: 74.856 },
  { name: "Davangere", code: "DAVA", slug: "davangere", lat: 14.4646, lon: 75.921 },
  { name: "Bidar", code: "BIDR", slug: "bidar", lat: 17.9133, lon: 77.5301 },
  { name: "Chikballapur", code: "CHIK", slug: "chikballapur", lat: 13.435, lon: 77.7317 },
  { name: "Vijayapura", code: "VIJP", slug: "bijapur", lat: 16.8307, lon: 75.710 },
  { name: "Kolar", code: "OLAR", slug: "kolar", lat: 13.1364, lon: 78.1298 },
  { name: "Malur", code: "MLLR", slug: "malur", lat: 13.2817, lon: 78.2062 },
  { name: "Tiptur", code: "TIPT", slug: "tiptur", lat: 13.3153, lon: 76.4537 },
  { name: "Raichur", code: "RAUR", slug: "raichur", lat: 16.2076, lon: 77.3439 },
  { name: "Hospet", code: "HOSP", slug: "hospet", lat: 15.2695, lon: 76.3871 },
  { name: "Bellary", code: "BLRY", slug: "bellary", lat: 15.1394, lon: 76.9214 },
];

const teluguEventCode = "ET00446734"; // Telugu movie event code

// ---------------- Main Execution ----------------
(async () => {
  console.log("Fetching Telugu shows...");
  const { showRows, cityResults } = await fetchShowtimesForCities(teluguEventCode, teluguCities, "Telugu");

  saveToCSV(showRows, "show-wise", "Telugu");
  saveToCSV(cityResults, "city-wise", "Telugu");

  console.log("✅ Telugu data fetched and saved.");
})();
