-- Enable Row Level Security on the Project table (if not already enabled)
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

-- Policy for UPDATE: Allow authenticated users to update the signalBoosts column on Project
CREATE POLICY "Allow authenticated users to update signalBoosts on projects" ON "Project"
FOR UPDATE TO authenticated
USING (true) -- Allow update on any project for now, will refine if needed
WITH CHECK (true); -- No specific checks needed for signalBoosts for now 