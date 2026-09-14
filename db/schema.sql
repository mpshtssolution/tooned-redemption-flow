CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  code_last4 TEXT NOT NULL,
  batch_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'redeemed', 'void', 'expired')),
  redemption_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_code_id UUID NOT NULL UNIQUE REFERENCES gift_codes(id),
  name TEXT,
  email TEXT,
  address TEXT,
  phone TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'ready_for_fulfillment', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE gift_codes
  ADD CONSTRAINT gift_codes_redemption_fk
  FOREIGN KEY (redemption_id) REFERENCES redemptions(id);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redemption_id UUID NOT NULL REFERENCES redemptions(id),
  upgrade_key TEXT,
  amount_inr INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed', 'refunded')),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS gift_codes_status_idx ON gift_codes(status);
CREATE INDEX IF NOT EXISTS redemptions_status_idx ON redemptions(status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
