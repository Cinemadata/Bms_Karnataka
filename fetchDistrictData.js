import fs from "fs";
import path from "path";
import fetch from "node-fetch"; // Ensure node-fetch is installed

// --- Output folder ---
const outputDir = path.join(process.cwd(), "output");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// --- Timestamp ---
function getTimestamp() {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
}

// --- Save CSV ---
function saveToCSV(arr, filenameBase) {
  if (!arr.length) {
    console.warn(`⚠️ No data to save for ${filenameBase}.csv`);
    return;
  }
  const headers = Object.keys(arr[0]);
  const rows = arr.map(obj =>
    headers.map(h => `"${String(obj[h] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csvContent = headers.join(",") + "\n" + rows.join("\n");
  const fileName = `${filenameBase}.csv`; 
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, csvContent, { flag: "w" });
  console.log(`💾 Saved ${path.relative(process.cwd(), filePath)}`);
}

// --- Config ---
const eventCode = "MV172677";
const formatMap = {
  Telugu: "rF_IgPQApY",
  Tamil: "zcw3aqxszc",
  Kannada: "k3W3TZbHuT"
};
const cities = ["Bengaluru"];
const allowedVenues = ["sandhya", "manasa", "balaji", "innovative"];

// --- Data arrays ---
const allShowDetails = [];
const citySummary = [];
const languageSummary = [];

// --- Format IST ---
function formatTimeIST(raw) {
  if (!raw) return "N/A";
  const dt = new Date(raw);
  if (isNaN(dt)) return "N/A";
  return dt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });
}

// --- Today's date ---
const dateCode = "2025-08-16";

// --- Fetch city shows ---
async function fetchCityData(city, frmtId, lang) {
  const url = `https://www.district.in/movies/f1-the-movie-movie-tickets-in-${city}-${eventCode}?frmtid=${frmtId}&fromdate=${dateCode}`;
  try {
    const res = await fetch(url);
    const html = await res.text();

    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) throw new Error("No __NEXT_DATA__ found");

    const data = JSON.parse(match[1]);
    const movieData = data?.props?.pageProps?.initialState?.movies;
    if (!movieData) throw new Error("No movies object found");

    const entityCode = Object.keys(movieData.movieSessions || {})[0];
    if (!entityCode) throw new Error("No entity code found");

    const arranged = movieData.movieSessions[entityCode]?.arrangedSessions || movieData.movieSessions[entityCode]?.sessions;
    if (!arranged || arranged.length === 0) {
      console.warn(`❌ ${city} (${lang}): No sessions found`);
      console.log(JSON.stringify(movieData, null, 2));
      return;
    }

    let shows = 0, booked = 0, max = 0, collection = 0, maxCollection = 0;

    arranged.forEach(venue => {
      const venueName = venue.entityName || "Unknown Venue";
      if (!allowedVenues.some(name => venueName.toLowerCase().startsWith(name))) return;

      (venue.sessions || []).forEach(show => {
        const totalSeats = show.total || 0;
        const availSeats = show.avail || 0;
        const bookedSeats = totalSeats - availSeats;
        if (totalSeats === 0 || bookedSeats <= 0) return;

        let priceSum = 0, count = 0;
        (show.areas || []).forEach(area => {
          if (typeof area.price === "number" && area.price > 30) {
            priceSum += area.price;
            count++;
          }
        });
        const avgPrice = count > 0 ? priceSum / count : 0;
        if (avgPrice <= 30) return;

        const occupancy = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;
        const bookedCollection = bookedSeats * avgPrice;
        const totalCollection = totalSeats * avgPrice;

        allShowDetails.push({
          City: city,
          Language: lang,
          Venue: venueName,
          "Show Time": formatTimeIST(show.showTime || show.time),
          "Total Seats": totalSeats,
          "Booked Seats": bookedSeats,
          "Occupancy (%)": occupancy.toFixed(2),
          "Booked Collection (₹)": "₹" + bookedCollection.toFixed(0),
          "Total Collection (₹)": "₹" + totalCollection.toFixed(0),
          "Avg Ticket Price (₹)": avgPrice.toFixed(2)
        });

        shows++; booked += bookedSeats; max += totalSeats;
        collection += bookedCollection; maxCollection += totalCollection;
      });
    });

    if (shows > 0) {
      citySummary.push({
        City: city,
        Language: lang,
        Shows: shows,
        BookedSeats: booked,
        MaxSeats: max,
        Collection: "₹" + collection.toFixed(0),
        MaxCollection: "₹" + maxCollection.toFixed(0),
        Occupancy: max ? ((booked / max) * 100).toFixed(2) + "%" : "0.00%"
      });

      languageSummary.push({
        Language: lang,
        Shows: shows,
        BookedSeats: booked,
        MaxSeats: max,
        Collection: "₹" + collection.toFixed(0),
        MaxCollection: "₹" + maxCollection.toFixed(0),
        Occupancy: max ? ((booked / max) * 100).toFixed(2) + "%" : "0.00%"
      });
    } else {
      console.warn(`⚠️ Skipped ${city} (${lang}) - no valid shows`);
    }

  } catch (err) {
    console.warn(`❌ ${city} (${lang}): ${err.message}`);
  }
}

// --- Main ---
(async () => {
  console.log(`⏳ Fetching city-wise data for Karnataka on ${dateCode}...`);
  for (let city of cities) {
    for (const [lang, frmtId] of Object.entries(formatMap)) {
      await fetchCityData(city, frmtId, lang);
    }
  }

  console.log("\n📍 All Shows:");
  console.table(allShowDetails);

  console.log("\n📊 City-wise Summary:");
  console.table(citySummary);

  console.log("\n🌐 Language-wise Summary:");
  console.table(languageSummary);

  saveToCSV(allShowDetails, "show-wise");
  saveToCSV(citySummary, "city-wise");
  saveToCSV(languageSummary, "language-wise");
})();
