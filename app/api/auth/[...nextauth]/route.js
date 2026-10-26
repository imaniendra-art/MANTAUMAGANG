import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import ImpersonationToken from "@/models/ImpersonationToken";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email / NIM / Username", type: "text", placeholder: "Email, NIM, atau Username" },
        password: { label: "Password", type: "password" },
        magicToken: { type: "hidden" },
        impersonateToken: { type: "hidden" }
      },
      async authorize(credentials) {
        await connectToDatabase();

        // Handle Admin Impersonation (Login Sebagai DPL / Revert ke Admin)
        if (credentials?.impersonateToken) {
          const impDoc = await ImpersonationToken.findOne({ token: credentials.impersonateToken });
          if (!impDoc || (impDoc.expiresAt && impDoc.expiresAt < new Date())) {
            throw new Error('Token impersonasi tidak valid atau telah kadaluarsa');
          }

          // Consume token agar hanya bisa dipakai sekali
          await ImpersonationToken.deleteOne({ _id: impDoc._id });

          const targetUser = await User.findById(impDoc.target_user_id);
          if (!targetUser) {
            throw new Error('Pengguna target tidak ditemukan');
          }

          const isRevert = impDoc.type === 'revert';

          return {
            id: targetUser._id.toString(),
            email: targetUser.email,
            nama_lengkap: targetUser.nama_lengkap,
            nim_nidn: targetUser.nim_nidn,
            nidn: targetUser.nidn,
            role: targetUser.role,
            isFirstLogin: targetUser.isFirstLogin,
            konsentrasi: targetUser.konsentrasi || "Manajemen SDM (Default)",
            program_studi: targetUser.program_studi || "Manajemen (S1)",
            impersonatedBy: isRevert ? null : {
              id: impDoc.admin_id.toString(),
              nama_lengkap: impDoc.admin_name,
              role: impDoc.admin_role
            }
          };
        }

        // Handle Magic Token for Mentor Login
        if (credentials?.magicToken) {
          const user = await User.findOne({ magic_token: credentials.magicToken, role: 'mentor' });
          if (!user) throw new Error('Link akses tidak valid atau sudah kadaluarsa');
          
          return {
            id: user._id.toString(),
            email: user.email,
            nama_lengkap: user.nama_lengkap,
            nim_nidn: user.nim_nidn,
            nidn: user.nidn,
            role: user.role,
            isFirstLogin: user.isFirstLogin,
            konsentrasi: user.konsentrasi || "Manajemen SDM (Default)",
            program_studi: user.program_studi || "Manajemen (S1)",
          };
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email/NIM dan password wajib diisi');
        }
        
        const identifier = credentials.email.trim();
        const lower = identifier.toLowerCase();
        const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const caseInsensitiveRegex = new RegExp(`^${escaped}$`, 'i');

        const orConditions = [
          { email: caseInsensitiveRegex },
          { nim_nidn: caseInsensitiveRegex },
          { nidn: caseInsensitiveRegex },
          { nomor_hp: identifier }
        ];

        // Dukungan alias username cepat untuk pengujian (prioritaskan akun demo resmi)
        if (lower === 'admin' || lower === 'admin_prodi' || lower === 'superadmin' || lower === 'super_admin') {
          orConditions.unshift({ email: 'admin@stimi.ac.id' }, { email: 'admin@mantaumagang.com' });
        } else if (lower === 'dpl') {
          orConditions.unshift({ email: 'dpl@stimi.ac.id' });
        } else if (lower === 'mahasiswa') {
          orConditions.unshift({ email: 'mahasiswa@stimi.ac.id' });
        }

        const user = await User.findOne({ $or: orConditions });
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
          nim_nidn: user.nim_nidn,
          nidn: user.nidn,
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
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nama_lengkap = user.nama_lengkap;
        token.email = user.email;
        token.nomor_hp = user.nomor_hp;
        token.nim_nidn = user.nim_nidn;
        token.nidn = user.nidn;
        token.isFirstLogin = user.isFirstLogin;
        token.konsentrasi = user.konsentrasi;
        token.program_studi = user.program_studi;
        token.impersonatedBy = user.impersonatedBy || null;
      }

      // Validasi real-time: Cek apakah user masih ada di database
      if (token?.id) {
        try {
          await connectToDatabase();
          const existingUser = await User.findById(token.id).lean();
          
          if (!existingUser) {
            // User sudah dihapus, tandai token tidak valid
            token.error = "UserDeleted";
            return token;
          }

          // Opsional: Perbarui data token dengan data terbaru di database
          token.role = existingUser.role;
          token.nama_lengkap = existingUser.nama_lengkap;
          token.email = existingUser.email;
          token.nomor_hp = existingUser.nomor_hp;
          token.nim_nidn = existingUser.nim_nidn;
          token.nidn = existingUser.nidn;
          token.isFirstLogin = existingUser.isFirstLogin;
          token.konsentrasi = existingUser.konsentrasi || token.konsentrasi;
          token.program_studi = existingUser.program_studi || token.program_studi;
        } catch (error) {
          console.error("Error validasi session:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Jika token ditandai sudah dihapus, kita set session error
      if (token?.error === "UserDeleted") {
        session.error = "UserDeleted";
        session.user = null;
        return session;
      }

      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.nama_lengkap = token.nama_lengkap;
        session.user.email = token.email;
        session.user.nomor_hp = token.nomor_hp;
        session.user.nim_nidn = token.nim_nidn;
        session.user.nidn = token.nidn;
        session.user.isFirstLogin = token.isFirstLogin;
        session.user.konsentrasi = token.konsentrasi;
        session.user.program_studi = token.program_studi;
        session.user.impersonatedBy = token.impersonatedBy || null;
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
