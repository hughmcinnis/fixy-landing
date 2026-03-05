CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  professional_google_id TEXT NOT NULL,
  professional_name TEXT NOT NULL,
  professional_email TEXT NOT NULL,
  professional_phone TEXT,
  diagnosis TEXT NOT NULL,
  service_type TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  user_location JSONB,
  user_contact JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'claimed', 'expired')),
  email_sent_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_professional_email ON leads(professional_email);

CREATE TABLE pro_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_accounts_email ON pro_accounts(email);

CREATE TABLE lead_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  pro_id UUID REFERENCES pro_accounts(id),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, pro_id)
);
