import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email / NIM", type: "text", placeholder: "Email atau NIM" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email/NIM dan password wajib diisi');
        }

        await connectToDatabase();
        
        const identifier = credentials.email.trim();
        const query = {
          $or: [
            { nim_nidn: identifier },
            { email: identifier }
          ]
        };
        
        const user = await User.findOne(query);
        if (!user) {
          throw new Error('Akun tidak terdaftar');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Password salah');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
          konsentrasi: user.konsentrasi || "Manajemen SDM (Default)", // Fallback SIAM
          program_studi: user.program_studi || "Manajemen (S1)",
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nama_lengkap = user.nama_lengkap;
        token.isFirstLogin = user.isFirstLogin;
        token.konsentrasi = user.konsentrasi;
        token.program_studi = user.program_studi;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.nama_lengkap = token.nama_lengkap;
        session.user.isFirstLogin = token.isFirstLogin;
        session.user.konsentrasi = token.konsentrasi;
        session.user.program_studi = token.program_studi;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
