import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// --- Configurations ---
const eventCode = "MV172677"; // "Coolie" movie event code
const formats = {
  Tamil: "zcw3aqxszc",
  Telugu: "rF_IgPQApY"
};
const cities = ["Bengaluru"];
const allowedVenues = ["sandhya", "manasa", "balaji", "innovative"]; // Empty array [] disables venue filtering
const targetDate = "2025-08-16";

// --- Data storage ---
const allShowDetails = [];
const citySummary = [];
const languageSummary = {};

// --- Helper: safe JSON extraction from HTML ---
function extractNextData(html) {
  const nextDataRegex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s;
  const match = html.match(nextDataRegex);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// --- Main fetch function ---
async function fetchCityData(city, formatId = "", language = "") {
  const url = `https://www.district.in/movies/coolie-movie-tickets-in-${city.toLowerCase()}-${eventCode}?frmtid=${formatId}&fromdate=${targetDate}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const data = extractNextData(html);
    if (!data) throw new Error("No __NEXT_DATA__ JSON found in page");

    const sessionsObj = data?.props?.pageProps?.initialState?.movies?.movieSessions;
    if (!sessionsObj || Object.keys(sessionsObj).length === 0) throw new Error("No sessions found");

    const entityCode = Object.keys(sessionsObj)[0];
    const arranged = sessionsObj[entityCode]?.arrangedSessions;
    if (!arranged || arranged.length === 0) throw new Error("No arrangedSessions found");

    let cityShows = 0, cityBooked = 0, cityMax = 0, cityCollection = 0, cityMaxCollection = 0;
    let fastFilling = 0, soldOut = 0;

    arranged.forEach(venue => {
      if (!venue.venueName) return; // Skip entries with missing venueName
      const venueNameLower = venue.venueName.toLowerCase();
      if (allowedVenues.length > 0 && !allowedVenues.includes(venueNameLower)) return;

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
        if (occupancy >= 60 && occupancy < 100) fastFilling++;
        if (occupancy === 100) soldOut++;

        cityCollection += bookedSeats * avgPrice;
        cityMaxCollection += totalSeats * avgPrice;
        cityBooked += bookedSeats;
        cityMax += totalSeats;
        cityShows++;

        allShowDetails.push({
          Date: targetDate,
          City: city,
          Language: language,
          Venue: venue.venueName,
          ShowTime: show.time || "",
          TotalSeats: totalSeats,
          BookedSeats: bookedSeats,
          AvgPrice: avgPrice.toFixed(2),
          Collection: (bookedSeats * avgPrice).toFixed(0),
          Occupancy: occupancy.toFixed(2) + "%"
        });

        if (!languageSummary[language]) languageSummary[language] = { shows: 0, booked: 0, max: 0, collection: 0 };
        languageSummary[language].shows++;
        languageSummary[language].booked += bookedSeats;
        languageSummary[language].max += totalSeats;
        languageSummary[language].collection += bookedSeats * avgPrice;
      });
    });

    if (cityShows > 0) {
      citySummary.push({
        City: city,
        Shows: cityShows,
        BookedSeats: cityBooked,
        MaxSeats: cityMax,
        Collection: "₹" + cityCollection.toFixed(0),
        MaxCollection: "₹" + cityMaxCollection.toFixed(0),
        Occupancy: cityMax ? ((cityBooked / cityMax) * 100).toFixed(2) + "%" : "0.00%",
        "Fast Filling": fastFilling,
        "Sold Out": soldOut
      });
    } else {
      console.warn(`⚠️ Skipped ${city} (${language}) - no valid shows`);
    }
  } catch (err) {
    console.warn(`❌ ${city} (${language}): ${err.message}`);
  }
}

// --- CSV Save Helper ---
function saveCSV(filename, data) {
  if (!data || data.length === 0) {
    console.warn(`⚠️ No data to save for ${filename}`);
    return;
  }
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => `"${row[h]}"`).join(","))
  ].join("\n");
  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, csv, "utf8");
  console.log(`✅ Saved CSV: ${filename}`);
}

// --- Main Execution ---
(async () => {
  console.log(`⏳ Fetching Bengaluru shows for ${targetDate}...`);
  for (const city of cities) {
    for (const [lang, formatId] of Object.entries(formats)) {
      await fetchCityData(city, formatId, lang);
    }
  }
  console.table(citySummary);

  saveCSV("show-wise.csv", allShowDetails);
  saveCSV("city-wise.csv", citySummary);

  const langCSV = Object.entries(languageSummary).map(([lang, val]) => ({
    Language: lang,
    Shows: val.shows,
    BookedSeats: val.booked,
    MaxSeats: val.max,
    Collection: "₹" + val.collection.toFixed(0),
    Occupancy: val.max ? ((val.booked / val.max) * 100).toFixed(2) + "%" : "0.00%"
  }));
  saveCSV("language-wise.csv", langCSV);
})();
