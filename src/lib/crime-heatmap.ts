import { crimePercentile, type CrimeCity } from "./crime-data";

// Render in Web Mercator so the raster stays aligned with Google Maps at any zoom.
const mercator = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const latitude = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI;
type Point = { x: number; y: number; value: number };
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
type HeatmapImage = { url: string; bounds: { west: number; east: number; north: number; south: number } };
const cache = new WeakMap<CrimeCity, HeatmapImage>();

export function createCrimeHeatmap(city: CrimeCity) {
  const cached = cache.get(city);
  if (cached) return cached;
  const points = city.areas.map((area) => ({
    x: area.lng * Math.PI / 180, y: mercator(area.lat),
    value: crimePercentile(city, area),
  })).sort((a, b) => a.x - b.x || a.y - b.y);
  const halfHull = (rows: Point[]) => {
    const hull: Point[] = [];
    for (const point of rows) {
      while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) hull.pop();
      hull.push(point);
    }
    return hull.slice(0, -1);
  };
  const hull = [...halfHull(points), ...halfHull([...points].reverse())];
  const padding = city.radius / (6378137 * Math.cos(city.areas[0].lat * Math.PI / 180));
  const bandwidth = padding * 1.25;
  const west = Math.min(...points.map((p) => p.x)) - padding * 2;
  const east = Math.max(...points.map((p) => p.x)) + padding * 2;
  const south = Math.min(...points.map((p) => p.y)) - padding * 2;
  const north = Math.max(...points.map((p) => p.y)) + padding * 2;
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = Math.max(1, Math.round(768 * (north - south) / (east - west)));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Heatmap canvas unavailable");
  const pixels = ctx.createImageData(canvas.width, canvas.height);
  const colors = [[34, 197, 94], [245, 158, 11], [239, 68, 68]];
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      const px = west + x / (canvas.width - 1) * (east - west);
      const py = north - y / (canvas.height - 1) * (north - south);
      let weighted = 0;
      let weights = 0;
      let nearest = Infinity;
      for (const point of points) nearest = Math.min(nearest, (px - point.x) ** 2 + (py - point.y) ** 2);
      for (const point of points) {
        const distance = (px - point.x) ** 2 + (py - point.y) ** 2;
        const weight = Math.exp(-(distance - nearest) / (2 * bandwidth ** 2));
        weighted += weight * point.value;
        weights += weight;
      }
      const value = Math.min(1, Math.max(0, weighted / weights)) * 2;
      const stop = Math.min(1, Math.floor(value));
      const mix = value - stop;
      for (let c = 0; c < 3; c++) pixels.data[index + c] = colors[stop][c] * (1 - mix) + colors[stop + 1][c] * mix;
      pixels.data[index + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const mask = document.createElement("canvas");
  mask.width = canvas.width;
  mask.height = canvas.height;
  const maskCtx = mask.getContext("2d");
  if (!maskCtx) throw new Error("Heatmap mask unavailable");
  const radius = padding / (east - west) * canvas.width;
  maskCtx.filter = `blur(${radius * 0.4}px)`;
  maskCtx.fillStyle = "white";
  maskCtx.strokeStyle = "white";
  maskCtx.lineWidth = radius;
  maskCtx.lineJoin = "round";
  maskCtx.beginPath();
  hull.forEach((point, index) => {
    const x = (point.x - west) / (east - west) * canvas.width;
    const y = (north - point.y) / (north - south) * canvas.height;
    if (index === 0) maskCtx.moveTo(x, y); else maskCtx.lineTo(x, y);
  });
  maskCtx.closePath();
  maskCtx.fill();
  maskCtx.stroke();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  const result = { url: canvas.toDataURL(), bounds: { west: west * 180 / Math.PI, east: east * 180 / Math.PI, north: latitude(north), south: latitude(south) } };
  cache.set(city, result);
  return result;
}
