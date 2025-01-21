-- Custom SQL migration file, put your code below! ---- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION create_user_on_auth_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (user_id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Attach the function as a trigger on the auth.users table
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_user_on_auth_signup();