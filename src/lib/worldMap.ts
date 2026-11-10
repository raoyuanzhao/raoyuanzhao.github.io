/** Projection of public/world-map.svg: Miller, 84°N–57°S, 1000 units wide. */
const LAT_TOP = 84;
const LAT_BOTTOM = -57;
export const MAP_WIDTH = 1000;
const miller = (lat: number) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * (lat * Math.PI) / 180));
const Y_TOP = miller(LAT_TOP);
const Y_BOTTOM = miller(LAT_BOTTOM);
const PROJECTED_HEIGHT = (MAP_WIDTH * (Y_TOP - Y_BOTTOM)) / (2 * Math.PI);
export const MAP_HEIGHT = Math.round(PROJECTED_HEIGHT);

/** Map position (viewBox units, one decimal) of a longitude/latitude. */
export function projectToWorldMap(lon: number, lat: number): { x: number; y: number } {
  const clamped = Math.max(Math.min(lat, LAT_TOP), LAT_BOTTOM);
  return {
    x: Math.round(((lon + 180) / 360) * MAP_WIDTH * 10) / 10,
    y: Math.round(((Y_TOP - miller(clamped)) / (Y_TOP - Y_BOTTOM)) * PROJECTED_HEIGHT * 10) / 10,
  };
}
