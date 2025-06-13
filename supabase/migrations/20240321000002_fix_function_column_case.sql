-- Drop the existing function first
DROP FUNCTION IF EXISTS get_conversation_messages(UUID, UUID, TIMESTAMPTZ);

-- Create the updated function with corrected column name case
CREATE OR REPLACE FUNCTION get_conversation_messages(
    p_user_id UUID,
    p_other_user_id UUID,
    p_last_message_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF messages
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.sender_id, m.receiver_id, m.content, m.createdat
    FROM messages m
    WHERE (
        (m.sender_id = p_user_id AND m.receiver_id = p_other_user_id)
        OR
        (m.sender_id = p_other_user_id AND m.receiver_id = p_user_id)
    )
    AND (p_last_message_time IS NULL OR m.createdat > p_last_message_time)
    ORDER BY m.createdat ASC;
END;
$$; 