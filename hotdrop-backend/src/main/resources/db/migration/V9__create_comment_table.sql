

CREATE TABLE comments (
                          id UUID NOT NULL,
                          text TEXT NOT NULL,
                          user_id UUID NOT NULL,
                          post_id UUID NOT NULL,
                          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,

                          CONSTRAINT pk_comments PRIMARY KEY (id),

                          CONSTRAINT fk_comments_on_user FOREIGN KEY (user_id)
                              REFERENCES users (id) ON DELETE CASCADE,

                          CONSTRAINT fk_comments_on_post FOREIGN KEY (post_id)
                              REFERENCES posts (id) ON DELETE CASCADE
);


CREATE INDEX idx_comments_post_id ON comments(post_id);