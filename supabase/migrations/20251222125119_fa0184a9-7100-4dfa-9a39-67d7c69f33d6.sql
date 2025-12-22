-- Add scroll_tx_hash column to store blockchain transaction hash
ALTER TABLE public.galamsey_reports 
ADD COLUMN scroll_tx_hash text DEFAULT NULL;