-- Recreate the handle_signal_boost function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_signal_boost(user_id UUID, project_id UUID)
RETURNS boolean AS $$
DECLARE
    boost_count INTEGER;
    last_reset TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current boost count and last reset time
    SELECT "dailySignalBoosts", "lastSignalBoostReset"
    INTO boost_count, last_reset
    FROM "Profile"
    WHERE id = user_id;

    -- Check if 24 hours have passed since last reset
    IF last_reset < timezone('utc'::text, now()) - interval '24 hours' THEN
        -- Reset boosts
        UPDATE "Profile"
        SET "dailySignalBoosts" = 5,
            "lastSignalBoostReset" = timezone('utc'::text, now())
        WHERE id = user_id;
        boost_count := 5;
    END IF;

    -- Check if user has boosts available
    IF boost_count > 0 THEN
        -- Check if user has already boosted this project
        IF NOT EXISTS (
            SELECT 1 FROM "SignalBoosts"
            WHERE "userId" = user_id AND "projectId" = project_id
        ) THEN
            -- Insert signal boost record
            INSERT INTO "SignalBoosts" ("userId", "projectId")
            VALUES (user_id, project_id);

            -- Decrement user's daily boosts
            UPDATE "Profile"
            SET "dailySignalBoosts" = "dailySignalBoosts" - 1
            WHERE id = user_id;

            -- Increment project's signal boost count
            UPDATE "Project"
            SET "signalBoosts" = COALESCE("signalBoosts", 0) + 1
            WHERE id = project_id;

            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users on the function
GRANT EXECUTE ON FUNCTION handle_signal_boost(UUID, UUID) TO authenticated;

-- Enable Row Level Security on the SignalBoosts table
ALTER TABLE "SignalBoosts" ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view their own signal boosts
CREATE POLICY "Users can view their own signal boosts" ON "SignalBoosts"
FOR SELECT TO authenticated
USING (userid = auth.uid());

-- Policy for INSERT: Users can create their own signal boosts
CREATE POLICY "Users can create their own signal boosts" ON "SignalBoosts"
FOR INSERT TO authenticated
WITH CHECK (userid = auth.uid());

-- Policy for DELETE: Users can delete their own signal boosts (optional, if boosts are reversible)
CREATE POLICY "Users can delete their own signal boosts" ON "SignalBoosts"
FOR DELETE TO authenticated
USING (userid = auth.uid());

-- Enable RLS on Profile table if not already enabled (this is usually done on Profile creation)
-- ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

-- Policy for UPDATE on Profile: Allow users to update their own dailySignalBoosts and lastSignalBoostReset
-- Assuming there's already a policy for updating other profile fields, this would be an addition
CREATE POLICY "Allow authenticated users to update their own signal boost counters" ON "Profile"
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid()); 