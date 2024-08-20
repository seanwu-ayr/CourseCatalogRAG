'use client';

import { Button } from './button';
import { useState, useActionState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { authenticate } from '@/lib/actions';
import {
  AtSymbolIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { signIn, auth, providerMap } from "@/auth"
import { boolean } from 'zod';


export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useFormState(
    authenticate,
    undefined,
  );
  
  const [register_state, setRegisterState] = useState(false)

  useEffect(()=>{
    let getLocalReg = localStorage.getItem("justRegistered")
    console.log(getLocalReg)
    let registered = getLocalReg === "true"
    console.log("registered: " + registered)
    setRegisterState(registered)
    setTimeout(()=>{
      //setRegisterState(false);
      localStorage.setItem("justRegistered", "false")
    }, 1000);
  }, [])

  return (
    
    <>
      <form action={formAction} className="space-y-3">
        <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
          <h1 className={`mb-3 text-2xl`}>
            Please log in to continue.
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
                  required
                  minLength={6}
                />
                
              </div>
            </div>
          </div>
          <Button className="mt-4 w-full" aria-disabled={isPending}>
            Log in <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
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
            {register_state && (
              <>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-500">Successfully Registered!</p>
              </>
            )}
          </div>
          <div className="flex justify-between mt-2">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </a>
            <a href="/auth/signup" className="text-sm text-blue-600 hover:underline">
              Register
            </a>
          </div>
        </div>
      </form>
    
    </>
    
    
  );
}

