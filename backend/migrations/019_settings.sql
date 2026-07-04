CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_code VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL DEFAULT '',
    setting_group VARCHAR(100) NOT NULL DEFAULT 'general',
    setting_name VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_group ON settings (setting_group);

INSERT INTO settings (setting_code, setting_value, setting_group, setting_name) VALUES
    ('WHATSAPP_NUMBER', '', 'contact', 'WhatsApp Numarası'),
    ('PAYMENT_AMOUNT', '', 'payment', 'Ödeme Tutarı'),
    ('PAYMENT_CURRENCY', 'TRY', 'payment', 'Para Birimi'),
    ('SMTP_HOST', '', 'smtp', 'SMTP Sunucu'),
    ('SMTP_PORT', '587', 'smtp', 'SMTP Port'),
    ('SMTP_SECURE', 'false', 'smtp', 'SMTP SSL/TLS'),
    ('SMTP_USER', '', 'smtp', 'SMTP Kullanıcı'),
    ('SMTP_PASS', '', 'smtp', 'SMTP Şifre'),
    ('SMTP_FROM', '', 'smtp', 'Gönderen E-posta'),
    ('PASSWORD_RESET_EXPIRES_HOURS', '1', 'security', 'Şifre Sıfırlama Süresi (saat)')
ON CONFLICT (setting_code) DO NOTHING;
