-- Custom SQL migration file, put your code below! --
CREATE POLICY "users_select_own_conversations" ON "conversations"
    FOR SELECT
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "users_insert_own_conversations" ON "conversations"
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "users_delete_own_conversations" ON "conversations"
    FOR DELETE
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "users_update_own_conversations" ON "conversations"
    FOR UPDATE
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);