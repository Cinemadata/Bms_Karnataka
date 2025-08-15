import fs from "fs";
import path from "path";

// ---------------- Output folder ----------------
const outputDir = path.join(process.cwd(), "output");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ---------------- CSV Save ----------------
function saveToCSV(arr, filenameBase) {
  if (!arr.length) return console.warn(`⚠️ No data to save for ${filenameBase}.csv`);
  const headers = Object.keys(arr[0]);
  const rows = arr.map(obj =>
    headers.map(h => `"${String(obj[h] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csvContent = headers.join(",") + "\n" + rows.join("\n");
  const filePath = path.join(outputDir, `${filenameBase}.csv`);

  // Append if exists, otherwise create new
  try {
    if (fs.existsSync(filePath)) fs.appendFileSync(filePath, "\n" + rows.join("\n"), "utf8");
    else fs.writeFileSync(filePath, csvContent, "utf8");
    console.log(`💾 Saved ${path.relative(process.cwd(), filePath)}`);
  } catch (err) {
    console.error(`❌ Failed to save CSV: ${err.message}`);
  }
}

// ---------------- Time Formatter ----------------
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

// ---------------- Fetch City Data ----------------
async function fetchCityData(city, frmtId, lang, allShowDetails, citySummary, languageSummary, allowedVenues) {
  const url = `https://www.district.in/movies/f1-the-movie-movie-tickets-in-${city}-${frmtId}`;
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
    if (!arranged) throw new Error("No arrangedSessions");

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
          if (typeof area.price === "number" && area.price > 30) {
            priceSum += area.price;
            count++;
          }
        });
        const avgPrice = count > 0 ? priceSum / count : 0;
        if (avgPrice <= 30) return;

        const occupancy = totalSeats ? (bookedSeats / totalSeats) * 100 : 0;
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
    }
  } catch (err) {
    console.warn(`❌ ${city} (${lang}): ${err.message}`);
  }
}

// ---------------- Main ----------------
(async () => {
  const cities = ["bengaluru"];
  const allowedVenues = ["sandhya", "manasa", "balaji", "innovative"];
  
  const frmtTelugu = "rF_IgPQApY";
  const frmtTamil = "ET00395817"; // Replace with actual Tamil format ID
  
  const allShowDetails = [];
  const citySummary = [];
  const languageSummary = [];

  console.log("⏳ Fetching Telugu shows...");
  for (let city of cities) {
    await fetchCityData(city, frmtTelugu, "Telugu", allShowDetails, citySummary, languageSummary, allowedVenues);
  }

  console.log("⏳ Fetching Tamil shows...");
  for (let city of cities) {
    await fetchCityData(city, frmtTamil, "Tamil", allShowDetails, citySummary, languageSummary, allowedVenues);
  }

  // ---------------- Output ----------------
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

