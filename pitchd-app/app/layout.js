import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "PitchD — Find your busking spot",
  description: "Busking rules and top pitch locations across European cities.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
