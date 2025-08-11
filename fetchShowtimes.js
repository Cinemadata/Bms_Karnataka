import fs from "fs";

// Save to CSV function
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

  // Create folder if it doesn't exist
  fs.mkdirSync(folder, { recursive: true });

  const filename = `${folder}/${filenameBase}_${timestamp}.csv`;
  fs.writeFileSync(filename, csvContent, "utf8");
  console.log(`💾 Saved ${filename}`);
}

// Main fetch function
async function fetchShowtimesForCities(eventCode, dateCode, cities) {
  const cityResults = [];
  const venueRows = [];
  const showRows = [];

  function formatShowTime(raw) {
    if (!raw || raw === "N/A") return "Unknown";
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(raw)) return raw;
    const n = Number(raw);
    const d = !isNaN(n) ? new Date(n) : new Date(raw);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  for (const city of cities) {
    if (city.skipFetch) {
      cityResults.push({
        City: city.name,
        "Total Shows": 0,
        "Total Seats": 0,
        "Booked Seats": 0,
        "Occupancy (%)": "0.00%",
        "Booked Collection (₹)": "0.00",
        "Total Collection (₹)": "0.00",
        "Avg Ticket Price (₹)": "0.00"
      });
      continue;
    }

    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.21345445.1703250084656&token=67x1xa33b4x422b361ba&lat=${city.lat}&lon=${city.lon}&query='&dateCode=${dateCode}`;
    const headers = {
      "x-region-code": city.code,
      "x-subregion-code": city.code,
      "x-region-slug": city.slug,
      "user-agent": "Dalvik/2.1.0 (Linux; U; Android 12; Pixel XL Build/SP2A.220505.008)",
    };

    let cityTotalSeats = 0;
    let cityBookedSeats = 0;
    let cityBookedCollection = 0;
    let cityTotalPotentialCollection = 0;
    let cityAvgTicketPriceTotal = 0;
    let cityAvgTicketPriceCount = 0;
    let totalShowsInCity = 0;

    try {
      const resp = await fetch(url, { method: "GET", headers });
      if (!resp.ok) continue;

      const data = await resp.json();
      if (!data.ShowDetails?.length) continue;

      for (const showDetail of data.ShowDetails) {
        for (const venue of showDetail.Venues) {
          let venueTotalSeats = 0;
          let venueBookedSeats = 0;
          let venueBookedCollection = 0;
          let venueTotalPotentialCollection = 0;
          let venueAvgTicketPriceTotal = 0;
          let venueAvgTicketPriceCount = 0;
          let totalShowsInVenue = 0;

          for (const showTime of venue.ShowTimes) {
            totalShowsInVenue++;
            totalShowsInCity++;

            const formattedTime = formatShowTime(showTime.ShowTime);

            let totalSeats = 0;
            let totalBooked = 0;
            let totalShowCollection = 0;
            let sumCategoryPrices = 0;
            let catCount = 0;

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
              City: city.name,
              Venue: venue.VenueName,
              "Show Time": formattedTime,
              "Total Seats": totalSeats,
              "Booked Seats": totalBooked,
              "Occupancy (%)": `${occupancy}%`,
              "Booked Collection (₹)": totalShowCollection.toFixed(2),
              "Total Collection (₹)": totalPotentialCollection.toFixed(2),
              "Avg Ticket Price (₹)": avgPrice.toFixed(2)
            });

            venueTotalSeats += totalSeats;
            venueBookedSeats += totalBooked;
            venueBookedCollection += totalShowCollection;
            venueTotalPotentialCollection += totalPotentialCollection;
            if (catCount > 0) {
              venueAvgTicketPriceTotal += avgPrice;
              venueAvgTicketPriceCount++;
            }

            cityTotalSeats += totalSeats;
            cityBookedSeats += totalBooked;
            cityBookedCollection += totalShowCollection;
            cityTotalPotentialCollection += totalPotentialCollection;
            if (catCount > 0) {
              cityAvgTicketPriceTotal += avgPrice;
              cityAvgTicketPriceCount++;
            }
          }

          const venueOccupancy = venueTotalSeats
            ? ((venueBookedSeats / venueTotalSeats) * 100).toFixed(2)
            : "0.00";
          venueRows.push({
            City: city.name,
            Venue: venue.VenueName,
            "Total Shows": totalShowsInVenue,
            "Total Seats": venueTotalSeats,
            "Booked Seats": venueBookedSeats,
            "Occupancy (%)": `${venueOccupancy}%`,
            "Booked Collection (₹)": venueBookedCollection.toFixed(2),
            "Total Collection (₹)": venueTotalPotentialCollection.toFixed(2),
            "Avg Ticket Price (₹)": venueAvgTicketPriceCount
              ? (venueAvgTicketPriceTotal / venueAvgTicketPriceCount).toFixed(2)
              : "0.00"
          });
        }
      }

      const cityOccupancy = cityTotalSeats
        ? ((cityBookedSeats / cityTotalSeats) * 100).toFixed(2)
        : "0.00";
      cityResults.push({
        City: city.name,
        "Total Shows": totalShowsInCity,
        "Total Seats": cityTotalSeats,
        "Booked Seats": cityBookedSeats,
        "Occupancy (%)": `${cityOccupancy}%`,
        "Booked Collection (₹)": cityBookedCollection.toFixed(2),
        "Total Collection (₹)": cityTotalPotentialCollection.toFixed(2),
        "Avg Ticket Price (₹)": cityAvgTicketPriceCount
          ? (cityAvgTicketPriceTotal / cityAvgTicketPriceCount).toFixed(2)
          : "0.00"
      });

    } catch (err) {
      console.error(`Error fetching city ${city.name}:`, err);
    }
  }

  console.log("📅 Show-wise Table");
  console.table(showRows);
  console.log("🏛 Venue-wise Table");
  console.table(venueRows);
  console.log("🏙 City-wise Table");
  console.table(cityResults);

  return { showRows, venueRows, cityResults };
}

// Karnataka cities list
const karnatakaCities = [
  { name: "Bengaluru", code: "BANG", slug: "bengaluru", lat: 12.9716, lon: 77.5946},
  { name: "Mysore", code: "MYS", slug: "mysore", lat: 12.2958, lon: 76.6394 },
  { name: "Mangalore", code: "MLR", slug: "mangalore", lat: 12.9141, lon: 74.856 },
  { name: "Shivamogga", code: "SHIA", slug: "shivamogga", lat: 13.9299, lon: 75.5681 },
  { name: "Hubli", code: "HUBL", slug: "hubli", lat: 15.3647, lon: 75.1237 },
  { name: "Dharwad", code: "DHAW", slug: "dharwad", lat: 15.4589, lon: 75.0078 },
  { name: "Manipal", code: "MANI", slug: "manipal", lat: 13.3567, lon: 74.7861 },
  { name: "Kundapura", code: "KUNA", slug: "kundapura", lat: 13.4333, lon: 74.75 },
  { name: "Davangere", code: "DAVA", slug: "davangere", lat: 14.4646, lon: 75.921 },
  { name: "Bellary", code: "BLRY", slug: "bellary", lat: 15.1394, lon: 76.9214 },
  { name: "Hospet", code: "HOSP", slug: "hospet", lat: 15.2695, lon: 76.3871 },
  { name: "Raichur", code: "RAUR", slug: "raichur", lat: 16.2076, lon: 77.3439 },
  { name: "Karwar", code: "KWAR", slug: "karwar", lat: 14.8054, lon: 74.1304 },
  { name: "Chitradurga", code: "CHIT", slug: "chitradurga", lat: 14.2304, lon: 76.4019 },
  { name: "Bagalkote", code: "BAGA", slug: "bagalkote", lat: 16.1814, lon: 75.6911 },
  { name: "Mandya", code: "MND", slug: "mandya", lat: 12.5247, lon: 76.8977 },
  { name: "Malur", code: "MLLR", slug: "malur", lat: 13.2817, lon: 78.2062 },
  { name: "Sidlaghatta", code: "SIDL", slug: "sidlaghatta", lat: 13.3036, lon: 77.8934 },
  { name: "Kunigal", code: "KUUN", slug: "kunigal", lat: 13.2113, lon: 77.0843 },
  { name: "Tumkur", code: "TUMK", slug: "tumkur", lat: 13.3392, lon: 77.1135 },
  { name: "Kolar", code: "OLAR", slug: "kolar", lat: 13.1364, lon: 78.1298 },
  { name: "Chikballapura", code: "CHIK", slug: "chikballapur", lat: 13.435, lon: 77.7317 },
  { name: "Belagavi", code: "BELG", slug: "belagavi", lat: 15.8497, lon: 74.4977 },
  { name: "Gulbarga", code: "GULB", slug: "gulbarga", lat: 17.3297, lon: 76.8343 },
  { name: "Bidar", code: "BIDR", slug: "bidar", lat: 17.9133, lon: 77.5301 },
  { name: "Bhadravati", code: "BDVT", slug: "bhadravati", lat: 13.8476, lon: 75.7045 },
  { name: "Tiptur", code: "TIPT", slug: "tiptur", lat: 13.3153, lon: 76.4537 },
  { name: "Vijayapura", code: "VIJP", slug: "bijapur", lat: 16.8307, lon: 75.710 },
];

// Run fetch + save
(async () => {
  const { showRows, venueRows, cityResults } = await fetchShowtimesForCities(
    "ET00395817",
    "20250814",
    karnatakaCities
  );

  saveToCSV(showRows, "show-wise");
  saveToCSV(venueRows, "venue-wise");
  saveToCSV(cityResults, "city-wise");
})();
