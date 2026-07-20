import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { NavProvider } from "@/contexts/NavContext"
import ClientLayout from "./ClientLayout"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "SINEDA",
  description: "Sistem Edukasi Aman berbasis Culturally Responsive MOOC",
  icons: [{ rel: "icon", url: "/logo_sineda.png" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={inter.className}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </head>
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <AuthProvider>
          <NavProvider>
            <ClientLayout>{children}</ClientLayout>
          </NavProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
