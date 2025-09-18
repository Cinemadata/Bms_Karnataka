// 🛠 Auth headers (replace with your own values from DevTools → Network)
const auth = {
  bmsId: "1.547186.1754404861153",  // replace with your session's x-bms-id
  token: "4d17a59c2597410e714ab31d421148d9" // replace with your session's token
};

// 📌 Telangana cities
const telanganaCities = {
  Hyderabad: "HYD",
  Warangal: "WAR",
  Karimnagar: "KARIM",
  Nizamabad: "NIZA",
  Khammam: "KHAM",
  Mahbubnagar: "MAHB",
  Mancherial: "MANC",
  Nalgonda: "NALK",
  Adilabad: "ADIL",
  Suryapet: "SURY",
  Miryalaguda: "MRGD",
  Siddipet: "SDDP",
  Jagtial: "JGTL",
  Sircilla: "SIRC",
  Kamareddy: "KMRD",
  Palwancha: "PLWA",
  Kothagudem: "KTGM",
  Bodhan: "BODH",
  Sangareddy: "SARE",
  Metpally: "METT",
  Zaheerabad: "ZAGE",
  Korutla: "KCKA",
  Tandur: "TAND",
  Kodad: "KODA",
  Armoor: "ARMO",
  Gadwal: "GADW",
  Wanaparthy: "WANA",
  Bellampally: "BELL",
  Bhongir: "BHUV",
  Vikarabad: "VKBD",
  Mahbubabad: "MAHA",
  Jangaon: "JNGN",
  Bhadrachalam: "BHDR",
  Bhupalapally: "BHUP",
  Narayanpet: "NRYN",
  Peddapalli: "PEDA",
  Huzurnagar: "HUZU",
  Medchal: "MDCH",
  Manuguru: "MNGU",
  Achampet: "ACHM"
};

// 📌 East Godavari cities
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

// 📌 Guntur & Prakasam
const gunturCities = {
  Guntur: "GUNT",
  Tenali: "TENA",
  Chilakaluripet: "CHIL",
  Repalle: "REPA",
  Sattenapalli: "SATP",
  Macherla: "MACH",
  Ongole: "ONGL",
  Addanki: "ADKI",
  Piduguralla: "PIDU",
  Chirala: "CHIR",
  Tangutur: "TANG"
};

// 📌 Krishna
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

// 📌 Nellore
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

// 📌 Ceeded
const ceededCities = {
  Tirupati: "TIRU",
  Madanapalle: "MDNP",
  Chittoor: "CHTT",
  Kadapa: "KDPA",
  Proddatur: "PROD",
  RailwayKoduru: "RLKD",
  Kurnool: "KURN",
  Nandyal: "NADY",
  Anantapur: "ANAN",
  Tadipatri: "TDPT",
  Hindupur: "HNDP",
  Guntakal: "GUNL",
  Kadiri: "KADR"
};

// 📌 Uttar Andhra
const uttarAndhraCities = {
  Vizag: "VIZAG",
  Anakapalle: "ANKP",
  Vizianagaram: "VIZI",
  Srikakulam: "SRKL",
  Rajam: "RJAM",
  Payakaraopeta: "PATE",
  Gajapathinagaram: "GJPT",
  Parvathipuram: "PRVT",
  Bobbili: "BOBB",
  Palasa: "PALS",
  Narasannapeta: "NRPT",
  Cheepurupalli: "CHEE",
  Ponduru: "PONU",
  Ranasthalam: "RNST",
  Nellimarla: "NLEM",
  Palakonda: "PALK",
  Tekkali: "TKLI",
  Sompeta: "SOMA",
  Kothavalasa: "KTVL"
};

// 📌 West Godavari
const westGodavariCities = {
  Eluru: "ELRU",
  Bhimavaram: "BHIM",
  Tadepalligudem: "TDPG",
  Nidadavole: "NIDA",
  Kovvur: "KOVU",
  Tanuku: "TANU",
  Jangareddygudem: "JRED",
  Palakollu: "PLKU"
};

// 🌍 Merge all 8 regions
const mergedRegions = {
  Telangana: telanganaCities,
  EastGodavari: eastGodavariCities,
  Guntur: gunturCities,
  Krishna: krishnaCities,
  Nellore: nelloreCities,
  Ceeded: ceededCities,
  UttarAndhra: uttarAndhraCities,
  WestGodavari: westGodavariCities
};

// 🛠 Build headers
function buildHeaders() {
  return {
    "x-bms-id": auth.bmsId,
    "authorization": `Bearer ${auth.token}`,
    "user-agent": navigator.userAgent,
    "cookie": document.cookie
  };
}

// 📊 Generic Analytics Generator
function createAnalyticsFunctions(regions, dateCode = "20250918") {
  async function fetchData(eventCode, regionCode) {
    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?eventCode=${eventCode}&regionCode=${regionCode}&dateCode=${dateCode}`;
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  async function regionStats(eventCode) {
    const regionSummary = [];
    for (const [regionName, cityMap] of Object.entries(regions)) {
      let totalShows = 0, totalBooked = 0, totalMaxSeats = 0, totalCollection = 0, totalMaxCollection = 0;

      for (const [cityName, regionCode] of Object.entries(cityMap)) {
        try {
          const data = await fetchData(eventCode, regionCode);
          if (!data?.ShowDetails) continue;

          data.ShowDetails.forEach(detail => {
            detail.Venues.forEach(venue => {
              totalShows += venue.ShowTimes.length;
              venue.ShowTimes.forEach(show => {
                show.Categories.forEach(cat => {
                  const max = +cat.MaxSeats, avail = +cat.SeatsAvail, price = +cat.CurPrice;
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
          const data = await fetchData(eventCode, regionCode);
          if (!data?.ShowDetails) continue;
          data.ShowDetails.forEach(detail => {
            detail.Venues.forEach(venue => {
              shows += venue.ShowTimes.length;
              venue.ShowTimes.forEach(show => {
                show.Categories.forEach(cat => {
                  const max = +cat.MaxSeats, avail = +cat.SeatsAvail, price = +cat.CurPrice;
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
          const data = await fetchData(eventCode, regionCode);
          if (!data?.ShowDetails) continue;
          data.ShowDetails.forEach(detail => {
            detail.Venues.forEach(venue => {
              venue.ShowTimes.forEach(show => {
                let showBooked = 0, showMax = 0, revenue = 0, maxRev = 0;
                show.Categories.forEach(cat => {
                  const max = +cat.MaxSeats, avail = +cat.SeatsAvail, price = +cat.CurPrice;
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
          console.warn(`⛔ Show error in ${cityName}: ${err.message}`);
        }
      }
    }
    console.log(`\n🎞 Show-wise Summary (📅 ${dateCode}, first 100 rows):`);
    console.table(showStats.slice(0, 100));
    window.allShows = showStats;
  }

  async function runAll(eventCode) {
    await regionStats(eventCode);
    await cityWiseStats(eventCode);
    await showWiseStats(eventCode);
  }

  return { regionStats, cityWiseStats, showWiseStats, runAll };
}

// 🚀 Run analytics
const eventCode = "ET00395402"; // replace with your event
const dateCodes = ["20250918"]; // replace with your date(s)

(async function runAnalytics() {
  for (const dateCode of dateCodes) {
    console.log(`\n🟢 Running Analytics for 📅 ${dateCode}`);
    const analytics = createAnalyticsFunctions(mergedRegions, dateCode);
    await analytics.runAll(eventCode);
  }
})();
