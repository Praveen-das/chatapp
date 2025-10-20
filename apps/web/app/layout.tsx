import "./styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Provider from "./providers";
import { APP_NAME } from "config/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME} is a fast, secure, and reliable messaging app that makes conversations effortless. Stay connected with friends, family, and teams through instant chat, media sharing, and real-time notifications — all in a simple, modern design. With Chatvia, communication travels smoothly, wherever you are.`,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{/* <script src="https://unpkg.com/react-scan/dist/auto.global.js" /> */}</head>
      <body className={inter.className}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
