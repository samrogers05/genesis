-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    receiver_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can view their own messages'
    ) THEN
        CREATE POLICY "Users can view their own messages"
            ON messages FOR SELECT
            USING (
                auth.uid() = sender_id OR 
                auth.uid() = receiver_id
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can insert their own messages'
    ) THEN
        CREATE POLICY "Users can insert their own messages"
            ON messages FOR INSERT
            WITH CHECK (auth.uid() = sender_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can update their own messages'
    ) THEN
        CREATE POLICY "Users can update their own messages"
            ON messages FOR UPDATE
            USING (auth.uid() = sender_id)
            WITH CHECK (auth.uid() = sender_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can delete their own messages'
    ) THEN
        CREATE POLICY "Users can delete their own messages"
            ON messages FOR DELETE
            USING (auth.uid() = sender_id);
    END IF;
END $$; 