const { getLead } = require('../../lib/db');
const { verifyToken, getTokenFromHeader } = require('../../lib/auth');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Lead ID is required' });

    const lead = await getLead(id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Check for auth
    const token = getTokenFromHeader(req);
    const decoded = token ? verifyToken(token) : null;

    if (decoded) {
      // Authenticated — return full details
      return res.status(200).json({
        id: lead.id,
        diagnosis: lead.diagnosis,
        serviceType: lead.service_type,
        photos: lead.photos,
        userContact: lead.user_contact,
        userLocation: lead.user_location,
        status: lead.status,
        createdAt: lead.created_at,
        professionalName: lead.professional_name
      });
    } else {
      // Unauthenticated — teaser only
      return res.status(200).json({
        id: lead.id,
        diagnosis: lead.diagnosis?.slice(0, 150) + (lead.diagnosis?.length > 150 ? '...' : ''),
        serviceType: lead.service_type,
        generalArea: lead.user_location ? `${lead.user_location.city}, ${lead.user_location.state}` : null,
        createdAt: lead.created_at,
        authenticated: false
      });
    }
  } catch (err) {
    console.error('leads/[id] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
