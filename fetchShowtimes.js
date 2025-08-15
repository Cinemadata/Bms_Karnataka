async function fetchShowtimesForCities(eventCode, cities, language) {
  const showRows = [];
  const cityResults = [];

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
    const url = `https://in.bookmyshow.com/api/movies-data/showtimes-by-event?appCode=MOBAND2&appVersion=14304&language=en&eventCode=${eventCode}&regionCode=${city.code}&subRegion=${city.code}&bmsId=1.21345445.1703250084656&token=67x1xa33b4x422b361ba&lat=${city.lat}&lon=${city.lon}&query='&dateCode=20250812`;
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
    let cityWeightedPriceSum = 0; // Weighted by seats
    let totalShowsInCity = 0;

    try {
      const resp = await fetch(url, { method: "GET", headers });
      if (!resp.ok) {
        console.error(`Failed fetch for city ${city.name}, status: ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      if (!data.ShowDetails?.length) continue;

      for (const showDetail of data.ShowDetails) {
        for (const venue of showDetail.Venues) {
          for (const showTime of venue.ShowTimes) {
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
              Language: language,
              City: city.name,
              Venue: venue.VenueName,
              "Show Time": formattedTime,
              "Total Seats": totalSeats,
              "Booked Seats": totalBooked,
              "Occupancy (%)": `${occupancy}%`,
              "Booked Collection (₹)": totalShowCollection.toFixed(2),
              "Total Collection (₹)": totalPotentialCollection.toFixed(2),
              "Avg Ticket Price (₹)": avgPrice.toFixed(2),
            });

            cityTotalSeats += totalSeats;
            cityBookedSeats += totalBooked;
            cityBookedCollection += totalShowCollection;
            cityTotalPotentialCollection += totalPotentialCollection;
            cityWeightedPriceSum += avgPrice * totalSeats; // Weighted sum
          }
        }
      }

      const cityOccupancy = cityTotalSeats
        ? ((cityBookedSeats / cityTotalSeats) * 100).toFixed(2)
        : "0.00";

      const cityAvgTicketPrice = cityTotalSeats
        ? (cityWeightedPriceSum / cityTotalSeats).toFixed(2)
        : "0.00";

      cityResults.push({
        Language: language,
        City: city.name,
        "Total Shows": totalShowsInCity,
        "Total Seats": cityTotalSeats,
        "Booked Seats": cityBookedSeats,
        "Occupancy (%)": `${cityOccupancy}%`,
        "Booked Collection (₹)": cityBookedCollection.toFixed(2),
        "Total Collection (₹)": cityTotalPotentialCollection.toFixed(2),
        "Avg Ticket Price (₹)": cityAvgTicketPrice,
      });
    } catch (err) {
      console.error(`Error fetching city ${city.name} for ${language}:`, err);
    }
  }

  return { showRows, cityResults };
}

// Cities & language-event mapping here (unchanged from your code)
const karnatakaCities = [ 
  { name: "Bengaluru", code: "BANG", slug: "bengaluru", lat: 12.9716, lon: 77.5946, languages: ["tamil", "telugu", "kannada"] },
  { name: "Mysore", code: "MYS", slug: "mysore", lat: 12.2958, lon: 76.6394, languages: ["tamil", "kannada"] },
  { name: "Hubli", code: "HUBL", slug: "hubli", lat: 15.3647, lon: 75.1237, languages: ["tamil", "telugu", "kannada"] },
  { name: "Gulbarga", code: "GULB", slug: "gulbarga", lat: 17.3297, lon: 76.8343, languages: ["tamil", "telugu"] },
  { name: "Shivamogga", code: "SHIA", slug: "shivamogga", lat: 13.9299, lon: 75.5681, languages: ["tamil", "kannada"] },
  { name: "Belagavi", code: "BELG", slug: "belagavi", lat: 15.8497, lon: 74.4977, languages: ["tamil", "kannada"] },
  { name: "Tumkur", code: "TUMK", slug: "tumkur", lat: 13.3392, lon: 77.1135, languages: ["kannada", "tamil", "telugu"] },
  { name: "Kundapura", code: "KUNA", slug: "kundapura", lat: 13.4333, lon: 74.75, languages: ["tamil", "kannada"] },
  { name: "Manipal", code: "MANI", slug: "manipal", lat: 13.3567, lon: 74.7861, languages: ["tamil", "telugu"] },
  { name: "Mangalore", code: "MLR", slug: "mangalore", lat: 12.9141, lon: 74.856, languages: ["tamil", "telugu", "kannada"] },
  { name: "Davangere", code: "DAVA", slug: "davangere", lat: 14.4646, lon: 75.921, languages: ["tamil", "telugu", "kannada"] },
  { name: "Bidar", code: "BIDR", slug: "bidar", lat: 17.9133, lon: 77.5301, languages: ["telugu"] },
  { name: "Chikballapur", code: "CHIK", slug: "chikballapur", lat: 13.435, lon: 77.7317, languages: ["telugu"] },
  { name: "Bhadravati", code: "BDVT", slug: "bhadravati", lat: 13.8476, lon: 75.7045, languages: ["tamil", "kannada"] },
  { name: "Vijayapura", code: "VIJP", slug: "bijapur", lat: 16.8307, lon: 75.710, languages: ["telugu"] },
  { name: "Kolar", code: "OLAR", slug: "kolar", lat: 13.1364, lon: 78.1298, languages: ["telugu"] },
  { name: "Malur", code: "MLLR", slug: "malur", lat: 13.2817, lon: 78.2062, languages: ["telugu", "tamil"] },
  { name: "Tiptur", code: "TIPT", slug: "tiptur", lat: 13.3153, lon: 76.4537, languages: ["kannada", "telugu"] },
  { name: "Kunigal", code: "KUUN", slug: "kunigal", lat: 13.2113, lon: 77.0843, languages: ["kannada"] },
  { name: "Bijapur", code: "VJPR", slug: "bijapur", lat: 16.8307, lon: 75.7100, languages: ["kannada"] },
  { name: "Mudhol", code: "MUDL", slug: "mudhol", lat: 16.2200, lon: 75.4300, languages: ["kannada"] },
  { name: "Kanakapura", code: "KAKP", slug: "kanakapura", lat: 12.5797, lon: 77.4112, languages: ["tamil", "kannada"] },
  { name: "Mandya", code: "MND", slug: "mandya", lat: 12.5247, lon: 76.8977, languages: ["kannada"] },
  { name: "Udupi", code: "UDUP", slug: "udupi", lat: 13.3409, lon: 74.7421, languages: ["tamil"] },
  { name: "Puttur", code: "PTTU", slug: "puttur", lat: 12.7594, lon: 75.2422, languages: ["tamil"] },
  { name: "Karwar", code: "KWAR", slug: "karwar", lat: 14.8054, lon: 74.1304 , languages: ["tamil"] },
  { name: "Raichur", code: "RAUR", slug: "raichur", lat: 16.2076, lon: 77.3439 ,languages: ["telugu"] },
  { name: "Hospet", code: "HOSP", slug: "hospet", lat: 15.2695, lon: 76.3871,languages: ["tamil","telugu"] },
  { name: "Bellary", code: "BLRY", slug: "bellary", lat: 15.1394, lon: 76.9214, languages: ["telugu"]},
  

 ];

const validCities = karnatakaCities.filter(city => city.languages.length > 0);

const languageEventCodes = {
  tamil: "ET00395817",
  telugu: "ET00395820",
  kannada: "ET00395821",
};

(async () => {
  let mergedShowRows = [];
  let mergedCityResults = [];
  const languageCitySummary = {};

  for (const language of Object.keys(languageEventCodes)) {
    const eventCode = languageEventCodes[language];
    const citiesForLang = validCities.filter(city => city.languages.includes(language));

    console.log(`\nFetching data for language: ${language} (${citiesForLang.length} cities)`);

    const { showRows, cityResults } = await fetchShowtimesForCities(eventCode, citiesForLang, language);

    mergedShowRows = mergedShowRows.concat(showRows);
    mergedCityResults = mergedCityResults.concat(cityResults);
    languageCitySummary[language] = cityResults;
  }

  // Merge city-wise
  const citySummaryMap = new Map();

  for (const row of mergedCityResults) {
    const key = row.City;
    if (!citySummaryMap.has(key)) {
      citySummaryMap.set(key, {
        City: row.City,
        "Total Shows": 0,
        "Total Seats": 0,
        "Booked Seats": 0,
        "Booked Collection (₹)": 0,
        "Total Collection (₹)": 0,
        weightedPriceSum: 0,
      });
    }
    const cityData = citySummaryMap.get(key);
    cityData["Total Shows"] += row["Total Shows"];
    cityData["Total Seats"] += row["Total Seats"];
    cityData["Booked Seats"] += row["Booked Seats"];
    cityData["Booked Collection (₹)"] += parseFloat(row["Booked Collection (₹)"]);
    cityData["Total Collection (₹)"] += parseFloat(row["Total Collection (₹)"]);
    cityData.weightedPriceSum += parseFloat(row["Avg Ticket Price (₹)"]) * row["Total Seats"];
  }

  const mergedCitySummary = [];
  const cityTotals = {
    City: "TOTAL",
    "Total Shows": 0,
    "Total Seats": 0,
    "Booked Seats": 0,
    "Booked Collection (₹)": 0,
    "Total Collection (₹)": 0,
    weightedPriceSum: 0,
  };

  for (const cityData of citySummaryMap.values()) {
    const avgPrice = cityData["Total Seats"] > 0
      ? cityData.weightedPriceSum / cityData["Total Seats"]
      : 0;
    const occupancy = cityData["Total Seats"] > 0
      ? ((cityData["Booked Seats"] / cityData["Total Seats"]) * 100).toFixed(2)
      : "0.00";

    mergedCitySummary.push({
      City: cityData.City,
      "Total Shows": cityData["Total Shows"],
      "Total Seats": cityData["Total Seats"],
      "Booked Seats": cityData["Booked Seats"],
      "Occupancy (%)": `${occupancy}%`,
      "Booked Collection (₹)": cityData["Booked Collection (₹)"].toFixed(2),
      "Total Collection (₹)": cityData["Total Collection (₹)"].toFixed(2),
      "Avg Ticket Price (₹)": avgPrice.toFixed(2),
    });

    cityTotals["Total Shows"] += cityData["Total Shows"];
    cityTotals["Total Seats"] += cityData["Total Seats"];
    cityTotals["Booked Seats"] += cityData["Booked Seats"];
    cityTotals["Booked Collection (₹)"] += cityData["Booked Collection (₹)"];
    cityTotals["Total Collection (₹)"] += cityData["Total Collection (₹)"];
    cityTotals.weightedPriceSum += cityData.weightedPriceSum;
  }

  cityTotals["Avg Ticket Price (₹)"] = cityTotals["Total Seats"] > 0
    ? (cityTotals.weightedPriceSum / cityTotals["Total Seats"]).toFixed(2)
    : "0.00";

  cityTotals["Occupancy (%)"] = cityTotals["Total Seats"] > 0
    ? ((cityTotals["Booked Seats"] / cityTotals["Total Seats"]) * 100).toFixed(2) + "%"
    : "0.00%";

  mergedCitySummary.push(cityTotals);

  console.log("\n=== Merged Show-wise Table ===");
  console.table(mergedShowRows);

  console.log("\n=== City-wise Merged Table (With Total) ===");
  console.table(mergedCitySummary);

  // Language totals
  const languageTotalsSummary = [];
  const grandTotals = {
    Language: "TOTAL",
    "Total Shows": 0,
    "Total Seats": 0,
    "Booked Seats": 0,
    "Booked Collection (₹)": 0,
    "Total Collection (₹)": 0,
    "Occupancy (%)": "0.00%",
  };

  for (const [language, cityDataArr] of Object.entries(languageCitySummary)) {
    let totalShows = 0,
      totalSeats = 0,
      bookedSeats = 0,
      bookedCollection = 0,
      totalCollection = 0;

    for (const cityData of cityDataArr) {
      totalShows += cityData["Total Shows"] || 0;
      totalSeats += cityData["Total Seats"] || 0;
      bookedSeats += cityData["Booked Seats"] || 0;
      bookedCollection += parseFloat(cityData["Booked Collection (₹)"]) || 0;
      totalCollection += parseFloat(cityData["Total Collection (₹)"]) || 0;
    }

    const occupancy = totalSeats
      ? ((bookedSeats / totalSeats) * 100).toFixed(2)
      : "0.00";

    languageTotalsSummary.push({
      Language: language.toUpperCase(),
      "Total Shows": totalShows,
      "Total Seats": totalSeats,
      "Booked Seats": bookedSeats,
      "Occupancy (%)": `${occupancy}%`,
      "Booked Collection (₹)": bookedCollection.toFixed(2),
      "Total Collection (₹)": totalCollection.toFixed(2),
    });

    grandTotals["Total Shows"] += totalShows;
    grandTotals["Total Seats"] += totalSeats;
    grandTotals["Booked Seats"] += bookedSeats;
    grandTotals["Booked Collection (₹)"] += bookedCollection;
    grandTotals["Total Collection (₹)"] += totalCollection;
  }

  grandTotals["Occupancy (%)"] = grandTotals["Total Seats"] > 0
    ? ((grandTotals["Booked Seats"] / grandTotals["Total Seats"]) * 100).toFixed(2) + "%"
    : "0.00%";

  languageTotalsSummary.push(grandTotals);

  console.log("\n=== Language-wise Totals Table (With Total) ===");
  console.table(languageTotalsSummary);
})();
