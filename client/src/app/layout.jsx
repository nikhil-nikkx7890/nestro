import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Nestro",
  description: "Admin Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                closeButton: "!left-auto !right-2 !top-2",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}