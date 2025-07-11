'use client';

import { useState } from 'react';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SignIn = () => {
 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const router = useRouter();

  const handleSignIn = async () => {
    setError('');
    setSuccess('');

    if (!password) {
      setError('Password are required!');
      return;
    }

    try {
      const res = await signInWithEmailAndPassword("kadenuga@uoguelph.ca", password);

      if (!res || !res.user) {
        setError('Error signing you in. Please try again.');
        return;
      }

      console.log('User signed in:', res.user);
      setSuccess('User signed in.');
      sessionStorage.setItem('user', 'true');
     
      setPassword('');
      router.push('/ask');
    } catch (e) {
      console.error('Sign-in error:', e);
      setError((e).message || 'Something went wrong during sign-in.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-600">
      <div className="bg-red-500 p-10 rounded-lg shadow-xl w-96">
        <h6 className=" font-bold text-white mb-6 text-center">
          Only the owner is allowed into this page.
          <br />
          If you are the owner, enter your password now.
        </h6>

      

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 bg-white shadow-md rounded outline-none focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        {error && <h6 className="text-white mb-3 text-center">{error}</h6>}
        {success && <h6 className="text-white mb-3 text-center">{success}</h6>}

        <div className="flex flex-col space-y-3 items-center">
          <button
            onClick={handleSignIn}
            className="w-full py-2 text-white bg-red-700 font-semibold rounded shadow-md hover:bg-red-900 transition-colors"
          >
            Log in
          </button>

          <Link
            href="/"
            className="w-full text-center py-2 text-white bg-red-700 font-semibold rounded shadow-md hover:bg-red-900 transition-colors"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
