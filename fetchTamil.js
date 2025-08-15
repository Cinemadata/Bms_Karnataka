import fs from "fs";

// ---------------- Save to CSV ---------------
function saveToCSV(data, filenameBase) {
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
  const filename = `${folder}/${filenameBase}_tamil_${timestamp}.csv`;
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

  const today = new Date();
  const dateCode = `${today.getFullYear()}${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;

  for (const city of cities) {
    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.21345445.1703250084656&token=67x1xa33b4x422b361ba&lat=${city.lat}&lon=${city.lon}&query=&dateCode=${dateCode}`;

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

    let cityTotalSeats = 0,
      cityBookedSeats = 0,
      cityBookedCollection = 0,
      cityTotalPotentialCollection = 0,
      cityWeightedPriceSum = 0,
      totalShowsInCity = 0;

    try {
      const resp = await fetch(url, { method: "GET", headers });
      if (!resp.ok) {
        console.error(`Failed fetch for ${city.name}`);
        continue;
      }
      const data = await resp.json();
      if (!data.ShowDetails?.length) continue;

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

      const cityOccupancy = cityTotalSeats
        ? ((cityBookedSeats / cityTotalSeats) * 100).toFixed(2)
        : "0.00";
      const cityAvgTicketPrice = cityTotalSeats
        ? (cityWeightedPriceSum / cityTotalSeats).toFixed(2)
        : "0.00";

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
    } catch (err) {
      console.error(`Error ${city.name}:`, err);
    }
  }

  return { showRows, cityResults };
}

// ---------------- Cities & Event ----------------
const tamilCities = [
  { name: "Bengaluru", code: "BANG", slug: "bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Mysore", code: "MYS", slug: "mysore", lat: 12.2958, lon: 76.6394 },
  { name: "Hubli", code: "HUBL", slug: "hubli", lat: 15.3647, lon: 75.1237 },
  { name: "Shivamogga", code: "SHIA", slug: "shivamogga", lat: 13.9299, lon: 75.5681 },
  { name: "Tumkur", code: "TUMK", slug: "tumkur", lat: 13.3392, lon: 77.1135 },
  { name: "Kundapura", code: "KUNA", slug: "kundapura", lat: 13.4333, lon: 74.75 },
  { name: "Manipal", code: "MANI", slug: "manipal", lat: 13.3567, lon: 74.7861 },
  { name: "Mangalore", code: "MLR", slug: "mangalore", lat: 12.9141, lon: 74.856 },
  { name: "Davangere", code: "DAVA", slug: "davangere", lat: 14.4646, lon: 75.921 },
  { name: "Bhadravati", code: "BDVT", slug: "bhadravati", lat: 13.8476, lon: 75.7045 },
  { name: "Malur", code: "MLLR", slug: "malur", lat: 13.2817, lon: 78.2062 },
  { name: "Kanakapura", code: "KAKP", slug: "kanakapura", lat: 12.5797, lon: 77.4112 },
  { name: "Udupi", code: "UDUP", slug: "udupi", lat: 13.3409, lon: 74.7421 },
  { name: "Puttur", code: "PTTU", slug: "puttur", lat: 12.7594, lon: 75.2422 },
  { name: "Karwar", code: "KWAR", slug: "karwar", lat: 14.8054, lon: 74.1304 },
  { name: "Hospet", code: "HOSP", slug: "hospet", lat: 15.2695, lon: 76.3871 },
];

const tamilEventCode = "ET00395817";

// ---------------- Main Execution ----------------
(async () => {
  console.log("Fetching Tamil shows...");
  const { showRows, cityResults } = await fetchShowtimesForCities(tamilEventCode, tamilCities, "Tamil");

  saveToCSV(showRows, "show-wise");
  saveToCSV(cityResults, "city-wise");

  // Language totals
  let totalShows = 0,
    totalSeats = 0,
    bookedSeats = 0,
    bookedCollection = 0,
    totalCollection = 0,
    weightedPriceSum = 0;

  for (const c of cityResults) {
    totalShows += c["Total Shows"];
    totalSeats += c["Total Seats"];
    bookedSeats += c["Booked Seats"];
    bookedCollection += parseFloat(c["Booked Collection (₹)"]);
    totalCollection += parseFloat(c["Total Collection (₹)"]);
    weightedPriceSum += parseFloat(c["Avg Ticket Price (₹)"]) * c["Total Seats"];
  }

  const occupancy = totalSeats ? ((bookedSeats / totalSeats) * 100).toFixed(2) : "0.00";
  const avgTicketPrice = totalSeats ? (weightedPriceSum / totalSeats).toFixed(2) : "0.00";

  const languageSummary = [
    {
      Language: "Tamil",
      "Total Shows": totalShows,
      "Total Seats": totalSeats,
      "Booked Seats": bookedSeats,
      "Occupancy (%)": `${occupancy}%`,
      "Booked Collection (₹)": bookedCollection.toFixed(2),
      "Total Collection (₹)": totalCollection.toFixed(2),
      "Avg Ticket Price (₹)": avgTicketPrice,
    },
  ];
  saveToCSV(languageSummary, "language-wise");

  console.log("✅ Tamil data fetched and saved.");
})();
