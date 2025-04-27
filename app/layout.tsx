import { Titillium_Web } from "next/font/google";
import "./globals.css";
import Warnings from "./components/warnings";
import { assistantId } from "./assistant-config";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";

const titilliumWeb = Titillium_Web({
  weight: ["200", "300", "400", "600", "700", "900"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Natural Hazards Research Australia",
  description:
    "A conversational assistant for Natural Hazards Research Australia",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={titilliumWeb.className}>
        <ThemeProvider>
          <header className="siteHeader">
            <div className="max-w-[900px] mx-auto flex justify-between items-center">
              <h1>Natural Hazards Research Australia</h1>
              <ThemeToggle />
            </div>
          </header>
          <main className="mainContent">
            {assistantId ? children : <Warnings />}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
