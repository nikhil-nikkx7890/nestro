import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export const metadata = {
  title: "Nestro",
  description: "Furniture built for how you actually live.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
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
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}