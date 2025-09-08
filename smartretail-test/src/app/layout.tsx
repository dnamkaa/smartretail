import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";

export const metadata = {
  title: "SmartRetail Test Dashboard",
  description: "Testing Auth Service Integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}