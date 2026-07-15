CREATE TABLE post_likes (
                            id UUID NOT NULL,
                            user_id UUID NOT NULL,
                            post_id UUID NOT NULL,
                            CONSTRAINT pk_post_likes PRIMARY KEY (id),
                            CONSTRAINT uk_post_likes_user_post UNIQUE (user_id, post_id),
                            CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);