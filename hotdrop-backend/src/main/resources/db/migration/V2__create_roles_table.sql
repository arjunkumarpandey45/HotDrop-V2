CREATE TABLE roles (
                       id UUID NOT NULL,
                       role_name VARCHAR(255) NOT NULL UNIQUE CHECK (role_name IN ('USER', 'ADMIN')),

                       PRIMARY KEY (id)
);