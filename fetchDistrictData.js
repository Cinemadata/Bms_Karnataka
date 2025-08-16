import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Ensure output folder exists
const outputDir = path.join(process.cwd(), "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to generate timestamp like 20250813204447
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

// CSV saving helper
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
  const fileName = `${filenameBase}_${getTimestamp()}.csv`;
  const filePath = path.join(outputDir, fileName);
  try {
    fs.writeFileSync(filePath, csvContent);
    console.log(`💾 Saved ${path.relative(process.cwd(), filePath)}`);
  } catch (err) {
    console.error(`❌ Failed to save CSV: ${err.message}`);
  }
}

// Configurations
const eventCode = "MV172677";
const frmtTelugu = "rF_IgPQApY";
const frmtHindi = "ZcW3aqXSzc";
const cities = ["bengaluru"];
const allowedVenues = ["sandhya", "manasa", "balaji", "innovative"];

const citySummary = [];
const languageSummary = [];
const allShowDetails = [];

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

async function fetchCityData(city, frmtId, lang) {
  const url = `https://www.district.in/movies/f1-the-movie-movie-tickets-in-${city}-${eventCode}?frmtid=${frmtId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Fix regex to extract __NEXT_DATA__ JSON correctly
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (!match) throw new Error("No __NEXT_DATA__ found");
    const data = JSON.parse(match[1]);

    const sessionsObj = data?.props?.pageProps?.initialState?.movies?.movieSessions;
    if (!sessionsObj) throw new Error("No movieSessions found");
    const entityCode = Object.keys(sessionsObj)[0];
    const arranged = sessionsObj[entityCode]?.arrangedSessions;
    if (!arranged) throw new Error("No arrangedSessions");

    let shows = 0, booked = 0, max = 0, collection = 0, maxCollection = 0;

    arranged.forEach(venue => {
      const venueName = venue.entityName || venue.venueName || "Unknown Venue";
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

        const showObj = {
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
        };

        allShowDetails.push(showObj);
        collection += bookedCollection;
        maxCollection += totalCollection;
        booked += bookedSeats;
        max += totalSeats;
        shows++;
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

(async () => {
  console.log("⏳ Fetching city-wise data for Karnataka...");
  for (const city of cities) {
    await fetchCityData(city, frmtTelugu, "Telugu");
    await fetchCityData(city, frmtHindi, "Hindi");
  }

  console.log("\n📍 All Shows (Telugu + Hindi):");
  console.table(allShowDetails);
  console.log("\n📊 City-wise Summary:");
  console.table(citySummary);
  console.log("\n🌐 Language-wise Summary:");
  console.table(languageSummary);

  saveToCSV(allShowDetails, "show-wise");
  saveToCSV(citySummary, "city-wise");
  saveToCSV(languageSummary, "language-wise");
})();

