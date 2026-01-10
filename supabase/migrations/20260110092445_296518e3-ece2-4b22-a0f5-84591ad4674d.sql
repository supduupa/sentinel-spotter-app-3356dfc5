-- Add blockchain-related columns to galamsey_reports
ALTER TABLE public.galamsey_reports 
ADD COLUMN IF NOT EXISTS scroll_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT;