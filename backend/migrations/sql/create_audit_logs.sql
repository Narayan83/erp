-- Run manually if audit_logs table is missing (PostgreSQL)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    menu_label VARCHAR(512),
    action VARCHAR(32),
    entity_type VARCHAR(128),
    entity_id VARCHAR(128),
    user_id BIGINT,
    user_email VARCHAR(255),
    client_ip VARCHAR(128),
    old_value JSONB,
    new_value JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_menu_label ON audit_logs (menu_label);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
