CREATE TABLE user_oauth_accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_user_oauth_accounts_user_id ON user_oauth_accounts(user_id);

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
