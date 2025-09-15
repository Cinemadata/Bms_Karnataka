import fs from "fs";



// ---------------- Karnataka Cities ----------------
const karnatakaCities = [
  { name: "Bengaluru", code: "BANG", slug: "bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Mysuru", code: "MYS", slug: "mysuru", lat: 12.2958, lon: 76.6394 },
  { name: "Hubli", code: "HUBL", slug: "hubli", lat: 15.3647, lon: 75.1240 },
  { name: "Kalaburagi", code: "GLB", slug: "kalaburagi", lat: 17.3297, lon: 76.8343 },
  { name: "Shivamogga", code: "SMG", slug: "shivamogga", lat: 13.9299, lon: 75.5681 },
  { name: "Belagavi", code: "BLG", slug: "belagavi", lat: 15.8497, lon: 74.4977 },
  { name: "Tumakuru", code: "TMK", slug: "tumakuru", lat: 13.3422, lon: 77.1010 },
  { name: "Manipal", code: "MPL", slug: "manipal", lat: 13.3522, lon: 74.7929 },
  { name: "Mangalore", code: "MNG", slug: "mangalore", lat: 12.9141, lon: 74.8560 },
  { name: "Davangere", code: "DVG", slug: "davangere", lat: 14.4661, lon: 75.9200 },
  { name: "Chikkaballapura", code: "CBP", slug: "chikkaballapura", lat: 13.4355, lon: 77.7315 },
  { name: "Bhadravati", code: "BVD", slug: "bhadravati", lat: 13.8485, lon: 75.7050 },
  { name: "Kolar", code: "KLR", slug: "kolar", lat: 13.1365, lon: 78.1291 },
  { name: "Sidlaghatta", code: "SDG", slug: "sidlaghatta", lat: 13.3883, lon: 77.8641 },
  { name: "Tiptur", code: "TTP", slug: "tiptur", lat: 13.2586, lon: 76.4777 },
  { name: "Magadi", code: "MGD", slug: "magadi", lat: 12.9572, lon: 77.2235 },
  { name: "Belur", code: "BLR", slug: "belur", lat: 13.1656, lon: 75.8652 },
  { name: "Gadag", code: "GDG", slug: "gadag", lat: 15.4298, lon: 75.6297 },
  { name: "Bijapur", code: "BJP", slug: "bijapur", lat: 16.8302, lon: 75.7100 },
  { name: "Mudhol", code: "MDH", slug: "mudhol", lat: 16.3336, lon: 75.2835 },
  { name: "Gundlupet", code: "GDP", slug: "gundlupet", lat: 11.8101, lon: 76.6909 },
  { name: "Bhatkal", code: "BTL", slug: "bhatkal", lat: 13.9855, lon: 74.5552 },
  { name: "Channarayapatna", code: "CRP", slug: "channarayapatna", lat: 12.9020, lon: 76.3903 },
  { name: "Bagalkot", code: "BKT", slug: "bagalkot", lat: 16.1725, lon: 75.6557 },
  { name: "Shahpur", code: "SHP", slug: "shahpur", lat: 16.6967, lon: 76.8416 },
  { name: "Chitradurga", code: "CTD", slug: "chitradurga", lat: 14.2251, lon: 76.3980 },
  { name: "Ranebennur", code: "RNR", slug: "ranebennur", lat: 14.6220, lon: 75.6220 },
  { name: "Chamarajanagara", code: "CMR", slug: "chamarajanagara", lat: 11.9230, lon: 76.9437 },
  { name: "Karwar", code: "KWR", slug: "karwar", lat: 14.8014, lon: 74.1240 },
  { name: "Bagepalli", code: "BGP", slug: "bagepalli", lat: 13.7839, lon: 77.7961 },
  { name: "Gokak", code: "GKK", slug: "gokak", lat: 16.1753, lon: 74.8231 },
  { name: "Kushalnagar", code: "KSN", slug: "kushalnagar", lat: 12.4578, lon: 75.9603 },
];

// ---------------- CSV Saver ----------------
function saveToCSV(data, filenameBase) {
  if (!data.length) return;
  const today = new Date().toISOString().split("T")[0];
  const folder = `output_${today}`;
  fs.mkdirSync(folder, { recursive: true });
  const filePath = path.join(folder, `${filenameBase}.csv`);

  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => `${r[h] !== undefined ? r[h] : ""}`).join(","));

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, headers.join(",") + "\n" + rows.join("\n") + "\n", "utf8");
  } else {
    fs.appendFileSync(filePath, rows.join("\n") + "\n", "utf8");
  }

  console.log(`💾 Appended ${data.length} rows to ${filePath}`);
}

// ---------------- Fetch Logic ----------------
async function fetchCityData(city, eventCode, dateCode) {
  const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.21345445.1703250084656&token=67x1xa33b4x422b361ba&lat=${city.lat}&lon=${city.lon}&query=&dateCode=${dateCode}`;

  const headers = {
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

  try {
    const resp = await fetch(url, { method: "GET", headers });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.ShowDetails?.length) return [];

    const showRows = [];
    data.ShowDetails.forEach(showDetail => {
      showDetail.Venues.forEach(venue => {
        venue.ShowTimes.forEach(showTime => {
          let totalSeats = 0, bookedSeats = 0, totalCollection = 0, avgPrice = 0;
          showTime.Categories.forEach(cat => {
            const maxSeats = parseInt(cat.MaxSeats) || 0;
            const seatsAvail = parseInt(cat.SeatsAvail) || 0;
            const booked = maxSeats - seatsAvail;
            const price = parseFloat(cat.CurPrice) || 0;
            totalSeats += maxSeats;
            bookedSeats += booked;
            totalCollection += booked * price;
            avgPrice += price;
          });
          avgPrice = showTime.Categories.length ? avgPrice / showTime.Categories.length : 0;
          showRows.push({
            City: city.name,
            Venue: venue.VenueName,
            ShowTime: showTime.ShowTime,
            "Total Seats": totalSeats,
            "Booked Seats": bookedSeats,
            "Booked Collection (₹)": totalCollection.toFixed(2),
            "Total Collection (₹)": (totalSeats * avgPrice).toFixed(2),
            "Avg Ticket Price (₹)": avgPrice.toFixed(2),
          });
        });
      });
    });

    return showRows;
  } catch (err) {
    console.error(`❌ Error fetching ${city.name}:`, err.message);
    return [];
  }
}

// ---------------- Main Runner with Chunks ----------------
async function fetchAllChunks() {
  const eventCode = "ET00395402"; // replace with your actual eventCode
  const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

  const chunkSize = Math.ceil(karnatakaCities.length / 4);
  const chunks = [];
  for (let i = 0; i < 4; i++) {
    chunks.push(karnatakaCities.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  for (let i = 0; i < chunks.length; i++) {
    console.log(`\n⏳ Processing chunk ${i + 1} / 4 ...`);
    for (const city of chunks[i]) {
      const data = await fetchCityData(city, eventCode, dateCode);
      if (data.length) saveToCSV(data, "karnataka_show_wise");
    }

    if (i < chunks.length - 1) {
      console.log(`🕒 Waiting 10 minutes before next chunk...`);
      await new Promise(r => setTimeout(r, 10 * 60 * 1000));
    }
  }

  console.log("✅ All chunks processed!");
}

// ---------------- Run ----------------
fetchAllChunks();
