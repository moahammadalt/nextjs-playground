'use client';

import { useRouter } from 'next/navigation';
import { login, signup } from './actions';

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(formData: FormData) {
    const result = await login(formData);
    if (result.success) {
      router.push('/');
      router.refresh();
    } else if (result.error) {
      // You might want to add state to show this error in the UI
      console.error(result.error);
    }
  }

  async function handleSignup(formData: FormData) {
    const result = await signup(formData);
    if (result.success) {
      router.push('/');
      router.refresh();
    } else if (result.error) {
      // You might want to add state to show this error in the UI
      console.error('error handleSignup', result.error);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <form style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <label htmlFor="email">Email:</label>
        <input className="text-gray-900" id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <input className="text-gray-900" id="password" name="password" type="password" required />
        <br />
        <button type="submit" formAction={handleLogin}>Log in</button>
        <br />
        <button type="submit" formAction={handleSignup}>Sign up</button>
      </form>
    </div>
  );
}