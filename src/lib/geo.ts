export type LatLng = [number, number];

const R = 6371; // km

export function toRad(d: number) {
  return (d * Math.PI) / 180;
}
export function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

export function haversineKm(a: LatLng, b: LatLng) {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const la1 = toRad(a[0]);
  const la2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Great-circle arc between two points, returned as an array of [lat, lng]. */
export function greatCircle(a: LatLng, b: LatLng, steps = 64): LatLng[] {
  const lat1 = toRad(a[0]);
  const lon1 = toRad(a[1]);
  const lat2 = toRad(b[0]);
  const lon2 = toRad(b[1]);
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat1 - lat2) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon1 - lon2) / 2) ** 2,
      ),
    );
  if (d === 0) return [a, b];
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    pts.push([toDeg(lat), toDeg(lon)]);
  }
  // Unwrap longitude so the line doesn't jump across the antimeridian
  for (let i = 1; i < pts.length; i++) {
    let dl = pts[i][1] - pts[i - 1][1];
    while (dl > 180) {
      pts[i][1] -= 360;
      dl -= 360;
    }
    while (dl < -180) {
      pts[i][1] += 360;
      dl += 360;
    }
  }
  return pts;
}

/** Jitter a coordinate slightly (deterministic by seed) so stacked pins don't overlap perfectly. */
export function jitter([lat, lng]: LatLng, seed: number, amount = 0.0035): LatLng {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  const r = s - Math.floor(s);
  const t = Math.cos(seed * 4321 + 1234) * 12345;
  const r2 = t - Math.floor(t);
  return [lat + (r - 0.5) * amount, lng + (r2 - 0.5) * amount];
}
