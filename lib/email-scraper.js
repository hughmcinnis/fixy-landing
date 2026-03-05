const fetch = require('node-fetch');
const cheerio = require('cheerio');

const IGNORED_PREFIXES = ['noreply', 'no-reply', 'donotreply', 'do-not-reply'];
const GENERIC_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'];
const PRIORITY = ['info@', 'contact@', 'service@', 'office@', 'hello@'];

function extractEmails(html) {
  const $ = cheerio.load(html);
  const emails = new Set();

  // mailto links
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href');
    const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
    if (email.includes('@')) emails.add(email);
  });

  // regex scan
  const text = $.text() + ' ' + $.html();
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (matches) matches.forEach(e => emails.add(e.toLowerCase()));

  return [...emails];
}

function filterAndRank(emails) {
  const filtered = emails.filter(e => {
    const local = e.split('@')[0];
    const domain = e.split('@')[1];
    if (IGNORED_PREFIXES.some(p => local.startsWith(p))) return false;
    if (GENERIC_DOMAINS.includes(domain)) return false;
    if (domain.includes('.gov')) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const ai = PRIORITY.findIndex(p => a.startsWith(p));
    const bi = PRIORITY.findIndex(p => b.startsWith(p));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return filtered[0] || null;
}

async function fetchPage(url, timeout = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FixyBot/1.0)' },
      redirect: 'follow'
    });
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeEmailFromWebsite(url) {
  if (!url) return null;

  try {
    // Ensure proper URL
    if (!url.startsWith('http')) url = 'https://' + url;
    const base = new URL(url).origin;

    // Try homepage first
    let html = await fetchPage(url);
    if (html) {
      const email = filterAndRank(extractEmails(html));
      if (email) return email;
    }

    // Try /contact and /about
    for (const path of ['/contact', '/contact-us', '/about', '/about-us']) {
      html = await fetchPage(base + path);
      if (html) {
        const email = filterAndRank(extractEmails(html));
        if (email) return email;
      }
    }
  } catch {}

  return null;
}

module.exports = { scrapeEmailFromWebsite };
