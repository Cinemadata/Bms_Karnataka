const eventCode = "MV172677";

const cities = [
  "bengaluru"
];

const allowedVenues = ["sandhya", "manasa", "balaji", "innovative"];

const citySummary = [];

async function fetchCityData(city) {
  const url = `https://www.district.in/movies/f1-the-movie-movie-tickets-in-${city}-${eventCode}?frmtid=zcw3aqszc`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) throw new Error("No __NEXT_DATA__");

    const data = JSON.parse(match[1]);
    const sessionsObj = data?.props?.pageProps?.initialState?.movies?.movieSessions;
    if (!sessionsObj) throw new Error("No movieSessions");

    const entityCode = Object.keys(sessionsObj)[0];
    const arranged = sessionsObj[entityCode]?.arrangedSessions;
    if (!arranged) throw new Error("No arrangedSessions");

    console.log(`Total venues arranged: ${arranged.length}`);

    const showDetails = [];

    let shows = 0, booked = 0, max = 0, collection = 0, maxCollection = 0;
    let fastFilling = 0, soldOut = 0;

    arranged.forEach(venue => {
      const venueName = venue.entityName || "Unknown Venue";

      if (!allowedVenues.some(name => venueName.toLowerCase().startsWith(name))) {
        return;
      }

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

        const occupancy = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

        const bookedCollection = bookedSeats * avgPrice;
        const totalCollection = totalSeats * avgPrice;

        // Format show time as IST hh:mm AM/PM only
        let showTimeRaw = show.showTime || show.time || "N/A";
        let formattedShowTime = "N/A";
        if (showTimeRaw !== "N/A") {
          const dt = new Date(showTimeRaw);
          if (!isNaN(dt)) {
            formattedShowTime = dt.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Kolkata"
            });
          }
        }

        showDetails.push({
          City: city,
          Venue: venueName,
          "Show Time": formattedShowTime,
          "Total Seats": totalSeats,
          "Booked Seats": bookedSeats,
          "Occupancy (%)": occupancy.toFixed(2),
          "Booked Collection (₹)": "₹" + bookedCollection.toFixed(0),
          "Total Collection (₹)": "₹" + totalCollection.toFixed(0),
          "Avg Ticket Price (₹)": avgPrice.toFixed(2)
        });

        if (occupancy >= 60 && occupancy < 100) fastFilling++;
        if (occupancy === 100) soldOut++;

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
        Shows: shows,
        BookedSeats: booked,
        MaxSeats: max,
        Collection: "₹" + collection.toFixed(0),
        MaxCollection: "₹" + maxCollection.toFixed(0),
        Occupancy: max ? ((booked / max) * 100).toFixed(2) + "%" : "0.00%",
        "Fast Filling": fastFilling,
        "Sold Out": soldOut
      });

      console.log(`\nShow-wise details for ${city}:`);
      console.table(showDetails);
    } else {
      console.warn(`⚠️ Skipped ${city} - no valid shows`);
    }

  } catch (err) {
    console.warn(`❌ ${city}: ${err.message}`);
  }
}

(async () => {
  console.log("⏳ Fetching city-wise data for Karnataka...");

  for (let city of cities) {
    await fetchCityData(city);
  }

  console.log("\nCity-wise summary:");
  console.table(citySummary);

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

  console.log(`\n📊 Karnataka Summary:
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
