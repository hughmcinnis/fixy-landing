const fetch = require('node-fetch');

async function findEmailByDomain(domain) {
  if (!domain || !process.env.HUNTER_IO_API_KEY) return null;

  try {
    // Strip to domain only
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${process.env.HUNTER_IO_API_KEY}&limit=5`
    );
    const data = await res.json();

    if (!data.data?.emails?.length) return null;

    // Return highest confidence email
    const sorted = data.data.emails.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return sorted[0].value || null;
  } catch {
    return null;
  }
}

module.exports = { findEmailByDomain };
