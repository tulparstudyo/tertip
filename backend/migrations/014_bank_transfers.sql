CREATE TYPE bank_transfer_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE bank_transfers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    sender_name VARCHAR(150),
    bank_name VARCHAR(150),
    transfer_date DATE,
    reference_code VARCHAR(100),
    notes TEXT,
    status bank_transfer_status DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by_admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_transfers_user_id ON bank_transfers(user_id);
CREATE INDEX idx_bank_transfers_status ON bank_transfers(status);
CREATE INDEX idx_bank_transfers_created_at ON bank_transfers(created_at DESC);
