'user server'
import { Chatpage } from "@/components/chatpage"
import { FormEvent } from 'react'
import { signOut } from "@/auth"
export default async function SignOutPage() {
  //const router = useRouter()
 
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            
          </div>
        </div>
      </div>
    </main>
  );
}
