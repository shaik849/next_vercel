"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">My Blog</Link>

      <div className="flex gap-4">
        {session ? (
          <>
            <span>Welcome, {session.user?.name} ({session.user?.role})</span>
            <button
              onClick={() => signOut()}
              className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/signin" className="bg-green-500 hover:bg-green-700 px-4 py-2 rounded">Sign In</Link>
            <Link href="/signup" className="bg-yellow-500 hover:bg-yellow-700 px-4 py-2 rounded">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
