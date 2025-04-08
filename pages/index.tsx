"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Define a type for Blog with author
type BlogWithAuthor = {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  author: {
    name: string | null;
  } | null;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [blogs, setBlogs] = useState<BlogWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Fetch blogs
  useEffect(() => {
    async function fetchBlogs() {
      if (!session) return;

      try {
        setLoading(true);
        const res = await fetch("/api/blogs");
        if (!res.ok) throw new Error("Failed to fetch blogs");

        const data = await res.json();
        console.log("Fetched Blogs Data:", data);

        if (Array.isArray(data.blogs)) {
          setBlogs(data.blogs);
        } else {
          console.error("Unexpected API response format:", data);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, [session]);

  if (status === "loading" || loading) return <p className="text-center mt-10 text-lg">Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {session?.user?.name || "Guest"}!</h1>

      {session?.user?.role === "ADMIN" && (
        <button
          onClick={() => router.push("/add-blog")}
          className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
        >
          Add Blog
        </button>
      )}

      <h2 className="text-xl font-semibold mt-4">Blogs ({blogs.length})</h2>

      {blogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
          {blogs.map((blog) => (
            <Link href={`/blog/${blog.id}`} key={blog.id} passHref>
              <div className="border rounded-lg shadow-md bg-white overflow-hidden cursor-pointer hover:shadow-lg transition">
              <Image
  src={blog.image?.startsWith("/") ? blog.image : "/fallback.jpg"}
  alt={blog.title}
  width={800}
  height={300}
  className="w-full h-40 object-cover"
/>
                <div className="p-4">
                  <h3 className="font-bold text-lg">{blog.title}</h3>
                  <p className="text-gray-600">{blog.description.substring(0, 80)}...</p>
                  <p className="text-sm text-gray-500 mt-2">By {blog.author?.name || "Unknown"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 mt-4">No blogs found.</p>
      )}
    </div>
  );
}
