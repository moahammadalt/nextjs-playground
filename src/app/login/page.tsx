import { createClient } from '@/utils/supabase/server'
import { login, signup } from './actions';

const supabase = await createClient()

export default async function LoginPage() {
  console.time('getUser LoginPage')
  const { data: { user } } = await supabase.auth.getUser()
  console.timeEnd('getUser LoginPage')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <form style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {user ? <p>Logged in as {user.email} id {user.id}</p> : <p>Not logged in</p>}

        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />
        <br />
        <button formAction={login}>Log in</button>
        <br />
        <button formAction={signup}>Sign up</button>
      </form>
    </div>
  );
}
