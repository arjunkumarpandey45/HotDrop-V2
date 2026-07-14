CREATE TABLE users
(
    id UUID PRIMARY KEY,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,

    hotdrop_Id VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    bio VARCHAR(250),


    profile_image_url VARCHAR(255),

    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    leetcode_url VARCHAR(255),
    portfolio_url VARCHAR(255),

    banned BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_logged_in BOOLEAN NOT NULL DEFAULT FALSE,

    auth_provider VARCHAR(20) NOT NULL,

    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP
);