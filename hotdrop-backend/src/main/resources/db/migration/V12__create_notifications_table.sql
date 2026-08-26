
CREATE TABLE notifications (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               recipient_id UUID NOT NULL,
                               sender_id UUID NOT NULL,
                               type VARCHAR(50) NOT NULL,
                               message TEXT NOT NULL,
                               reference_id UUID,
                               is_read BOOLEAN NOT NULL DEFAULT FALSE,
                               created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                               CONSTRAINT fk_notification_recipient
                                   FOREIGN KEY (recipient_id)
                                       REFERENCES users(id)
                                       ON DELETE CASCADE,

                               CONSTRAINT fk_notification_sender
                                   FOREIGN KEY (sender_id)
                                       REFERENCES users(id)
                                       ON DELETE CASCADE
);

CREATE INDEX idx_notifications_recipient_created_at
    ON notifications(recipient_id, created_at DESC);

CREATE INDEX idx_notifications_recipient_unread
    ON notifications(recipient_id)
    WHERE is_read = FALSE;