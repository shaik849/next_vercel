"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); // Clear errors

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/"); // Redirect to home after successful login
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSignin} className="bg-white p-6 rounded-lg shadow-md w-80">
        <h1 className="text-xl font-semibold mb-4">Sign In</h1>

        {error && <p className="text-red-500">{error}</p>}

        <input
          className="border p-2 w-full mb-3 rounded"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="border p-2 w-full mb-3 rounded"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" className="bg-blue-500 text-white w-full py-2 rounded">
          Sign In
        </button>
      </form>
    </div>
  );
}
