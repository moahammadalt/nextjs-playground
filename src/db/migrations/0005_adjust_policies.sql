-- Custom SQL migration file, put your code below! --
-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own_conversations" ON "conversations";
DROP POLICY IF EXISTS "users_insert_own_conversations" ON "conversations";
DROP POLICY IF EXISTS "users_delete_own_conversations" ON "conversations";
DROP POLICY IF EXISTS "users_update_own_conversations" ON "conversations";

-- Create new policies that join with users table
CREATE POLICY "users_select_own_conversations" ON "conversations"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = conversations.user_id
            AND users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "users_insert_own_conversations" ON "conversations"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = conversations.user_id
            AND users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "users_delete_own_conversations" ON "conversations"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = conversations.user_id
            AND users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "users_update_own_conversations" ON "conversations"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = conversations.user_id
            AND users.user_id = auth.uid()::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = conversations.user_id
            AND users.user_id = auth.uid()::uuid
        )
    );