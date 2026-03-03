# Fixy Landing Page

A single-page, mobile-first landing page for [Fixy](https://apps.apple.com/app/fixy-ai-handyman/id6747599349) — the AI handyman app.

## What's Included

- `index.html` — Fully self-contained landing page (no external dependencies, all CSS inline)
- SEO meta tags, Open Graph, Twitter Card, and JSON-LD structured data
- Email waitlist form via [Formspree](https://formspree.io)
- App Store download link

## Setup

### 1. Formspree (Email Collection)

The waitlist form points to `https://formspree.io/f/xyzgolda` — this is a **placeholder**.

To set up real email collection:
1. Go to [formspree.io](https://formspree.io) and create a free account
2. Create a new form → copy your form endpoint (e.g. `https://formspree.io/f/mabcdefg`)
3. Replace the `action` URL in `index.html`

**Alternatives:**
- **Mailchimp:** Replace the form action with your Mailchimp embedded form URL
- **Google Sheets:** Use a Google Apps Script webhook
- **Supabase/Firebase:** Add a small JS snippet to POST to your backend
- **mailto:** Replace the form with `<a href="mailto:hello@fixy.app?subject=Waitlist">` for zero-infra

### 2. Assets

Replace these placeholders:
- Add a real favicon (`favicon.ico` or `favicon.png`)
- Create an `og-image.png` (1200×630px) for social sharing
- Optionally add real app screenshots to replace the phone mock

## Deployment

### GitHub Pages
```bash
git init && git add . && git commit -m "init"
gh repo create fixy-landing --public --source=. --push
# Settings → Pages → Deploy from main branch
```

### Netlify
```bash
# Drag & drop the folder at app.netlify.com
# Or: npm i -g netlify-cli && netlify deploy --prod --dir .
```

### Vercel
```bash
npm i -g vercel && vercel --prod
```

### Cloudflare Pages
```bash
# Connect your Git repo at dash.cloudflare.com → Pages
# Build command: (none)  |  Output directory: /
```

### Custom Domain

Point your domain (e.g. `fixy.app`) DNS to your hosting provider, then configure HTTPS (all providers above do this automatically).

## Customization

- **Colors:** Edit CSS variables in `:root { }` at the top of the `<style>` block
- **Testimonials:** Replace placeholder quotes with real reviews
- **Analytics:** Add Google Analytics or Plausible snippet before `</head>`
- **App screenshots:** Replace the `.phone-mock` div with an `<img>` of real screenshots

## Tech

Zero dependencies. Pure HTML + CSS + vanilla JS. ~15KB total. Loads instantly.
