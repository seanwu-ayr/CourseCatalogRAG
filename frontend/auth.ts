import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/lib/definitions';
import type { Provider } from "next-auth/providers"
import bcrypt from 'bcrypt';
import GitHub from "next-auth/providers/github"
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import LinkedIn from 'next-auth/providers/linkedin';

const providers: Provider[] = [
  Facebook,
  GitHub,
  Google,
  LinkedIn,
  Credentials({
      async authorize(credentials) {
          const parsedCredentials = z
              .object({ email: z.string().email(), password: z.string().min(6) })
              .safeParse(credentials);

              if (parsedCredentials.success) {
                  const { email, password } = parsedCredentials.data;
                  const user = await getUser(email);
                  if (!user) return null;

                  const passwordsMatch = await bcrypt.compare(password, user.password);

                  if (passwordsMatch) return user;
              }
              
              console.log('Invalid credentials');
              return null;
      },
  }),
]
// fetch user from Django Backend 
async function getUser(email: string): Promise<User | undefined> {
    try {
      const user = await fetch('http://localhost:8000/api/users/login/',{
        method: "POST",
        headers: {
          'Content-Type' : 'application/json',
        },
        body: JSON.stringify({
          username: email
        })
      })
      const data = user.json()
      console.log(data)
      return data
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to fetch user.');
    }
  }


// use next_auth.js API to perform user validation with React and Next 
export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers:providers,
});

export const providerMap = providers.map((provider) => {
  if (typeof provider === "function") {
    const providerData = provider()
    return { id: providerData.id, name: providerData.name }
  } else {
    return { id: provider.id, name: provider.name }
  }
})