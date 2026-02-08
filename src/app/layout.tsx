import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casa Turner Super Bowl Squares",
  description: "Casa Turner Super Bowl Squares — Interactive NFL Super Bowl Squares game",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full min-h-[100dvh] antialiased text-white touch-manipulation relative">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
