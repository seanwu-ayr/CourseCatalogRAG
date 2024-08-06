import type { NextAuthConfig } from 'next-auth';
import facebook from 'next-auth/providers/facebook';
import github from 'next-auth/providers/github';
import google from 'next-auth/providers/google';
import linkedin from 'next-auth/providers/linkedin';
 
export const authConfig = {
    providers:[
        github,
        google,
        facebook,
        linkedin
    ],
    pages: {
        signIn: '/auth/login',
        signOut: '/auth/signout',
        error: '/auth/error', // Error code passed in query string as ?error=
        verifyRequest: '/auth/verify-request', // (used for check email message)
        newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                    return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
} satisfies NextAuthConfig;