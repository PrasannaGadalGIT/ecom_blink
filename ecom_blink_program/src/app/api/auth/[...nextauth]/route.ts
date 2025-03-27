import NextAuth from 'next-auth'
import GoogleProvider from "next-auth/providers/google"
// import CredentialsProvider from "next-auth/providers/credentials";
const handler = NextAuth({
  debug: true,
  providers: [
    // OAuth authentication providers...
  
    GoogleProvider({
      clientId : process.env.AUTH_GOOGLE_ID || "",
      clientSecret : process.env.AUTH_GOOGLE_SECRET || "",
    }),
  
  ],
  
})

export {handler as GET, handler as POST}


