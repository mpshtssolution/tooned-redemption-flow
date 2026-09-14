-- Demo gift code for local/V1 testing.
-- The raw code is never stored; only its SHA-256 hash is stored.

INSERT INTO gift_codes (code_hash, code_last4, batch_id, status)
VALUES (
  encode(digest(upper('TOON-7K4P-92MX'), 'sha256'), 'hex'),
  '92MX',
  'demo',
  'active'
)
ON CONFLICT (code_hash) DO NOTHING;
