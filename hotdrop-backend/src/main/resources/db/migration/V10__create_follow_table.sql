

CREATE TABLE follows (
                         id UUID NOT NULL,
                         follower_id UUID NOT NULL,
                         following_id UUID NOT NULL,
                         created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,

                         CONSTRAINT pk_follows PRIMARY KEY (id),

                         CONSTRAINT fk_follows_on_follower FOREIGN KEY (follower_id)
                             REFERENCES users (id) ON DELETE CASCADE,

                         CONSTRAINT fk_follows_on_following FOREIGN KEY (following_id)
                             REFERENCES users (id) ON DELETE CASCADE,

                         CONSTRAINT uq_follower_following UNIQUE (follower_id, following_id)
);

-- Indexing for fast dynamic relationship lookups
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);