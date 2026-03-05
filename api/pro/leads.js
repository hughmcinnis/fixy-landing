const { getProLeads } = require('../../lib/db');
const { verifyToken, getTokenFromHeader } = require('../../lib/auth');
const { getClient } = require('../../lib/db');

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
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    // Get pro account to find email
    const { data: account } = await getClient()
      .from('pro_accounts')
      .select('*')
      .eq('id', decoded.proId)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const leads = await getProLeads(decoded.proId, account.email);

    return res.status(200).json({ leads });
  } catch (err) {
    console.error('pro/leads error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
