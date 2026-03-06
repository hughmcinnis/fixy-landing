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

    // Map service type to Google Places type
    const SERVICE_TO_GOOGLE = {
      plumber: 'plumber',
      electrician: 'electrician',
      hvac: 'hvac_contractor',
      handyman: 'general_contractor',
      roofer: 'roofing_contractor',
      painter: 'painter',
      appliance_repair: 'appliance_repair_service',
      pest_control: 'pest_control',
      garage_door: 'garage_door_supplier',
      landscaper: 'landscaper',
      general_contractor: 'general_contractor',
      locksmith: 'locksmith',
      flooring: 'flooring_contractor',
      window: 'window_installation_service',
    };

    // Determine service type
    const mapped = serviceType
      ? { serviceType, googlePlacesType: SERVICE_TO_GOOGLE[serviceType.toLowerCase()] || serviceType.toLowerCase() }
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

    // Sort places by weighted score (rating * log(reviewCount+1)) before scraping
    // This ensures we scrape the best candidates first
    const sorted = [...places].sort((a, b) => {
      const scoreA = a.rating * Math.log2((a.reviewCount || 0) + 1);
      const scoreB = b.rating * Math.log2((b.reviewCount || 0) + 1);
      return scoreB - scoreA;
    });

    // Scrape emails in parallel with a 5s timeout per scrape
    const timeoutScrape = (promise) => Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ]);

    const withEmails = await Promise.allSettled(
      sorted.map(async (place) => {
        let email = null;
        let emailSource = null;

        // Try website scrape (with timeout)
        if (place.website) {
          try {
            email = await timeoutScrape(scrapeEmailFromWebsite(place.website));
            if (email) emailSource = 'website_scrape';
          } catch {}
        }

        // Fallback to Hunter.io
        if (!email && place.website) {
          try {
            const domain = new URL(place.website).hostname.replace('www.', '');
            const generic = ['google.com', 'facebook.com', 'yelp.com', 'yellowpages.com'];
            if (!generic.includes(domain)) {
              email = await timeoutScrape(findEmailByDomain(domain));
              if (email) emailSource = 'hunter_io';
            }
          } catch {}
        }

        return { ...place, email, emailSource };
      })
    );

    // Filter to only those with emails, already pre-sorted by weighted score
    const pros = withEmails
      .filter(r => r.status === 'fulfilled' && r.value.email)
      .map(r => r.value)
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
