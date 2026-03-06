const fetch = require('node-fetch');

// Use Text Search for better results — handles service types that don't have exact Place types
async function searchNearbyPros(lat, lng, type, radius = 40000) {
  // Map type to a natural language query for better results
  const typeQueries = {
    plumber: 'plumber',
    electrician: 'electrician',
    hvac_contractor: 'HVAC contractor',
    general_contractor: 'general contractor handyman',
    roofing_contractor: 'roofing contractor',
    painter: 'house painter',
    appliance_repair_service: 'appliance repair service',
    pest_control: 'pest control',
    garage_door_supplier: 'garage door repair',
    landscaper: 'landscaper',
    locksmith: 'locksmith',
    flooring_contractor: 'flooring contractor',
    window_installation_service: 'window repair installation',
    foundation_contractor: 'foundation repair',
  };

  const query = typeQueries[type] || type.replace(/_/g, ' ');

  // Try Text Search first (better for service types)
  const textRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.location,places.businessStatus'
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius
        }
      },
      maxResultCount: 10
    })
  });

  const data = await textRes.json();

  if (data.error) {
    console.error('Google Places error:', JSON.stringify(data.error));
    
    // Fallback to Nearby Search if Text Search fails
    return nearbySearchFallback(lat, lng, type, radius);
  }

  if (!data.places || data.places.length === 0) {
    // Fallback to Nearby Search
    return nearbySearchFallback(lat, lng, type, radius);
  }

  return mapPlaces(data.places);
}

async function nearbySearchFallback(lat, lng, type, radius) {
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
  return mapPlaces(data.places);
}

function mapPlaces(places) {
  return places
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
