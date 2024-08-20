"use client";
 
import { Chatpage } from "@/components/chatpage"
import { FormEvent } from 'react'
import LoginForm from '@/components/ui/login-form';
import Image from 'next/image'

export default function LoginPage() {
  //const router = useRouter()
 
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
 
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')
 
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
 
    if (response.ok) {
      //router.push('/profile')
    } else {
      // Handle errors
    }
  }
 
  return (
    <>
      <Image
        src="/SCU-EXP.webp"
        alt="SCU BG"
        className="opacity-10"
        sizes="100vw"
        fill
      />

      <main className="flex items-center justify-center md:h-screen">
        <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
          <div className="flex h-20 w-full items-end rounded-lg bg-red-700 p-3 md:h-36">
            <div className="w-32 text-white md:w-36">
              
            </div>
          </div>
          <LoginForm />
        </div>
      </main>
        
    </>
   
    
  );
}
