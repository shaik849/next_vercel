import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { AppProps } from "next/app";
import Navbar from "@/components/Navbar";

interface CustomAppProps extends AppProps {
  pageProps: {
    session: Session | null;
  };
}

export default function App({ Component, pageProps: { session, ...pageProps } }: CustomAppProps) {
  return (
    <SessionProvider session={session}>
      <Navbar />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
