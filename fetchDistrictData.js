import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// --- Config ---
const eventCode = "MV175956";
const formats = {
  English: "d0cx21twur",
  Hindi: "K9lw0pKV2~",
  Telugu: "rF_IgPQApY",
  Tamil: "zcw3aqxszc",
  Kannada: "k3W3TZbHuT"
};
const cities = [
  "bengaluru", "mysuru", "hubli", "kalaburagi", "shivamogga", "belagavi", "tumakuru",
  "manipal", "mangalore", "davanagere", "chikkaballapura", "bhadravati", "kolar", "sidlaghatta",
  "tiptur", "magadi", "belur", "gadag", "bijapur", "mudhol", "gundlupet", "bhatkal", "channarayapatna",
  "bagalkot", "shahpur", "chitradurga", "ranebennur", "chamarajanagara", "karwar", "bagepalli",
  "gokak", "kushalnagar"
];

const citySummary = [];
const showWiseSummary = [];
const targetDate = "2025-08-16";

// --- Fetch city data ---
async function fetchCityData(city, formatId = "", language = "") {
  const url = `https://www.district.in/movies/f1-the-movie-movie-tickets-in-${city}-${eventCode}${formatId ? `?frmtid=${formatId}&fromdate=${targetDate}` : `?fromdate=${targetDate}`}`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) throw new Error("No __NEXT_DATA__");

    const data = JSON.parse(match[1]);
    const sessionsObj = data?.props?.pageProps?.initialState?.movies?.movieSessions;
    if (!sessionsObj || Object.keys(sessionsObj).length === 0) throw new Error("No sessions found");

    const entityCode = Object.keys(sessionsObj)[0];
    const arranged = sessionsObj[entityCode]?.arrangedSessions;
    if (!arranged || arranged.length === 0) throw new Error("No arrangedSessions");

    let shows = 0, booked = 0, max = 0, collection = 0, maxCollection = 0;
    let fastFilling = 0, soldOut = 0;

    arranged.forEach(venue => {
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

        collection += bookedSeats * avgPrice;
        maxCollection += totalSeats * avgPrice;
        booked += bookedSeats;
        max += totalSeats;
        shows++;

        // Add to show-wise CSV array
        showWiseSummary.push({
          Date: targetDate,
          City: city,
          Language: language,
          Venue: venue.venueName || "Unknown",
          ShowTime: show.time || "",
          TotalSeats: totalSeats,
          BookedSeats: bookedSeats,
          AvgPrice: avgPrice.toFixed(2),
          Collection: (bookedSeats * avgPrice).toFixed(0),
          Occupancy: occupancy.toFixed(2) + "%"
        });
      });
    });

    if (shows > 0) {
      citySummary.push({
        City: city,
        Shows: shows,
        BookedSeats: booked,
        MaxSeats: max,
        Collection: "₹" + collection.toFixed(0),
        MaxCollection: "₹" + maxCollection.toFixed(0),
        Occupancy: max ? ((booked / max) * 100).toFixed(2) + "%" : "0.00%",
        "Fast Filling": fastFilling,
        "Sold Out": soldOut
      });
    } else {
      console.warn(`⚠️ Skipped ${city} - no valid shows`);
    }

  } catch (err) {
    console.warn(`❌ ${city} (${language}): ${err.message}`);
  }
}

// --- CSV Save Helpers ---
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

// --- Main ---
(async () => {
  console.log(`⏳ Fetching Karnataka show data for ${targetDate}...`);

  for (let city of cities) {
    for (const [lang, formatId] of Object.entries(formats)) {
      await fetchCityData(city, formatId, lang);
    }
  }

  console.table(citySummary);

  // --- Save CSV ---
  saveCSV("show-wise.csv", showWiseSummary);
  saveCSV("city-wise.csv", citySummary);

  // --- Summary ---
  const total = citySummary.reduce((acc, row) => {
    const clean = n => +String(row[n]).replace(/[₹,%]/g, "");
    acc.shows += row.Shows;
    acc.booked += row.BookedSeats;
    acc.max += row.MaxSeats;
    acc.collection += clean("Collection");
    acc.maxCollection += clean("MaxCollection");
    acc.fast += row["Fast Filling"] || 0;
    acc.sold += row["Sold Out"] || 0;
    return acc;
  }, { shows: 0, booked: 0, max: 0, collection: 0, maxCollection: 0, fast: 0, sold: 0 });

  console.log(`📊 Karnataka Summary (${targetDate}):
Total Cities: ${citySummary.length}
Total Shows: ${total.shows}
Booked Seats: ${total.booked}
Max Seats: ${total.max}
Total Collection: ₹${total.collection}
Max Collection: ₹${total.maxCollection}
Overall Occupancy: ${total.max ? ((total.booked / total.max) * 100).toFixed(2) : "0.00"}%
Fast Filling Shows (60-99.99%): ${total.fast}
Sold Out Shows (100%): ${total.sold}`);
})();

