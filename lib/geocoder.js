const fetch = require('node-fetch');

const cache = new Map();

async function geocodeZipCode(zip) {
  if (cache.has(zip)) return cache.get(zip);

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
  );
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Could not geocode zip code: ${zip}`);
  }

  const result = data.results[0];
  const loc = result.geometry.location;

  let city = '', state = '';
  for (const comp of result.address_components) {
    if (comp.types.includes('locality')) city = comp.long_name;
    if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
  }

  const geo = { lat: loc.lat, lng: loc.lng, city, state };
  cache.set(zip, geo);
  return geo;
}

module.exports = { geocodeZipCode };
