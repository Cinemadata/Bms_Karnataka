// 🎯 BMS (E,G,K,N)

const eastGodavariCities = {
  Rajahmundry: "RJMU",
  Kakinada: "KAKI",
  Amalapuram: "AMAP",
  Mandapeta: "MAND",
  Ravulapalem: "RVPL",
  Pithapuram: "PITA",
  Peddapuram: "PEDP",
  Jaggampeta: "JAGG",
  Tatipaka: "TATI",
  Draksharamam: "DAKR",
  Kothapeta: "KTPE",
  Kathipudi: "KATP",
  Kirlampudi: "KIDI"
};

const gunturCities = {
    Guntur: "GUNT",
    Tenali: "TENA",
    Chilakaluripet: "CHIL",
    Repalle: "REPA",
    Sattenapalli: "SATP",     // assumed code
    Macherla: "MACH",
    Ongole: "ONGL",
    Addanki: "ADKI",
    Piduguralla: "PIDU",
    Chirala: "CHIR",
    Tangutur: "TANG"
};

const krishnaCities = {
    Vijayawada: "VIJA",
    Machilipatnam: "MCHT",
    Gudivada: "GDVD",
    Nuzvid: "NUZV",
    Jaggaiahpet: "JGPT",
    Pedana: "PENA",
    Vuyyuru: "VUYU",
    Nandigama: "NDGM",
    Mylavaram: "MYLA",
    Vissannapeta: "VSNP",
    HanumanJunction: "HANU",
    Kaikaluru: "KAIK",
    Jaggayyapeta: "JGGY"
};

const nelloreCities = {
  Nellore: "NELL",
  Kavali: "KVLI",
  Gudur: "GUDR",
  Kandukur: "KAND",
  Kanigiri: "KANI",
  Naidupeta: "NDPT",
  Podili: "PODI",
  Singarayakonda: "SIGN",
  Darsi: "DARS",
  Pamur: "PMMR",
  Podalakur: "PODA"
};




const mergedRegions = {
  "EastGodavari": eastGodavariCities,
  "Guntur": gunturCities,
  "Krishna": krishnaCities,
  "Nellore": nelloreCities
};

// 🧠 Master Analytics Function Generator

function createRegionAnalyticsFunctions(regions, dateCode = "20250724") {
  async function regionStats(eventCode) {
    const regionSummary = [];

    for (const [regionName, cityMap] of Object.entries(regions)) {
      let totalShows = 0, totalBooked = 0, totalMaxSeats = 0, totalCollection = 0, totalMaxCollection = 0;

      for (const [cityName, regionCode] of Object.entries(cityMap)) {
        try {
          const res = await fetch(`https://in.bookmyshow.com/api/movies-data/showtimes-by-event?eventCode=${eventCode}&regionCode=${regionCode}&dateCode=${dateCode}`, {
            headers: {
              'x-bms-id': '1.3158053074.1724928349489',
              'user-agent': navigator.userAgent,
              'cookie': document.cookie
            }
          });

          const data = await res.json();
          if (!data?.ShowDetails) continue;

          data.ShowDetails.forEach(detail => {
            detail.Venues.forEach(venue => {
              totalShows += venue.ShowTimes.length;
              venue.ShowTimes.forEach(show => {
                show.Categories.forEach(cat => {
                  const max = +cat.MaxSeats;
                  const avail = +cat.SeatsAvail;
                  const price = +cat.CurPrice;
                  const booked = max - avail;
                  totalMaxSeats += max;
                  totalBooked += booked;
                  totalCollection += booked * price;
                  totalMaxCollection += max * price;
                });
              });
            });
          });

        } catch (err) {
          console.warn(`⛔ Error in ${regionName} ➜ ${cityName}: ${err.message}`);
        }
      }

      const occupancy = totalMaxSeats > 0 ? ((totalBooked / totalMaxSeats) * 100).toFixed(2) + "%" : "N/A";
      regionSummary.push({
        Region: regionName,
        Total_Shows: totalShows,
        Booked_Tickets: totalBooked,
        Max_Seats: totalMaxSeats,
        Collection: `₹${totalCollection.toFixed(2)}`,
        Max_Collection: `₹${totalMaxCollection.toFixed(2)}`,
        Occupancy: occupancy
      });
    }

    console.log(`\n📍 Region-wise Summary (📅 ${dateCode}):`);
    console.table(regionSummary);
  }

  async function cityWiseStats(eventCode) {
    const cityStats = [];

    for (const [regionName, cityMap] of Object.entries(regions)) {
      for (const [cityName, regionCode] of Object.entries(cityMap)) {
        let shows = 0, booked = 0, maxSeats = 0, collection = 0, maxCollection = 0;

        try {
          const res = await fetch(`https://in.bookmyshow.com/api/movies-data/showtimes-by-event?eventCode=${eventCode}&regionCode=${regionCode}&dateCode=${dateCode}`, {
            headers: {
              'x-bms-id': '1.3158053074.1724928349489',
              'user-agent': navigator.userAgent,
              'cookie': document.cookie
            }
          });

          const data = await res.json();
          if (!data?.ShowDetails) continue;

          data.ShowDetails.forEach(detail => {
            detail.Venues.forEach(venue => {
              shows += venue.ShowTimes.length;
              venue.ShowTimes.forEach(show => {
                show.Categories.forEach(cat => {
                  const max = +cat.MaxSeats;
                  const avail = +cat.SeatsAvail;
                  const price = +cat.CurPrice;
                  const bookedSeats = max - avail;
                  maxSeats += max;
                  booked += bookedSeats;
                  collection += bookedSeats * price;
                  maxCollection += max * price;
                });
              });
            });
          });

          if (shows > 0) {
            const occupancy = maxSeats > 0 ? ((booked / maxSeats) * 100).toFixed(2) + "%" : "N/A";
            cityStats.push({
              Region: regionName,
              City: cityName,
              Shows: shows,
              Booked_Tickets: booked,
              Max_Seats: maxSeats,
              Collection: `₹${collection.toFixed(2)}`,
              Max_Collection: `₹${maxCollection.toFixed(2)}`,
              Occupancy: occupancy
            });
          }

        } catch (err) {
          console.warn(`⛔ Error in ${regionName} ➜ ${cityName}: ${err.message}`);
        }
      }
    }

    console.log(`\n🏙 City-wise Summary (📅 ${dateCode}):`);
    console.table(cityStats);
  }

  async function showWiseStats(eventCode) {
    const showStats = [];

    for (const [regionName, cityMap] of Object.entries(regions)) {
      for (const [cityName, regionCode] of Object.entries(cityMap)) {
        try {
          const res = await fetch(`https://in.bookmyshow.com/api/movies-data/showtimes-by-event?eventCode=${eventCode}&regionCode=${regionCode}&dateCode=${dateCode}`, {
            headers: {
              'x-bms-id': '1.3158053074.1724928349489',
              'user-agent': navigator.userAgent,
              'cookie': document.cookie
            }
          });

          const data = await res.json();
          if (!data?.ShowDetails) continue;

          data.ShowDetails.forEach(detail => {
            detail.Venues.forEach(venue => {
              venue.ShowTimes.forEach(show => {
                let showBooked = 0, showMax = 0, revenue = 0, maxRev = 0;

                show.Categories.forEach(cat => {
                  const max = +cat.MaxSeats;
                  const avail = +cat.SeatsAvail;
                  const price = +cat.CurPrice;
                  const booked = max - avail;
                  showMax += max;
                  showBooked += booked;
                  revenue += booked * price;
                  maxRev += max * price;
                });

                if (showMax > 0) {
                  const occupancy = ((showBooked / showMax) * 100).toFixed(2) + "%";
                  showStats.push({
                    Region: regionName,
                    City: cityName,
                    Venue: venue.VenueName,
                    Show_Time: show.ShowTime,
                    Booked: showBooked,
                    Max_Seats: showMax,
                    Collection: `₹${revenue.toFixed(2)}`,
                    Max_Collection: `₹${maxRev.toFixed(2)}`,
                    Occupancy: occupancy
                  });
                }
              });
            });
          });

        } catch (err) {
          console.warn(`⛔ Error while fetching shows for ${cityName}: ${err.message}`);
        }
      }
    }

    console.log(`\n🎞 Show-wise Summary (first 100 rows, 📅 ${dateCode}):`);
    console.table(showStats.slice(0, 100));
    window.fullShowStats = showStats; // Optional debugging
  }

  async function runAll(eventCode) {
    await regionStats(eventCode);
    await cityWiseStats(eventCode);
    await showWiseStats(eventCode);
  }

  return {
    regionStats,
    cityWiseStats,
    showWiseStats,
    runAll
  };
}

// 🚀 Run for EventCode + Multiple Dates
const eventCode = "ET00395817"; // sample BookMyShow eventCode
const dateCodes = ["20250814"]; // Add more if needed

(async function runAllDates() {
  for (const dateCode of dateCodes) {
    const analytics = createRegionAnalyticsFunctions(mergedRegions, dateCode);
    console.log(`\n======================= 📆 Running Analytics for ${dateCode} =======================`);
    await analytics.runAll(eventCode);
  }
})();
