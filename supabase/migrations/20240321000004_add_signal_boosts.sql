-- Create a table to track signal boosts
CREATE TABLE IF NOT EXISTS "SignalBoosts" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userId UUID REFERENCES "Profile"(id) ON DELETE CASCADE,
    projectId UUID REFERENCES "Project"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(userId, projectId)
);

-- Add a column to track daily signal boost count in Profile table
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "dailySignalBoosts" INTEGER DEFAULT 5;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "lastSignalBoostReset" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create a function to reset daily signal boosts
CREATE OR REPLACE FUNCTION reset_daily_signal_boosts()
RETURNS void AS $$
BEGIN
    UPDATE "Profile"
    SET "dailySignalBoosts" = 5,
        "lastSignalBoostReset" = timezone('utc'::text, now())
    WHERE "lastSignalBoostReset" < timezone('utc'::text, now()) - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle signal boost
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
$$ LANGUAGE plpgsql; 