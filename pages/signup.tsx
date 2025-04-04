"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(""); // Clear previous errors

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Signup successful! Redirecting to Signin.");
      router.push("/signin"); // Redirect to Signin page
    } else {
      setError(data.message || "Something went wrong");
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSignup} className="bg-white p-6 rounded-lg shadow-md w-80">
        <h1 className="text-xl font-semibold mb-4">Sign Up</h1>

        {error && <p className="text-red-500">{error}</p>}

        <input
          className="border p-2 w-full mb-3 rounded"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          required
        />
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
          Sign Up
        </button>
      </form>
    </div>
  );
}
