const fetch = require('node-fetch');

async function searchNearbyPros(lat, lng, type, radius = 40000) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.location,places.businessStatus'
    },
    body: JSON.stringify({
      includedTypes: [type],
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius
        }
      },
      maxResultCount: 10
    })
  });

  const data = await res.json();
  if (!data.places) return [];

  return data.places
    .filter(p => p.businessStatus === 'OPERATIONAL' || !p.businessStatus)
    .map(p => ({
      placeId: p.id,
      name: p.displayName?.text || '',
      rating: p.rating || 0,
      reviewCount: p.userRatingCount || 0,
      address: p.formattedAddress || '',
      phone: p.nationalPhoneNumber || null,
      website: p.websiteUri || null,
      location: p.location ? { lat: p.location.latitude, lng: p.location.longitude } : null
    }));
}

module.exports = { searchNearbyPros };
