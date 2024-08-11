import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/lib/definitions';
import bcrypt from 'bcrypt';

// fetch user from Django Backend 
async function getUser(email: string): Promise<User | undefined> {
    try {
      const user = await fetch('http://localhost:8000/api/users/logi/',{
        method: "POST",
        headers: {
          'Content-Type' : 'application/json',
        },
        body: JSON.stringify({
          username: email
        })
      })
      const data = user.json()
      return data
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to fetch user.');
    }
  }


// use next_auth.js API to perform user validation with React and Next 
export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers:[
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
    ],
});