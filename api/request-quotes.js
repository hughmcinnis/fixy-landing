const nodemailer = require('nodemailer');
const { createLead, updateLead } = require('../lib/db');
const { generateLeadEmail } = require('../lib/email-templates');
const { geocodeZipCode } = require('../lib/geocoder');

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
    const { userId, professionals, diagnosis, serviceType, urgency, userAttempts, additionalContext, userContact, photos } = req.body || {};

    if (!professionals?.length || !diagnosis || !serviceType || !userContact) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Geocode user's zip for location info
    let userLocation = null;
    try {
      const geo = await geocodeZipCode(userContact.zipCode);
      userLocation = { ...geo, zipCode: userContact.zipCode };
    } catch {}

    // Create Gmail transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });

    const results = [];

    for (const pro of professionals) {
      try {
        // Create lead in Supabase
        const lead = await createLead({
          user_id: userId || null,
          professional_google_id: pro.googlePlaceId,
          professional_name: pro.name,
          professional_email: pro.email,
          professional_phone: pro.phone || null,
          diagnosis,
          service_type: serviceType,
          urgency: urgency || 'medium',
          user_attempts: userAttempts || null,
          additional_context: additionalContext || null,
          photos: photos || [],
          user_location: userLocation,
          user_contact: userContact,
          status: 'pending'
        });

        // Generate and send email
        const { subject, html } = generateLeadEmail({ ...lead, id: lead.id });

        await transporter.sendMail({
          from: `"Fixy" <${process.env.GMAIL_USER}>`,
          to: pro.email,
          subject,
          html
        });

        // Update lead status
        await updateLead(lead.id, { status: 'sent', email_sent_at: new Date().toISOString() });

        results.push({ leadId: lead.id, professionalName: pro.name, status: 'sent' });
      } catch (err) {
        console.error(`Failed to process lead for ${pro.name}:`, err);
        results.push({ leadId: null, professionalName: pro.name, status: 'failed', error: err.message });
      }
    }

    return res.status(200).json({ leads: results });
  } catch (err) {
    console.error('request-quotes error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
