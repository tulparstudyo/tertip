ALTER TABLE bank_transfers
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT;
