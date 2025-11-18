// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "User Page",
  description: "Simple Next.js test app",
};

//  this MUST be the default export and MUST be a React component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
