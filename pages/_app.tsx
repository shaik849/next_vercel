import "@/styles/globals.css";
import { SessionProvider, Session } from "next-auth/react"; // Import Session type
import type { AppProps } from "next/app";
import Navbar from "@/components/Navbar";

// Define the custom pageProps type with the correct Session type
interface CustomAppProps extends AppProps {
  pageProps: {
    session: Session; // Use the augmented Session type
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