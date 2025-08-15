import fs from "fs";
import path from "path";
import fetch from "node-fetch"; // make sure node-fetch is installed

// Ensure output folder exists
const outputDir = path.join(process.cwd(), "output");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Save array to CSV
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
  const filePath = path.join(outputDir, `${filenameBase}.csv`);

  try {
    fs.writeFileSync(filePath, csvContent, { flag: "w" });
    console.log(`💾 Saved ${path.relative(process.cwd(), filePath)}`);
  } catch (err) {
    console.error(`❌ Failed to save CSV: ${err.message}`);
  }
}

// === Config ===
const eventCode = "MV172677";   // Same event code
const formatIDs = {
  Telugu: "rF_IgPQApY",
  Tamil: "zcw3aqxszc",
  Kannada: "k3W3TZbHuT"
};
const cities = ["Bengaluru"];
const allowedVenues = ["sandhya", "manasa", "balaji", "innovative"];

// Data arrays
const allShowDetails = [];
const citySummary = [];
const languageSummary = [];

// Format IST
function formatTimeIST(raw) {
  if (!raw) return "N/A";
  const dt = new Date(raw);
  return isNaN(dt)
    ? "N/A"
    : dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
}

// Fetch city data
async function fetchCityData(city, frmtId, lang) {
  const url = `https://www.district.in/movies/f1-the-movie-movie-tickets-in-${city}-${eventCode}?frmtid=${frmtId}`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) throw new Error("No __NEXT_DATA__ found");

    const data = JSON.parse(match[1]);
    const sessionsObj = data?.props?.pageProps?.initialState?.movies?.movieSessions;
    if (!sessionsObj) throw new Error("No movieSessions found");

    const entityCode = Object.keys(sessionsObj)[0];
    const arranged = sessionsObj[entityCode]?.arrangedSessions;
    if (!arranged || arranged.length === 0) throw new Error("No arrangedSessions");

    let shows = 0, booked = 0, max = 0, collection = 0, maxCollection = 0;

    arranged.forEach(venue => {
      const venueName = venue.entityName || "Unknown Venue";
      if (!allowedVenues.some(name => venueName.toLowerCase().startsWith(name))) return;

      venue.sessions.forEach(show => {
        const totalSeats = show.total || 0;
        const availSeats = show.avail || 0;
        const bookedSeats = totalSeats - availSeats;
        if (totalSeats === 0 || bookedSeats <= 0) return;

        let priceSum = 0, count = 0;
        (show.areas || []).forEach(area => {
          if (typeof area.price === "number" && area.price > 30) { priceSum += area.price; count++; }
        });
        const avgPrice = count ? priceSum / count : 0;
        if (avgPrice <= 30) return;

        const occupancy = (bookedSeats / totalSeats) * 100;
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

        booked += bookedSeats;
        max += totalSeats;
        collection += bookedCollection;
        maxCollection += totalCollection;
        shows++;
      });
    });

    if (shows > 0) {
      citySummary.push({ City: city, Language: lang, Shows: shows, BookedSeats: booked, MaxSeats: max, Collection: "₹" + collection.toFixed(0), MaxCollection: "₹" + maxCollection.toFixed(0), Occupancy: ((booked / max) * 100).toFixed(2) + "%" });
      languageSummary.push({ Language: lang, Shows: shows, BookedSeats: booked, MaxSeats: max, Collection: "₹" + collection.toFixed(0), MaxCollection: "₹" + maxCollection.toFixed(0), Occupancy: ((booked / max) * 100).toFixed(2) + "%" });
    } else {
      console.warn(`⚠️ Skipped ${city} (${lang}) - no valid shows`);
    }

  } catch (err) {
    console.warn(`❌ ${city} (${lang}): ${err.message}`);
  }
}

// === Main ===
(async () => {
  console.log("⏳ Fetching city-wise data for Karnataka...");

  for (const city of cities) {
    for (const [lang, frmtId] of Object.entries(formatIDs)) {
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

