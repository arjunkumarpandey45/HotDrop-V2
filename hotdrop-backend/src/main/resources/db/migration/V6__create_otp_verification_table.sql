CREATE TABLE otp_verifications (
                                   id UUID PRIMARY KEY,
                                   email VARCHAR(255) NOT NULL UNIQUE,
                                   otp_hash VARCHAR(255) NOT NULL,
                                   expiry_date TIMESTAMP NOT NULL
);