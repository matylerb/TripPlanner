import type { ItemType } from "../types";

export type Tag =
  | "warm"
  | "cold"
  | "mild"
  | "beach"
  | "city"
  | "food"
  | "culture"
  | "nature"
  | "nightlife"
  | "adventure"
  | "art"
  | "budget"
  | "luxury"
  | "romantic"
  | "history"
  | "wellness";

export interface Poi {
  title: string;
  type: ItemType;
  lat: number;
  lng: number;
  cost: number; // per person EUR
  duration: string;
  slot: "morning" | "midday" | "afternoon" | "evening";
  description: string;
  tags: Tag[];
}

export interface DestinationProfile {
  slug: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  airport: string;
  airportName: string;
  airportLat: number;
  airportLng: number;
  tags: Tag[];
  bestMonths: number[]; // 1-12
  priceLevel: 1 | 2 | 3;
  nightly: number; // per person share of a mid-range room
  mealCost: number; // avg per meal per person
  neighborhood: string;
  hotelNames: string[];
  blurb: string;
  aliases: string[];
  pois: Poi[];
}

export const ORIGINS: Record<
  string,
  { name: string; country: string; airport: string; lat: number; lng: number; aliases: string[] }
> = {
  nyc: { name: "New York", country: "USA", airport: "JFK", lat: 40.6413, lng: -73.7781, aliases: ["new york", "nyc", "jfk", "brooklyn", "manhattan"] },
  sfo: { name: "San Francisco", country: "USA", airport: "SFO", lat: 37.6213, lng: -122.379, aliases: ["san francisco", "sf", "sfo", "bay area", "oakland"] },
  lax: { name: "Los Angeles", country: "USA", airport: "LAX", lat: 33.9416, lng: -118.4085, aliases: ["los angeles", "la", "lax"] },
  ord: { name: "Chicago", country: "USA", airport: "ORD", lat: 41.9742, lng: -87.9073, aliases: ["chicago", "ord"] },
  bos: { name: "Boston", country: "USA", airport: "BOS", lat: 42.3656, lng: -71.0096, aliases: ["boston", "bos"] },
  sea: { name: "Seattle", country: "USA", airport: "SEA", lat: 47.4502, lng: -122.3088, aliases: ["seattle", "sea"] },
  aus: { name: "Austin", country: "USA", airport: "AUS", lat: 30.1975, lng: -97.6664, aliases: ["austin", "aus"] },
  den: { name: "Denver", country: "USA", airport: "DEN", lat: 39.8561, lng: -104.6737, aliases: ["denver", "den"] },
  atl: { name: "Atlanta", country: "USA", airport: "ATL", lat: 33.6407, lng: -84.4277, aliases: ["atlanta", "atl"] },
  mia: { name: "Miami", country: "USA", airport: "MIA", lat: 25.7959, lng: -80.287, aliases: ["miami", "mia"] },
  yyz: { name: "Toronto", country: "Canada", airport: "YYZ", lat: 43.6777, lng: -79.6248, aliases: ["toronto", "yyz"] },
  lhr: { name: "London", country: "UK", airport: "LHR", lat: 51.47, lng: -0.4543, aliases: ["london", "lhr", "heathrow"] },
};

export const DESTINATIONS: DestinationProfile[] = [
  {
    slug: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    lat: 38.7223,
    lng: -9.1393,
    airport: "LIS",
    airportName: "Humberto Delgado",
    airportLat: 38.7742,
    airportLng: -9.1342,
    tags: ["warm", "mild", "city", "food", "culture", "history", "budget", "romantic", "beach"],
    bestMonths: [3, 4, 5, 6, 9, 10],
    priceLevel: 2,
    nightly: 95,
    mealCost: 22,
    neighborhood: "Alfama",
    hotelNames: ["Memmo Alfama", "The Lumiares", "Hotel Convento do Salvador", "Casa Balthazar"],
    blurb: "Tiled hills, late-afternoon light, and grilled sardines by the river.",
    aliases: ["lisbon", "lisboa", "portugal"],
    pois: [
      { title: "Sunrise at Miradouro da Senhora do Monte", type: "activity", lat: 38.7189, lng: -9.1327, cost: 0, duration: "1h", slot: "morning", description: "The highest viewpoint in the city, before the crowds.", tags: ["culture", "romantic"] },
      { title: "Pastéis de Belém & Jerónimos Monastery", type: "activity", lat: 38.6979, lng: -9.2064, cost: 14, duration: "2.5h", slot: "midday", description: "Warm custard tarts, then Manueline stonework.", tags: ["food", "history", "culture"] },
      { title: "Tram 28 through Alfama", type: "activity", lat: 38.7139, lng: -9.1334, cost: 4, duration: "1h", slot: "afternoon", description: "The rattling yellow tram past the cathedral and up to Graça.", tags: ["culture", "city"] },
      { title: "Fado night in Alfama", type: "activity", lat: 38.7115, lng: -9.1296, cost: 45, duration: "2.5h", slot: "evening", description: "Candlelit, three-song sets, a glass of vinho verde.", tags: ["culture", "nightlife", "romantic"] },
      { title: "Day trip to Sintra & Pena Palace", type: "activity", lat: 38.7876, lng: -9.3906, cost: 38, duration: "6h", slot: "morning", description: "Fairy-tale palaces in the mist, 40 minutes by train.", tags: ["history", "nature", "culture"] },
      { title: "Surf lesson at Praia de Carcavelos", type: "activity", lat: 38.6797, lng: -9.3357, cost: 55, duration: "3h", slot: "morning", description: "Gentle beach break on the coast, wetsuits included.", tags: ["beach", "adventure", "warm"] },
      { title: "LX Factory & Village Underground", type: "activity", lat: 38.7036, lng: -9.1786, cost: 0, duration: "2h", slot: "afternoon", description: "Creative complex under the bridge: bookshop, murals, rooftop.", tags: ["art", "city"] },
      { title: "Time Out Market lunch", type: "meal", lat: 38.7069, lng: -9.1459, cost: 24, duration: "1.5h", slot: "midday", description: "Thirty of the city's best kitchens under one roof.", tags: ["food"] },
      { title: "Dinner at Cervejaria Ramiro", type: "meal", lat: 38.7205, lng: -9.1354, cost: 48, duration: "2h", slot: "evening", description: "Garlic prawns and a steak sandwich to finish. Expect a queue.", tags: ["food"] },
      { title: "Petiscos crawl in Bairro Alto", type: "meal", lat: 38.7131, lng: -9.1441, cost: 30, duration: "2h", slot: "evening", description: "Small plates, tiny bars, the whole neighbourhood spills onto the street.", tags: ["food", "nightlife"] },
      { title: "Rooftop drinks at Park", type: "activity", lat: 38.7118, lng: -9.1459, cost: 18, duration: "1.5h", slot: "evening", description: "A car park roof with a garden and the best sunset in town.", tags: ["nightlife", "romantic"] },
      { title: "Cascais coastal ride", type: "activity", lat: 38.6979, lng: -9.4215, cost: 20, duration: "4h", slot: "afternoon", description: "Bike the seaside path to the Boca do Inferno cliffs.", tags: ["beach", "nature", "adventure"] },
    ],
  },
  {
    slug: "tokyo",
    name: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    airport: "HND",
    airportName: "Haneda",
    airportLat: 35.5494,
    airportLng: 139.7798,
    tags: ["city", "food", "culture", "art", "nightlife", "mild", "history"],
    bestMonths: [3, 4, 10, 11],
    priceLevel: 3,
    nightly: 130,
    mealCost: 25,
    neighborhood: "Shibuya",
    hotelNames: ["Trunk Hotel", "Hotel Indigo Shibuya", "The Millennials", "Sequence Miyashita Park"],
    blurb: "Neon, silence, cedar, ramen at 2am, and a thousand small perfections.",
    aliases: ["tokyo", "japan"],
    pois: [
      { title: "Tsukiji Outer Market breakfast", type: "meal", lat: 35.6654, lng: 139.7707, cost: 18, duration: "1.5h", slot: "morning", description: "Tamagoyaki on a stick, uni bowls, and grilled scallops.", tags: ["food"] },
      { title: "Senso-ji & Nakamise-dori", type: "activity", lat: 35.7148, lng: 139.7967, cost: 0, duration: "2h", slot: "morning", description: "Tokyo's oldest temple and the incense-clouded approach.", tags: ["history", "culture"] },
      { title: "teamLab Planets", type: "activity", lat: 35.6489, lng: 139.7899, cost: 26, duration: "2h", slot: "afternoon", description: "Barefoot through water, mirrors, and infinite flowers.", tags: ["art", "culture"] },
      { title: "Shibuya Crossing & Shibuya Sky", type: "activity", lat: 35.6595, lng: 139.7004, cost: 16, duration: "2h", slot: "evening", description: "The scramble from above at sunset, then down into it.", tags: ["city", "nightlife"] },
      { title: "Omakase sushi in Ginza", type: "meal", lat: 35.6717, lng: 139.765, cost: 120, duration: "2h", slot: "evening", description: "Twelve pieces, one counter, no menu.", tags: ["food", "luxury"] },
      { title: "Meiji Shrine & Harajuku", type: "activity", lat: 35.6764, lng: 139.6993, cost: 0, duration: "3h", slot: "midday", description: "A cedar forest in the city, then Takeshita Street's chaos.", tags: ["culture", "nature", "city"] },
      { title: "Golden Gai bar hop", type: "activity", lat: 35.6938, lng: 139.7046, cost: 40, duration: "3h", slot: "evening", description: "Six-seat bars stacked in alleys. Bring cash and curiosity.", tags: ["nightlife"] },
      { title: "Ramen at Fuunji", type: "meal", lat: 35.6874, lng: 139.6972, cost: 12, duration: "1h", slot: "midday", description: "Tsukemen worth the 40-minute line.", tags: ["food", "budget"] },
      { title: "Day trip to Kamakura", type: "activity", lat: 35.3167, lng: 139.5364, cost: 24, duration: "7h", slot: "morning", description: "The Great Buddha, bamboo groves, and a seaside train home.", tags: ["nature", "history"] },
      { title: "Yanaka old-town walk", type: "activity", lat: 35.7276, lng: 139.7663, cost: 0, duration: "2h", slot: "afternoon", description: "Shitamachi Tokyo: cats, temples, and a 1950s shopping street.", tags: ["culture", "history"] },
      { title: "Izakaya night in Ebisu", type: "meal", lat: 35.6467, lng: 139.7101, cost: 45, duration: "2.5h", slot: "evening", description: "Yakitori, highballs, and more highballs.", tags: ["food", "nightlife"] },
      { title: "Onsen at Thermae-Yu", type: "activity", lat: 35.6958, lng: 139.7042, cost: 22, duration: "2h", slot: "afternoon", description: "Hot springs in the middle of Shinjuku. Deeply restorative.", tags: ["wellness"] },
    ],
  },
  {
    slug: "mexico-city",
    name: "Mexico City",
    country: "Mexico",
    lat: 19.4326,
    lng: -99.1332,
    airport: "MEX",
    airportName: "Benito Juárez",
    airportLat: 19.4363,
    airportLng: -99.0721,
    tags: ["warm", "mild", "city", "food", "art", "culture", "history", "budget", "nightlife"],
    bestMonths: [2, 3, 4, 10, 11, 12],
    priceLevel: 1,
    nightly: 70,
    mealCost: 15,
    neighborhood: "Roma Norte",
    hotelNames: ["Casa Goliana", "Nima Local House", "Ignacia Guest House", "Condesa DF"],
    blurb: "Murals, mezcal, jacaranda trees, and the best food city on the continent.",
    aliases: ["mexico city", "cdmx", "mexico", "df"],
    pois: [
      { title: "Frida Kahlo Museum (Casa Azul)", type: "activity", lat: 19.3551, lng: -99.1625, cost: 15, duration: "2h", slot: "morning", description: "Her cobalt house in Coyoacán. Book weeks ahead.", tags: ["art", "history", "culture"] },
      { title: "Tacos al pastor at El Vilsito", type: "meal", lat: 19.3833, lng: -99.1729, cost: 8, duration: "1h", slot: "evening", description: "A mechanic's shop by day, a taco temple by night.", tags: ["food", "budget"] },
      { title: "Teotihuacán pyramids", type: "activity", lat: 19.6925, lng: -98.8438, cost: 28, duration: "6h", slot: "morning", description: "Climb the Pyramid of the Sun before it gets hot.", tags: ["history", "adventure"] },
      { title: "Lunch at Contramar", type: "meal", lat: 19.4186, lng: -99.1676, cost: 40, duration: "2h", slot: "midday", description: "Tuna tostadas and the famous red-and-green whole fish.", tags: ["food"] },
      { title: "Chapultepec Castle & Anthropology Museum", type: "activity", lat: 19.4204, lng: -99.1819, cost: 10, duration: "4h", slot: "midday", description: "The only royal castle in the Americas, then the Aztec Sun Stone.", tags: ["history", "culture"] },
      { title: "Lucha Libre at Arena México", type: "activity", lat: 19.4218, lng: -99.1557, cost: 20, duration: "3h", slot: "evening", description: "Masked drama, chanting crowds, beer in plastic cups.", tags: ["nightlife", "culture"] },
      { title: "Xochimilco trajineras", type: "activity", lat: 19.2647, lng: -99.1031, cost: 18, duration: "4h", slot: "afternoon", description: "Painted boats, mariachi rafts, micheladas on the canals.", tags: ["culture", "nature", "nightlife"] },
      { title: "Roma Norte café morning", type: "meal", lat: 19.4173, lng: -99.1602, cost: 12, duration: "1h", slot: "morning", description: "Chilaquiles and a flat white under the jacarandas.", tags: ["food"] },
      { title: "Mezcal tasting in Condesa", type: "activity", lat: 19.4111, lng: -99.1728, cost: 30, duration: "2h", slot: "evening", description: "Five agaves, orange slices, sal de gusano.", tags: ["nightlife", "food"] },
      { title: "Palacio de Bellas Artes & Diego Rivera murals", type: "activity", lat: 19.4352, lng: -99.1413, cost: 6, duration: "2h", slot: "afternoon", description: "Art nouveau outside, art deco inside, Rivera upstairs.", tags: ["art", "history"] },
      { title: "Dinner at Pujol", type: "meal", lat: 19.4318, lng: -99.1936, cost: 160, duration: "3h", slot: "evening", description: "Mole madre aged 2,000+ days. A once-a-trip splurge.", tags: ["food", "luxury"] },
      { title: "Mercado de la Merced walk", type: "activity", lat: 19.4257, lng: -99.1225, cost: 5, duration: "2h", slot: "morning", description: "A city-sized market of chiles, moles, and candied fruit.", tags: ["food", "culture", "budget"] },
    ],
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    lat: 41.3874,
    lng: 2.1686,
    airport: "BCN",
    airportName: "El Prat",
    airportLat: 41.2974,
    airportLng: 2.0833,
    tags: ["warm", "beach", "city", "food", "art", "nightlife", "culture", "romantic"],
    bestMonths: [4, 5, 6, 9, 10],
    priceLevel: 2,
    nightly: 110,
    mealCost: 26,
    neighborhood: "El Born",
    hotelNames: ["Hotel Brummell", "Casa Bonay", "Yurbban Trafalgar", "Hotel Neri"],
    blurb: "Gaudí's fever dreams, vermouth hour, and a beach at the end of the street.",
    aliases: ["barcelona", "bcn", "spain", "catalonia"],
    pois: [
      { title: "Sagrada Família (early entry)", type: "activity", lat: 41.4036, lng: 2.1744, cost: 30, duration: "2h", slot: "morning", description: "Sunlight through the stained glass forest. Book the 9am slot.", tags: ["art", "history", "culture"] },
      { title: "Park Güell", type: "activity", lat: 41.4145, lng: 2.1527, cost: 12, duration: "2h", slot: "midday", description: "Mosaic lizards and the bench that curves forever.", tags: ["art", "nature"] },
      { title: "La Boqueria market lunch", type: "meal", lat: 41.3817, lng: 2.1717, cost: 20, duration: "1.5h", slot: "midday", description: "Jamón, fresh juice, and a seat at Pinotxo.", tags: ["food"] },
      { title: "Barceloneta beach afternoon", type: "activity", lat: 41.3784, lng: 2.1925, cost: 0, duration: "3h", slot: "afternoon", description: "Swim, nap, repeat. Chiringuito beers at golden hour.", tags: ["beach", "warm"] },
      { title: "Vermouth hour in Gràcia", type: "activity", lat: 41.4029, lng: 2.1565, cost: 15, duration: "1.5h", slot: "afternoon", description: "Sit on a square with olives and a red vermut.", tags: ["food", "nightlife", "culture"] },
      { title: "Tapas crawl in El Born", type: "meal", lat: 41.3853, lng: 2.1829, cost: 38, duration: "2.5h", slot: "evening", description: "Cal Pep, El Xampanyet, then wherever the night goes.", tags: ["food", "nightlife"] },
      { title: "Montjuïc cable car & Magic Fountain", type: "activity", lat: 41.3641, lng: 2.1583, cost: 14, duration: "3h", slot: "evening", description: "Sunset over the port, then the fountain show.", tags: ["romantic", "city"] },
      { title: "Gothic Quarter walking tour", type: "activity", lat: 41.3833, lng: 2.1766, cost: 18, duration: "2.5h", slot: "morning", description: "Roman walls, medieval alleys, hidden plazas.", tags: ["history", "culture"] },
      { title: "Paella by the sea at Can Majó", type: "meal", lat: 41.3789, lng: 2.1893, cost: 42, duration: "2h", slot: "midday", description: "Seafood paella with your feet nearly in the sand.", tags: ["food", "beach"] },
      { title: "Day trip to Montserrat", type: "activity", lat: 41.5931, lng: 1.8375, cost: 35, duration: "7h", slot: "morning", description: "Serrated mountains, a monastery, and a boys' choir at 1pm.", tags: ["nature", "adventure", "history"] },
      { title: "Picasso Museum", type: "activity", lat: 41.3852, lng: 2.1809, cost: 14, duration: "2h", slot: "afternoon", description: "The early work, in five medieval palaces.", tags: ["art"] },
      { title: "Rooftop cocktails at Hotel Brummell", type: "activity", lat: 41.3736, lng: 2.1618, cost: 22, duration: "1.5h", slot: "evening", description: "Poolside, low-key, locals only.", tags: ["nightlife", "romantic"] },
    ],
  },
  {
    slug: "reykjavik",
    name: "Reykjavík",
    country: "Iceland",
    lat: 64.1466,
    lng: -21.9426,
    airport: "KEF",
    airportName: "Keflavík",
    airportLat: 63.985,
    airportLng: -22.6056,
    tags: ["cold", "nature", "adventure", "wellness", "romantic", "luxury"],
    bestMonths: [2, 3, 6, 7, 8, 9, 10],
    priceLevel: 3,
    nightly: 160,
    mealCost: 38,
    neighborhood: "Miðborg",
    hotelNames: ["Ion City Hotel", "Kex Hostel", "Canopy by Hilton", "Hotel Borg"],
    blurb: "Black sand, blue lagoons, and a sky that occasionally catches fire.",
    aliases: ["reykjavik", "iceland", "reykjavík"],
    pois: [
      { title: "Golden Circle: Þingvellir, Geysir, Gullfoss", type: "activity", lat: 64.3271, lng: -20.1199, cost: 85, duration: "8h", slot: "morning", description: "Tectonic rift, exploding geyser, thundering waterfall.", tags: ["nature", "adventure"] },
      { title: "Blue Lagoon soak", type: "activity", lat: 63.8804, lng: -22.4495, cost: 95, duration: "3h", slot: "afternoon", description: "Milky-blue geothermal water, silica masks, a swim-up bar.", tags: ["wellness", "romantic", "luxury"] },
      { title: "Northern lights hunt", type: "activity", lat: 64.1, lng: -21.7, cost: 70, duration: "4h", slot: "evening", description: "Minibus into the dark. No guarantees, big payoff.", tags: ["nature", "romantic", "adventure"] },
      { title: "South coast: Seljalandsfoss & Reynisfjara", type: "activity", lat: 63.4045, lng: -19.0455, cost: 110, duration: "10h", slot: "morning", description: "Walk behind a waterfall, then black-sand basalt columns.", tags: ["nature", "adventure"] },
      { title: "Hallgrímskirkja tower", type: "activity", lat: 64.1417, lng: -21.9266, cost: 9, duration: "1h", slot: "midday", description: "The rocket-ship church with a view over the rainbow rooftops.", tags: ["culture", "city"] },
      { title: "Lamb soup at Icelandic Street Food", type: "meal", lat: 64.1478, lng: -21.9364, cost: 22, duration: "1h", slot: "midday", description: "Free refills. You will need them.", tags: ["food", "budget"] },
      { title: "Dinner at Dill", type: "meal", lat: 64.1467, lng: -21.9302, cost: 150, duration: "3h", slot: "evening", description: "New Nordic tasting menu, Michelin-starred.", tags: ["food", "luxury"] },
      { title: "Sky Lagoon at sunset", type: "activity", lat: 64.1213, lng: -21.9498, cost: 75, duration: "2.5h", slot: "evening", description: "Infinity-edge hot pool facing the Atlantic. Seven-step ritual.", tags: ["wellness", "romantic"] },
      { title: "Whale watching from the old harbour", type: "activity", lat: 64.1519, lng: -21.9433, cost: 90, duration: "3h", slot: "morning", description: "Minke and humpback in Faxaflói Bay.", tags: ["nature"] },
      { title: "Hot dog at Bæjarins Beztu", type: "meal", lat: 64.1483, lng: -21.9385, cost: 6, duration: "0.5h", slot: "afternoon", description: "'One with everything.' Crispy onions, remoulade, sweet mustard.", tags: ["food", "budget"] },
      { title: "Fish & chips at Reykjavík Fish", type: "meal", lat: 64.1494, lng: -21.9403, cost: 28, duration: "1h", slot: "evening", description: "Cod so fresh it was swimming this morning.", tags: ["food"] },
      { title: "Glacier hike on Sólheimajökull", type: "activity", lat: 63.5306, lng: -19.3707, cost: 130, duration: "4h", slot: "midday", description: "Crampons, ice axes, and blue crevasses.", tags: ["adventure", "nature"] },
    ],
  },
  {
    slug: "bali",
    name: "Bali",
    country: "Indonesia",
    lat: -8.5069,
    lng: 115.2625,
    airport: "DPS",
    airportName: "Ngurah Rai",
    airportLat: -8.7482,
    airportLng: 115.1672,
    tags: ["warm", "beach", "nature", "wellness", "budget", "romantic", "adventure", "culture"],
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    priceLevel: 1,
    nightly: 55,
    mealCost: 12,
    neighborhood: "Ubud",
    hotelNames: ["Bisma Eight", "Alaya Resort Ubud", "The Kayon", "Suarga Padang Padang"],
    blurb: "Rice terraces, temple incense, surf at dawn, and long slow afternoons.",
    aliases: ["bali", "ubud", "indonesia", "canggu", "seminyak"],
    pois: [
      { title: "Tegallalang rice terrace walk", type: "activity", lat: -8.4312, lng: 115.2792, cost: 5, duration: "2h", slot: "morning", description: "Emerald steps, best before 9am.", tags: ["nature", "culture"] },
      { title: "Mount Batur sunrise trek", type: "activity", lat: -8.2422, lng: 115.3753, cost: 45, duration: "6h", slot: "morning", description: "Start at 3:30am, summit for sunrise over the caldera.", tags: ["adventure", "nature"] },
      { title: "Balinese cooking class", type: "activity", lat: -8.5086, lng: 115.2624, cost: 32, duration: "4h", slot: "midday", description: "Market visit, then base gede, satay lilit, and lawar.", tags: ["food", "culture"] },
      { title: "Tirta Empul water temple", type: "activity", lat: -8.4153, lng: 115.3153, cost: 4, duration: "2h", slot: "afternoon", description: "Purification pools fed by a sacred spring.", tags: ["culture", "wellness"] },
      { title: "Surf lesson in Canggu", type: "activity", lat: -8.6478, lng: 115.1385, cost: 30, duration: "2.5h", slot: "morning", description: "Beginner-friendly black-sand break at Batu Bolong.", tags: ["beach", "adventure"] },
      { title: "Uluwatu Temple & Kecak fire dance", type: "activity", lat: -8.8291, lng: 115.0849, cost: 15, duration: "3h", slot: "evening", description: "Cliff-top temple, sunset, a hundred chanting men.", tags: ["culture", "romantic"] },
      { title: "Spa afternoon in Ubud", type: "activity", lat: -8.5148, lng: 115.2603, cost: 35, duration: "2h", slot: "afternoon", description: "Balinese massage, flower bath, and silence.", tags: ["wellness", "luxury"] },
      { title: "Warung lunch at Warung Biah Biah", type: "meal", lat: -8.5088, lng: 115.2647, cost: 6, duration: "1h", slot: "midday", description: "Small plates of Balinese classics for a few euros.", tags: ["food", "budget"] },
      { title: "Beach club sunset at Finns", type: "activity", lat: -8.6651, lng: 115.1329, cost: 25, duration: "3h", slot: "evening", description: "Daybeds, DJs, and a pink sky over Berawa.", tags: ["nightlife", "beach"] },
      { title: "Dinner at Locavore NXT", type: "meal", lat: -8.5106, lng: 115.2609, cost: 110, duration: "3h", slot: "evening", description: "Hyper-local tasting menu in a Ubud jungle building.", tags: ["food", "luxury"] },
      { title: "Nusa Penida day trip", type: "activity", lat: -8.7274, lng: 115.5444, cost: 65, duration: "10h", slot: "morning", description: "Kelingking cliff, snorkelling with mantas.", tags: ["adventure", "beach", "nature"] },
      { title: "Smoothie bowls at Sayuri", type: "meal", lat: -8.5142, lng: 115.2649, cost: 9, duration: "1h", slot: "morning", description: "Ubud's breakfast ritual.", tags: ["food", "wellness"] },
    ],
  },
  {
    slug: "marrakech",
    name: "Marrakech",
    country: "Morocco",
    lat: 31.6295,
    lng: -7.9811,
    airport: "RAK",
    airportName: "Menara",
    airportLat: 31.6069,
    airportLng: -8.0363,
    tags: ["warm", "culture", "food", "history", "budget", "adventure", "romantic", "art"],
    bestMonths: [3, 4, 5, 10, 11],
    priceLevel: 1,
    nightly: 65,
    mealCost: 14,
    neighborhood: "The Medina",
    hotelNames: ["Riad Yasmine", "Riad BE", "El Fenn", "Riad Jardin Secret"],
    blurb: "A rose-pink maze of souks, courtyards, and mint tea poured from a height.",
    aliases: ["marrakech", "marrakesh", "morocco"],
    pois: [
      { title: "Jardin Majorelle & YSL Museum", type: "activity", lat: 31.6417, lng: -8.0033, cost: 20, duration: "2.5h", slot: "morning", description: "Cobalt blue walls, cacti, and couture.", tags: ["art", "culture"] },
      { title: "Souk wander & Bahia Palace", type: "activity", lat: 31.6215, lng: -7.9834, cost: 8, duration: "3h", slot: "midday", description: "Lanterns, leather, spices, then zellige tile heaven.", tags: ["culture", "history"] },
      { title: "Jemaa el-Fnaa at dusk", type: "activity", lat: 31.6258, lng: -7.9891, cost: 0, duration: "2h", slot: "evening", description: "Snake charmers, storytellers, smoke from a hundred grills.", tags: ["culture", "nightlife"] },
      { title: "Atlas Mountains & Berber village hike", type: "activity", lat: 31.1366, lng: -7.9182, cost: 55, duration: "8h", slot: "morning", description: "Imlil valley, waterfalls, lunch in a family home.", tags: ["nature", "adventure"] },
      { title: "Hammam at Les Bains de Marrakech", type: "activity", lat: 31.6229, lng: -7.9862, cost: 45, duration: "2h", slot: "afternoon", description: "Black soap, steam, and a scrub you'll remember.", tags: ["wellness"] },
      { title: "Rooftop dinner at Nomad", type: "meal", lat: 31.6271, lng: -7.9848, cost: 30, duration: "2h", slot: "evening", description: "Modern Moroccan above the spice square.", tags: ["food", "romantic"] },
      { title: "Tagine cooking class", type: "activity", lat: 31.6284, lng: -7.9825, cost: 40, duration: "4h", slot: "midday", description: "Market trip, then lamb with prunes and preserved lemon.", tags: ["food", "culture"] },
      { title: "Agafay desert sunset camel ride", type: "activity", lat: 31.4386, lng: -8.2263, cost: 60, duration: "5h", slot: "afternoon", description: "Stone desert, camels, dinner under the stars.", tags: ["adventure", "romantic"] },
      { title: "Street food at Mechoui Alley", type: "meal", lat: 31.6262, lng: -7.9885, cost: 8, duration: "1h", slot: "midday", description: "Whole roasted lamb, pulled and salted, by the kilo.", tags: ["food", "budget"] },
      { title: "Le Jardin Secret", type: "activity", lat: 31.6314, lng: -7.9877, cost: 8, duration: "1.5h", slot: "afternoon", description: "A restored riad garden, quiet in the medina's heart.", tags: ["nature", "history"] },
      { title: "Dinner at Le Jardin", type: "meal", lat: 31.6308, lng: -7.9872, cost: 24, duration: "2h", slot: "evening", description: "Under banana trees and green tiles.", tags: ["food"] },
      { title: "Ben Youssef Madrasa", type: "activity", lat: 31.6321, lng: -7.9861, cost: 6, duration: "1h", slot: "morning", description: "The most beautiful courtyard in Morocco.", tags: ["history", "art"] },
    ],
  },
  {
    slug: "new-york",
    name: "New York",
    country: "USA",
    lat: 40.7128,
    lng: -74.006,
    airport: "JFK",
    airportName: "John F. Kennedy",
    airportLat: 40.6413,
    airportLng: -73.7781,
    tags: ["city", "food", "art", "nightlife", "culture", "luxury", "mild"],
    bestMonths: [4, 5, 6, 9, 10, 12],
    priceLevel: 3,
    nightly: 190,
    mealCost: 35,
    neighborhood: "West Village",
    hotelNames: ["The Hoxton Williamsburg", "Ace Hotel", "The Ludlow", "Walker Hotel Tribeca"],
    blurb: "The whole world on one grid. Bagels at 7, jazz at midnight.",
    aliases: ["new york city", "manhattan", "brooklyn"],
    pois: [
      { title: "Sunrise walk across the Brooklyn Bridge", type: "activity", lat: 40.7061, lng: -73.9969, cost: 0, duration: "1.5h", slot: "morning", description: "Manhattan lighting up ahead of you, empty boards underfoot.", tags: ["city", "romantic"] },
      { title: "The Met", type: "activity", lat: 40.7794, lng: -73.9632, cost: 30, duration: "3h", slot: "midday", description: "Pick two wings. You'll still not finish.", tags: ["art", "culture"] },
      { title: "Bagels at Russ & Daughters", type: "meal", lat: 40.7223, lng: -73.9883, cost: 18, duration: "1h", slot: "morning", description: "Lox, cream cheese, capers. Since 1914.", tags: ["food"] },
      { title: "The High Line to Chelsea Market", type: "activity", lat: 40.748, lng: -74.0048, cost: 0, duration: "2h", slot: "afternoon", description: "Elevated garden railway, then tacos and lobster rolls.", tags: ["city", "food", "nature"] },
      { title: "Jazz at the Village Vanguard", type: "activity", lat: 40.7358, lng: -74.0016, cost: 40, duration: "2h", slot: "evening", description: "A basement room where everything happened.", tags: ["nightlife", "culture"] },
      { title: "Broadway show", type: "activity", lat: 40.759, lng: -73.9845, cost: 120, duration: "3h", slot: "evening", description: "Rush tickets in the morning, orchestra seats by night.", tags: ["culture", "luxury"] },
      { title: "Dim sum in Flushing", type: "meal", lat: 40.7598, lng: -73.83, cost: 22, duration: "1.5h", slot: "midday", description: "The 7 train to the best Chinese food in America.", tags: ["food", "budget"] },
      { title: "Pizza at L'Industrie", type: "meal", lat: 40.7145, lng: -73.9569, cost: 14, duration: "1h", slot: "midday", description: "Burrata slice in Williamsburg. Worth the line.", tags: ["food"] },
      { title: "Cocktails at Attaboy", type: "activity", lat: 40.7187, lng: -73.9917, cost: 36, duration: "1.5h", slot: "evening", description: "No menu. Tell them what you like.", tags: ["nightlife"] },
      { title: "Staten Island Ferry & Statue of Liberty views", type: "activity", lat: 40.7013, lng: -74.0131, cost: 0, duration: "1.5h", slot: "afternoon", description: "Free, and the best harbour view there is.", tags: ["city", "budget"] },
      { title: "MoMA", type: "activity", lat: 40.7614, lng: -73.9776, cost: 30, duration: "2.5h", slot: "afternoon", description: "Starry Night, then the sculpture garden.", tags: ["art"] },
      { title: "Dinner at Via Carota", type: "meal", lat: 40.7327, lng: -74.0027, cost: 70, duration: "2h", slot: "evening", description: "Cacio e pepe and a green salad that's become famous.", tags: ["food", "romantic"] },
    ],
  },
  {
    slug: "banff",
    name: "Banff",
    country: "Canada",
    lat: 51.1784,
    lng: -115.5708,
    airport: "YYC",
    airportName: "Calgary",
    airportLat: 51.1215,
    airportLng: -114.0076,
    tags: ["cold", "nature", "adventure", "wellness", "romantic"],
    bestMonths: [1, 2, 6, 7, 8, 9],
    priceLevel: 2,
    nightly: 140,
    mealCost: 30,
    neighborhood: "Banff Townsite",
    hotelNames: ["Moose Hotel & Suites", "Fairmont Banff Springs", "Mount Royal Hotel", "Peaks Hotel"],
    blurb: "Turquoise lakes, elk in the road, and mountains that don't look real.",
    aliases: ["banff", "canadian rockies", "lake louise", "alberta"],
    pois: [
      { title: "Lake Louise at sunrise", type: "activity", lat: 51.4254, lng: -116.1773, cost: 0, duration: "2h", slot: "morning", description: "The lake glows turquoise as light hits Victoria Glacier.", tags: ["nature", "romantic"] },
      { title: "Moraine Lake shuttle & Rockpile", type: "activity", lat: 51.3217, lng: -116.1860, cost: 12, duration: "3h", slot: "morning", description: "The view on the old twenty-dollar bill.", tags: ["nature"] },
      { title: "Banff Gondola & Sulphur Mountain", type: "activity", lat: 51.1471, lng: -115.5585, cost: 55, duration: "3h", slot: "afternoon", description: "Six peaks and the whole Bow Valley from the boardwalk.", tags: ["nature", "adventure"] },
      { title: "Banff Upper Hot Springs", type: "activity", lat: 51.1503, lng: -115.5613, cost: 17, duration: "1.5h", slot: "evening", description: "Steaming outdoor pool at 1,585m, snow or stars.", tags: ["wellness", "romantic"] },
      { title: "Johnston Canyon hike", type: "activity", lat: 51.2453, lng: -115.8397, cost: 0, duration: "3h", slot: "midday", description: "Catwalks bolted to the canyon wall to the Upper Falls.", tags: ["nature", "adventure"] },
      { title: "Icefields Parkway drive to Peyto Lake", type: "activity", lat: 51.7178, lng: -116.5136, cost: 25, duration: "6h", slot: "morning", description: "The most beautiful road in the world, wolf-shaped lake included.", tags: ["nature", "adventure"] },
      { title: "Breakfast at Wild Flour Bakery", type: "meal", lat: 51.1776, lng: -115.5704, cost: 14, duration: "1h", slot: "morning", description: "Sourdough, cinnamon buns, proper coffee.", tags: ["food"] },
      { title: "Dinner at The Bison", type: "meal", lat: 51.1786, lng: -115.5716, cost: 55, duration: "2h", slot: "evening", description: "Bison short rib, mountain views, local beer.", tags: ["food"] },
      { title: "Canoe on Lake Louise", type: "activity", lat: 51.4167, lng: -116.2167, cost: 65, duration: "1.5h", slot: "midday", description: "Red canoes on impossible water.", tags: ["adventure", "romantic", "nature"] },
      { title: "Poutine at Eddie Burger + Bar", type: "meal", lat: 51.1772, lng: -115.5722, cost: 20, duration: "1h", slot: "midday", description: "Post-hike fuel, gravy included.", tags: ["food", "budget"] },
      { title: "Evening wildlife safari", type: "activity", lat: 51.16, lng: -115.6, cost: 60, duration: "3h", slot: "evening", description: "Elk, bighorn sheep, and if you're lucky, a grizzly.", tags: ["nature"] },
      { title: "Fondue at the Grizzly House", type: "meal", lat: 51.1781, lng: -115.5712, cost: 60, duration: "2h", slot: "evening", description: "A 1967 time capsule with hot rocks and a lot of cheese.", tags: ["food", "culture"] },
    ],
  },
  {
    slug: "amalfi",
    name: "Amalfi Coast",
    country: "Italy",
    lat: 40.634,
    lng: 14.6027,
    airport: "NAP",
    airportName: "Naples Capodichino",
    airportLat: 40.8847,
    airportLng: 14.2908,
    tags: ["warm", "beach", "food", "romantic", "luxury", "nature", "history", "culture"],
    bestMonths: [5, 6, 9, 10],
    priceLevel: 3,
    nightly: 170,
    mealCost: 35,
    neighborhood: "Positano",
    hotelNames: ["Hotel Poseidon", "Casa Angelina", "Hotel Marincanto", "Villa Franca"],
    blurb: "Lemon groves on cliffs, boats to Capri, and dinner that takes three hours.",
    aliases: ["amalfi", "amalfi coast", "positano", "italy", "capri", "sorrento"],
    pois: [
      { title: "Path of the Gods hike", type: "activity", lat: 40.6296, lng: 14.5262, cost: 0, duration: "4h", slot: "morning", description: "Bomerano to Nocelle along the cliff edge. Bring water.", tags: ["nature", "adventure"] },
      { title: "Boat day to Capri & the Blue Grotto", type: "activity", lat: 40.5532, lng: 14.2222, cost: 95, duration: "8h", slot: "morning", description: "Faraglioni rocks, a swim off the boat, limoncello.", tags: ["beach", "luxury", "romantic"] },
      { title: "Positano beach & Spiaggia Grande", type: "activity", lat: 40.6277, lng: 14.4877, cost: 25, duration: "3h", slot: "afternoon", description: "Orange umbrellas, pastel houses stacked behind you.", tags: ["beach", "warm"] },
      { title: "Lunch at Da Adolfo", type: "meal", lat: 40.6335, lng: 14.5013, cost: 40, duration: "2.5h", slot: "midday", description: "Boat-only beach shack. Mozzarella grilled on lemon leaves.", tags: ["food", "beach"] },
      { title: "Ravello & Villa Cimbrone gardens", type: "activity", lat: 40.6488, lng: 14.6112, cost: 10, duration: "3h", slot: "midday", description: "The Terrace of Infinity, 350m above the sea.", tags: ["romantic", "nature", "history"] },
      { title: "Amalfi Cathedral & paper museum", type: "activity", lat: 40.6344, lng: 14.6027, cost: 8, duration: "1.5h", slot: "afternoon", description: "Arab-Norman stripes and 700 years of papermaking.", tags: ["history", "culture"] },
      { title: "Limoncello & lemon-grove tour", type: "activity", lat: 40.6265, lng: 14.6209, cost: 30, duration: "2h", slot: "afternoon", description: "Sfusato lemons the size of your head.", tags: ["food", "culture"] },
      { title: "Sunset aperitivo at Franco's Bar", type: "activity", lat: 40.6286, lng: 14.4855, cost: 28, duration: "1.5h", slot: "evening", description: "Positano's most beautiful terrace, spritz in hand.", tags: ["nightlife", "romantic", "luxury"] },
      { title: "Dinner at La Tagliata", type: "meal", lat: 40.6339, lng: 14.5079, cost: 45, duration: "3h", slot: "evening", description: "No menu, family-run, all from the garden, on a mountain.", tags: ["food", "culture"] },
      { title: "Pizza in Naples at L'Antica Pizzeria da Michele", type: "meal", lat: 40.8498, lng: 14.2633, cost: 8, duration: "1h", slot: "midday", description: "Margherita or marinara. That's it. That's the menu.", tags: ["food", "budget", "history"] },
      { title: "Pompeii", type: "activity", lat: 40.7484, lng: 14.4848, cost: 22, duration: "4h", slot: "morning", description: "A whole Roman city, paused mid-sentence.", tags: ["history", "culture"] },
      { title: "Seafood dinner in Cetara", type: "meal", lat: 40.6484, lng: 14.7015, cost: 50, duration: "2h", slot: "evening", description: "Anchovy capital of Italy, colatura on everything.", tags: ["food"] },
    ],
  },
  {
    slug: "kyoto",
    name: "Kyoto",
    country: "Japan",
    lat: 35.0116,
    lng: 135.7681,
    airport: "KIX",
    airportName: "Kansai",
    airportLat: 34.4347,
    airportLng: 135.2441,
    tags: ["culture", "history", "nature", "food", "wellness", "romantic", "art", "mild"],
    bestMonths: [3, 4, 5, 10, 11],
    priceLevel: 2,
    nightly: 105,
    mealCost: 22,
    neighborhood: "Gion",
    hotelNames: ["Hotel Kanra", "Gion Hatanaka", "Kyoto Granbell", "Ace Hotel Kyoto"],
    blurb: "Two thousand temples, moss gardens, and the sound of a bamboo grove.",
    aliases: ["kyoto", "osaka", "kansai"],
    pois: [
      { title: "Fushimi Inari at dawn", type: "activity", lat: 34.9671, lng: 135.7727, cost: 0, duration: "2.5h", slot: "morning", description: "Ten thousand vermilion gates up the mountain, nearly alone.", tags: ["culture", "history", "nature"] },
      { title: "Arashiyama bamboo grove & Tenryu-ji", type: "activity", lat: 35.0094, lng: 135.6722, cost: 8, duration: "3h", slot: "morning", description: "Green cathedral light, then a Zen garden by the river.", tags: ["nature", "culture"] },
      { title: "Nishiki Market grazing", type: "meal", lat: 35.005, lng: 135.7649, cost: 18, duration: "1.5h", slot: "midday", description: "Kyoto's kitchen: pickles, tamagoyaki, soy-milk doughnuts.", tags: ["food"] },
      { title: "Kinkaku-ji (Golden Pavilion)", type: "activity", lat: 35.0394, lng: 135.7292, cost: 4, duration: "1.5h", slot: "midday", description: "Gold leaf reflected in a mirror pond.", tags: ["history", "art"] },
      { title: "Tea ceremony in Gion", type: "activity", lat: 35.0037, lng: 135.7788, cost: 40, duration: "1.5h", slot: "afternoon", description: "Matcha, wagashi, and the grammar of stillness.", tags: ["culture", "wellness"] },
      { title: "Kaiseki dinner at Gion Karyo", type: "meal", lat: 35.0031, lng: 135.7752, cost: 95, duration: "2.5h", slot: "evening", description: "Nine courses that track the season.", tags: ["food", "luxury"] },
      { title: "Philosopher's Path & Ginkaku-ji", type: "activity", lat: 35.0269, lng: 135.7943, cost: 4, duration: "2.5h", slot: "afternoon", description: "Canal-side stroll to the Silver Pavilion's sand garden.", tags: ["nature", "romantic", "culture"] },
      { title: "Pontocho alley dinner", type: "meal", lat: 35.0064, lng: 135.7712, cost: 40, duration: "2h", slot: "evening", description: "Lantern-lit lane, riverside terraces in summer.", tags: ["food", "romantic"] },
      { title: "Kiyomizu-dera at sunset", type: "activity", lat: 34.9949, lng: 135.785, cost: 4, duration: "2h", slot: "evening", description: "The wooden stage over the maples, the city turning gold.", tags: ["history", "romantic"] },
      { title: "Day trip to Nara deer park", type: "activity", lat: 34.685, lng: 135.843, cost: 15, duration: "6h", slot: "morning", description: "Bowing deer and the Great Buddha at Todai-ji.", tags: ["nature", "history"] },
      { title: "Ramen at Honke Daiichi-Asahi", type: "meal", lat: 34.9878, lng: 135.7605, cost: 9, duration: "1h", slot: "midday", description: "Shoyu ramen by the station, open till 2am.", tags: ["food", "budget"] },
      { title: "Sake tasting in Fushimi", type: "activity", lat: 34.9336, lng: 135.7623, cost: 20, duration: "2h", slot: "afternoon", description: "Gekkeikan and the small breweries along the canal.", tags: ["food", "culture"] },
    ],
  },
];

export const AIRLINES: Record<string, string[]> = {
  default: ["Delta", "United", "American", "JetBlue"],
  eu: ["TAP Air Portugal", "Iberia", "Lufthansa", "KLM", "Air France", "British Airways"],
  asia: ["ANA", "Japan Airlines", "Singapore Airlines", "Cathay Pacific"],
  latam: ["Aeroméxico", "Volaris", "Copa"],
  north: ["Icelandair", "PLAY", "Air Canada", "WestJet"],
  africa: ["Royal Air Maroc", "Ryanair", "easyJet"],
  oceania: ["Garuda Indonesia", "Qatar Airways", "Singapore Airlines"],
};

export function airlinesFor(slug: string) {
  const map: Record<string, keyof typeof AIRLINES> = {
    lisbon: "eu",
    barcelona: "eu",
    amalfi: "eu",
    tokyo: "asia",
    kyoto: "asia",
    "mexico-city": "latam",
    reykjavik: "north",
    banff: "north",
    marrakech: "africa",
    bali: "oceania",
    "new-york": "default",
  };
  return [...AIRLINES[map[slug] ?? "default"], ...AIRLINES.default.slice(0, 2)];
}

/* ------------------------------------------------------------------ */
/* Things-to-do helpers: ratings + category grouping for POIs          */
/* ------------------------------------------------------------------ */

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic "review score" for a POI, so the same place always shows the same rating. */
export function poiRating(p: Poi): number {
  let r = 3.9 + (hashStr(p.title) % 10) / 10;
  if (p.tags.includes("luxury")) r += 0.15;
  if (p.cost === 0) r -= 0.05;
  return Math.round(Math.max(3.7, Math.min(4.9, r)) * 10) / 10;
}

export type PoiCategory = "Museums & Culture" | "Food & Drink" | "Outdoors & Nature" | "Nightlife" | "Wellness & Relax" | "Sightseeing";

export function poiCategory(p: Poi): PoiCategory {
  if (p.type === "meal") return "Food & Drink";
  if (p.tags.includes("wellness")) return "Wellness & Relax";
  if (p.tags.includes("nightlife")) return "Nightlife";
  if (p.tags.includes("art") || p.tags.includes("history") || p.tags.includes("culture")) return "Museums & Culture";
  if (p.tags.includes("nature") || p.tags.includes("adventure") || p.tags.includes("beach")) return "Outdoors & Nature";
  return "Sightseeing";
}

export const INTEREST_OPTIONS: { key: Tag; label: string; emoji: string }[] = [
  { key: "food", label: "Food", emoji: "🍜" },
  { key: "beach", label: "Beach", emoji: "🏖️" },
  { key: "nature", label: "Nature", emoji: "🏔️" },
  { key: "culture", label: "Culture", emoji: "🏛️" },
  { key: "art", label: "Art & design", emoji: "🎨" },
  { key: "nightlife", label: "Nightlife", emoji: "🌃" },
  { key: "adventure", label: "Adventure", emoji: "🧗" },
  { key: "history", label: "History", emoji: "📜" },
  { key: "wellness", label: "Wellness", emoji: "🧖" },
  { key: "romantic", label: "Romantic", emoji: "🌹" },
  { key: "luxury", label: "Splurge", emoji: "✨" },
  { key: "budget", label: "Budget", emoji: "💸" },
];
