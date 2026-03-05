const { createClient } = require('@supabase/supabase-js');

let supabase;
function getClient() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabase;
}

async function createLead(lead) {
  const { data, error } = await getClient()
    .from('leads')
    .insert(lead)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getLead(id) {
  const { data, error } = await getClient()
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function updateLead(id, updates) {
  const { data, error } = await getClient()
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function createProAccount(account) {
  const { data, error } = await getClient()
    .from('pro_accounts')
    .insert(account)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getProByEmail(email) {
  const { data, error } = await getClient()
    .from('pro_accounts')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function getProLeads(proId, proEmail) {
  // Get leads sent to this pro's email OR claimed by this pro
  const { data: claimed } = await getClient()
    .from('lead_claims')
    .select('lead_id')
    .eq('pro_id', proId);

  const claimedIds = (claimed || []).map(c => c.lead_id);

  const { data, error } = await getClient()
    .from('leads')
    .select('*')
    .or(`professional_email.eq.${proEmail}${claimedIds.length ? `,id.in.(${claimedIds.join(',')})` : ''}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function claimLead(leadId, proId) {
  const client = getClient();

  // Create claim record
  const { error: claimError } = await client
    .from('lead_claims')
    .insert({ lead_id: leadId, pro_id: proId });
  if (claimError && claimError.code !== '23505') throw claimError; // ignore duplicate

  // Update lead status
  await client
    .from('leads')
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('id', leadId);
}

module.exports = { getClient, createLead, getLead, updateLead, createProAccount, getProByEmail, getProLeads, claimLead };
