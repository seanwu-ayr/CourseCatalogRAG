'use client';

import { Button } from './button';
import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation'
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';


export default function RegisterForm() {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConf, setPasswordConf] = useState('');
  const [errorMessage, setMessage] = useState('');

  const router = useRouter()
  const handleRegister = async (e:any) => {
    e.preventDefault();

    if(password != passwordConf)
    {
        setMessage("Inconsistent Password, check again ...")
        return
    }

    const res = await fetch('http://localhost:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(data.message);
      localStorage.setItem("justRegistered", "true")
      router.push('/auth/login');
      
    } else {
      setMessage(data.error);
      localStorage.setItem("justRegistered", "false")
    }
  };

  return (
    <>
        <form onSubmit={handleRegister} className="space-y-3">
        <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
          <h1 className={`mb-3 text-2xl text-center`}>
            Register with US!
          </h1>
          <div className="w-full">
            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
              </div>
            </div>
            <div className="mt-4">
              <label
                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                
              </div>
              <div className="mt-4">
                <label
                    className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                    htmlFor="password"
                >
                    Confirm Password
                </label>
                <div className="relative">
                    <input
                    className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                    id="passwordConf"
                    type="password"
                    name="passwordConf"
                    placeholder="Enter password again"
                    onChange={(e) => setPasswordConf(e.target.value)}
                    required
                    />
                    
                </div>
              </div>
            </div>
          </div>
          <Button className="mt-4 w-full">
            Register <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
          </Button>
          <div 
              className="flex h-8 items-end space-x-1"
              aria-live="polite"
              aria-atomic="true"
          >
            {/* Add form errors here */}
            {errorMessage && (
              <>
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">{errorMessage}</p>
              </>
            )}
          </div>
          <div className="flex justify-between mt-2">
            <a href="/auth/login" className="text-sm text-blue-600 hover:underline">
              Have An Account? Log in!
            </a>
          </div>
        </div>
      </form>
    </>
    
    
  );
}