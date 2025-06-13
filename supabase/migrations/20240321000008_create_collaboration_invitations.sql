-- Create CollaborationInvitations table
CREATE TABLE IF NOT EXISTS "CollaborationInvitations" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    "inviterId" UUID NOT NULL REFERENCES "Profile"(id) ON DELETE CASCADE,
    "inviteeId" UUID NOT NULL REFERENCES "Profile"(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE ("projectId", "inviteeId")
);

-- Enable Row Level Security for CollaborationInvitations
ALTER TABLE "CollaborationInvitations" ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view invitations where they are the inviter or invitee
CREATE POLICY "Users can view their collaboration invitations" ON "CollaborationInvitations"
FOR SELECT TO authenticated
USING ("inviterId" = auth.uid() OR "inviteeId" = auth.uid());

-- Policy for INSERT: Only the inviter (project creator) can send invitations
-- We will add a check here in the frontend to ensure the inviter is the project creator.
CREATE POLICY "Project creators can send collaboration invitations" ON "CollaborationInvitations"
FOR INSERT TO authenticated
WITH CHECK ("inviterId" = auth.uid());

-- Policy for UPDATE: Only the invitee can accept/reject their own invitation
CREATE POLICY "Invitee can update their collaboration invitation status" ON "CollaborationInvitations"
FOR UPDATE TO authenticated
USING ("inviteeId" = auth.uid())
WITH CHECK ("inviteeId" = auth.uid()); 