const bcrypt = require('bcryptjs');
const { getProByEmail } = require('../../lib/db');
const { signToken } = require('../../lib/auth');

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
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const account = await getProByEmail(email);
    if (!account) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(account.id);

    return res.status(200).json({
      token,
      account: {
        id: account.id,
        companyName: account.company_name,
        email: account.email
      }
    });
  } catch (err) {
    console.error('pro/login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
