import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Nestro",
  description: "Admin Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}