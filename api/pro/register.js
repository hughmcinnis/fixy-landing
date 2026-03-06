const bcrypt = require('bcryptjs');
const { createProAccount, getProByEmail, claimLead } = require('../../lib/db');
const { signToken } = require('../../lib/auth');
const { getClient } = require('../../lib/db');

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
    const { companyName, email, phone, password, leadId } = req.body || {};

    if (!companyName || !email || !password) {
      return res.status(400).json({ error: 'companyName, email, and password are required' });
    }

    // Check if email already exists
    const existing = await getProByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create account
    const account = await createProAccount({
      company_name: companyName,
      email: email.toLowerCase(),
      phone: phone || null,
      password_hash: passwordHash
    });

    // Auto-claim pending leads sent to this email
    const { data: pendingLeads } = await getClient()
      .from('leads')
      .select('id')
      .eq('professional_email', email.toLowerCase())
      .in('status', ['pending', 'sent']);

    if (pendingLeads?.length) {
      for (const lead of pendingLeads) {
        try { await claimLead(lead.id, account.id); } catch {}
      }
    }

    // Also claim the specific lead from the claim link (even if different email)
    if (leadId) {
      try { await claimLead(leadId, account.id); } catch {}
    }

    const token = signToken(account.id);

    return res.status(201).json({
      token,
      account: {
        id: account.id,
        companyName: account.company_name,
        email: account.email
      }
    });
  } catch (err) {
    console.error('pro/register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
