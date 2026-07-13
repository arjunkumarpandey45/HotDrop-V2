

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE posts (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       title VARCHAR(255) NOT NULL,
                       description TEXT NOT NULL,
                       project_url VARCHAR(512) NOT NULL,
                       share_url VARCHAR(255) NOT NULL UNIQUE,
                       is_link_dead BOOLEAN DEFAULT FALSE,
                       last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       like_count INT DEFAULT 0,
                       comment_count INT DEFAULT 0,
                       share_count INT DEFAULT 0,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       user_id UUID NOT NULL,
                       tags VARCHAR(50)[],
                       CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE post_images (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             url VARCHAR(512) NOT NULL,
                             public_id VARCHAR(255) NOT NULL,
                             post_id UUID NOT NULL,
                             CONSTRAINT fk_images_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);