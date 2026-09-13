
UPDATE posts SET is_link_dead = FALSE WHERE is_link_dead IS NULL;

ALTER TABLE posts ALTER COLUMN is_link_dead SET NOT NULL;
ALTER TABLE posts ALTER COLUMN is_link_dead SET DEFAULT FALSE;


CREATE INDEX IF NOT EXISTS idx_posts_link_tracking ON posts(is_link_dead, last_checked);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);


CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_tags_gin ON posts USING GIN (tags);