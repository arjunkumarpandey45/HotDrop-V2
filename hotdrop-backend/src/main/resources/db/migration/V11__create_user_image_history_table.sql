CREATE TABLE user_image_history (
                                    id UUID PRIMARY KEY,
                                    user_id UUID NOT NULL,
                                    image_url VARCHAR(255) NOT NULL,
                                    public_id VARCHAR(255) NOT NULL ,
                                    changed_at TIMESTAMP NOT NULL,
                                    CONSTRAINT fk_user_image_history_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);


CREATE INDEX idx_user_image_history_user_id ON user_image_history(user_id);