const { geocodeZipCode } = require('../lib/geocoder');
const { searchNearbyPros } = require('../lib/google-places');
const { scrapeEmailFromWebsite } = require('../lib/email-scraper');
const { findEmailByDomain } = require('../lib/hunter');
const { mapDiagnosisToServiceType } = require('../lib/service-mapping');

// In-memory cache (persists across warm invocations)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { zipCode, serviceType, diagnosis, radius } = req.body || {};
    if (!zipCode) return res.status(400).json({ error: 'zipCode is required' });

    // Determine service type
    const mapped = serviceType
      ? { serviceType, googlePlacesType: serviceType.toLowerCase().replace(/\s+/g, '_') }
      : mapDiagnosisToServiceType(diagnosis || '');

    // Check cache
    const cacheKey = `${zipCode}:${mapped.googlePlacesType}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return res.status(200).json(cached.data);
    }

    // Geocode
    const geo = await geocodeZipCode(zipCode);

    // Search Google Places
    const places = await searchNearbyPros(geo.lat, geo.lng, mapped.googlePlacesType, radius || 40000);

    // Scrape emails in parallel
    const withEmails = await Promise.allSettled(
      places.map(async (place) => {
        let email = null;
        let emailSource = null;

        // Try website scrape
        if (place.website) {
          email = await scrapeEmailFromWebsite(place.website);
          if (email) emailSource = 'website_scrape';
        }

        // Fallback to Hunter.io
        if (!email && place.website) {
          try {
            const domain = new URL(place.website).hostname.replace('www.', '');
            const generic = ['google.com', 'facebook.com', 'yelp.com', 'yellowpages.com'];
            if (!generic.includes(domain)) {
              email = await findEmailByDomain(domain);
              if (email) emailSource = 'hunter_io';
            }
          } catch {}
        }

        return { ...place, email, emailSource };
      })
    );

    // Filter to only those with emails, sort by rating
    const pros = withEmails
      .filter(r => r.status === 'fulfilled' && r.value.email)
      .map(r => r.value)
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, 5);

    const result = {
      professionals: pros,
      totalFound: places.length,
      totalWithEmail: pros.length,
      location: { city: geo.city, state: geo.state }
    };

    // Cache
    cache.set(cacheKey, { data: result, time: Date.now() });

    return res.status(200).json(result);
  } catch (err) {
    console.error('find-pros error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
