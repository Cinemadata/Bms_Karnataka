import fs from "fs";

// ==========================
// ⚙ Karnataka Cities
// ==========================
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

// ==========================
// 📌 Event & Date
// ==========================
const eventCode = "ET00395402";
const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

// ==========================
// ⚙ Helper Functions
// ==========================
function getHeaders(city) {
  return {
    "x-bms-id": "1.3158053074.1724928349489",
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
    "x-latitude": city.lat.toString(),
    "x-longitude": city.lon.toString(),
    "x-location-selection": "manual",
    "x-location-shared": "false",
    lang: "en",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
  };
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function saveCSV(data, filePath) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => `"${row[h] !== undefined ? row[h] : ""}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  fs.writeFileSync(filePath, csv, "utf-8");
  console.log(`💾 CSV saved: ${filePath}`);
}

// ==========================
// 📥 Fetch Shows per City
// ==========================
async function fetchCityShows(city) {
  const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=WEB&appVersion=1.0&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&dateCode=${dateCode}`;
  try {
    const resp = await fetch(url, { headers: getHeaders(city) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.ShowDetails) return [];

    const shows = [];
    data.ShowDetails.forEach((showDetail) => {
      showDetail.Venues.forEach((venue) => {
        venue.ShowTimes.forEach((showTime) => {
          let totalSeats = 0, totalBooked = 0, totalCollection = 0, weightedPriceSum = 0;

          showTime.Categories.forEach((cat) => {
            const maxSeats = parseInt(cat.MaxSeats) || 0;
            const booked = maxSeats - (parseInt(cat.SeatsAvail) || 0);
            const price = parseFloat(cat.CurPrice) || 0;
            totalSeats += maxSeats;
            totalBooked += booked;
            totalCollection += booked * price;
            weightedPriceSum += booked * price;
          });

          const avgPrice = totalBooked ? (weightedPriceSum / totalBooked).toFixed(2) : 0;

          shows.push({
            City: city.name,
            Venue: venue.VenueName,
            ShowTime: showTime.ShowTime,
            MaxSeats: totalSeats,
            Booked: totalBooked,
            Collection: totalCollection.toFixed(0),
            AvgPrice: avgPrice,
            Occupancy: totalSeats ? ((totalBooked / totalSeats) * 100).toFixed(2) + "%" : "0%",
          });
        });
      });
    });

    return shows;
  } catch (err) {
    console.error(`❌ Error fetching ${city.name}:`, err.message);
    return [];
  }
}

// ==========================
// 🚀 Main Runner
// ==========================
(async function run() {
  const fileName = `karnataka_show_wise_${new Date().toISOString().split("T")[0]}.csv`;
  const filePath = path.join(process.cwd(), fileName);

  // Load existing CSV if exists
  let existingData = [];
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").slice(1);
    existingData = lines.map((line) => {
      const [City, Venue, ShowTime, MaxSeats, Booked, Collection, AvgPrice, Occupancy] = line.split(",");
      return { City, Venue, ShowTime, MaxSeats, Booked, Collection, AvgPrice, Occupancy };
    });
  }

  const chunks = chunkArray(karnatakaCities, Math.ceil(karnatakaCities.length / 4)); // 4 chunks
  const allShows = [...existingData];

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(fetchCityShows));
    chunkResults.forEach((res) => allShows.push(...res));
    console.log(`⏳ Finished a chunk, waiting 10s before next...`);
    await new Promise((r) => setTimeout(r, 10000)); // 10s delay between chunks
  }

  saveCSV(allShows, filePath);
})();
