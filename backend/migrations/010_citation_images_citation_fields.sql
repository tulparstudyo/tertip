ALTER TABLE citation_images ADD COLUMN IF NOT EXISTS page_number INT;
ALTER TABLE citation_images ADD COLUMN IF NOT EXISTS citation_text TEXT DEFAULT '';
