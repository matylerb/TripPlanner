// Frozen official totals. Coordinates are approximate borough/ward centers,
// not incident locations. Never interpret the display radius as a boundary.
export type CrimeArea = { name: string; count: number; lat: number; lng: number };
export type CrimeCity = { name: string; year: number; source: string; radius: number; areas: CrimeArea[] };
function areas(rows: [string, number, number, number][]): CrimeArea[] {
  return rows.map(([name, count, lat, lng]) => ({ name, count, lat, lng }));
}
export const CRIME_CITIES: Record<string, CrimeCity> = {
  london: {
    name: "London", year: 2025, radius: 2400,
    source: "https://data.london.gov.uk/dataset/mps-recorded-crime-geographic-breakdown-exy3m",
    // Sum every Group/SubGroup row by BOCU across 202501–202512.
    // Excludes Unknown and Aviation Policing. City of London is not in MPS data.
    areas: areas([
      ["Barking and Dagenham",20273,51.55,0.13], ["Barnet",28702,51.61,-0.20],
      ["Bexley",16193,51.46,0.14], ["Brent",33195,51.56,-0.27],
      ["Bromley",24237,51.40,0.04], ["Camden",41393,51.55,-0.16],
      ["Croydon",34102,51.37,-0.10], ["Ealing",32593,51.52,-0.31],
      ["Enfield",29065,51.65,-0.08], ["Greenwich",28096,51.47,0.05],
      ["Hackney",33022,51.55,-0.06], ["Hammersmith and Fulham",21514,51.49,-0.22],
      ["Haringey",29439,51.59,-0.11], ["Harrow",16628,51.59,-0.34],
      ["Havering",19499,51.57,0.22], ["Hillingdon",31378,51.54,-0.45],
      ["Hounslow",27001,51.47,-0.36], ["Islington",31297,51.54,-0.11],
      ["Kensington and Chelsea",22832,51.50,-0.19], ["Kingston upon Thames",12034,51.40,-0.28],
      ["Lambeth",37998,51.46,-0.12], ["Lewisham",29426,51.45,-0.02],
      ["Merton",13708,51.41,-0.19], ["Newham",41020,51.53,0.03],
      ["Redbridge",24615,51.59,0.07], ["Richmond upon Thames",11744,51.44,-0.31],
      ["Southwark",40237,51.47,-0.07], ["Sutton",13239,51.36,-0.19],
      ["Tower Hamlets",37159,51.52,-0.03], ["Waltham Forest",23783,51.59,-0.01],
      ["Wandsworth",27167,51.45,-0.19], ["Westminster",84957,51.515,-0.155],
    ]),
  },
  tokyo: {
    name: "Tokyo", year: 2024, radius: 1800,
    source: "https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html",
    // R6.csv: 総合計 from the exact ward-name rows, not neighborhood/subtotal rows.
    areas: areas([
      ["Chiyoda",2532,35.694,139.753], ["Chuo",1979,35.67,139.775],
      ["Minato",3188,35.655,139.745], ["Shinjuku",6025,35.694,139.704],
      ["Bunkyo",1194,35.717,139.752], ["Taito",2731,35.712,139.78],
      ["Sumida",2089,35.71,139.815], ["Koto",3332,35.673,139.817],
      ["Shinagawa",2240,35.609,139.73], ["Meguro",1419,35.63,139.69],
      ["Ota",4370,35.562,139.716], ["Setagaya",4443,35.646,139.653],
      ["Shibuya",3849,35.664,139.698], ["Nakano",2094,35.707,139.663],
      ["Suginami",2479,35.699,139.636], ["Toshima",3730,35.729,139.716],
      ["Kita",2276,35.753,139.733], ["Arakawa",1328,35.736,139.783],
      ["Itabashi",3420,35.774,139.682], ["Nerima",3662,35.746,139.614],
      ["Adachi",4442,35.775,139.804], ["Katsushika",3037,35.751,139.853],
      ["Edogawa",4222,35.697,139.88],
    ]),
  },
};

export function crimeCityAt(destination?: { lat: number; lng: number } | null): CrimeCity | undefined {
  if (!destination) return;
  const { lat, lng } = destination;
  if (lat >= 51.28 && lat <= 51.7 && lng >= -0.52 && lng <= 0.34) return CRIME_CITIES.london;
  if (lat >= 35.52 && lat <= 35.82 && lng >= 139.55 && lng <= 139.92) return CRIME_CITIES.tokyo;
}

export function crimePercentile(city: CrimeCity, area: CrimeArea) {
  const values = city.areas.map((a) => a.count).sort((a, b) => a - b);
  return values.indexOf(area.count) / Math.max(1, values.length - 1);
}

// Within-city tertiles of total reported offences; NOT a per-person risk rate.
export function crimeBand(city: CrimeCity, area: CrimeArea) {
  const value = crimePercentile(city, area);
  if (value <= 1 / 3) return { label: "Lower", color: "#22c55e" };
  if (value <= 2 / 3) return { label: "Middle", color: "#f59e0b" };
  return { label: "Higher", color: "#ef4444" };
}
