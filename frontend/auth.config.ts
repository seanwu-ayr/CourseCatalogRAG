import type { NextAuthConfig } from 'next-auth';

 
export const authConfig = {
    providers: [],
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
            console.log(isLoggedIn)
            // 1. Specify protected and public routes
            const protectedRoutes = ['/']
            const publicRoutes = ['/auth/login', '/auth/signup']
            const path = nextUrl.pathname
            console.log("path: ", path)
            const isProtectedRoute = protectedRoutes.includes(path)
            const isPublicRoute = publicRoutes.includes(path)
            if (isProtectedRoute && !isLoggedIn) {
                return Response.redirect(new URL('/auth/login', nextUrl))
            } 
            if (isPublicRoute && isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) { // User is available during sign-in
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if(token){
                session.user.id = token.sub!
            }
            return session
        },
    },
} satisfies NextAuthConfig;