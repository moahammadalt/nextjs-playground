-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION public.create_user_on_auth_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_user_on_auth_signup();