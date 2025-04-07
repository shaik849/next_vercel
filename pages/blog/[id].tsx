import { GetServerSideProps } from "next";
import { prisma } from "../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { useRouter } from "next/router";
import { useState } from "react";
import Image from "next/image";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;

  const session = await getServerSession(context.req, context.res, authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const blog = await prisma.blog.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      image: true,
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!blog) {
    return { notFound: true };
  }

  return {
    props: { blog, isAdmin },
  };
};

type BlogPageProps = {
  blog: {
    id: string;
    title: string;
    content: string;
    image: string;
    author: {
      id: string;
      name: string;
    } | null;
  };
  isAdmin: boolean;
};

export default function BlogPage({ blog, isAdmin }: BlogPageProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newTitle, setNewTitle] = useState(blog.title);
  const [newContent, setNewContent] = useState(blog.content);

  const handleUpdate = async () => {
    if (newTitle === blog.title && newContent === blog.content) {
      setIsUpdating(false);
      return;
    }

    const res = await fetch(`/api/blog/${blog.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });

    if (res.ok) {
      router.reload();
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm(`Are you sure you want to delete the blog: "${blog.title}"?`);
    if (!confirmDelete) return;
  
    const res = await fetch(`/api/blog/${blog.id}`, {
      method: "DELETE",
    });
  
    if (res.ok) {
      router.push("/");
    } else {
      alert("Failed to delete the blog.");
    }
  };
  

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {!isUpdating ? (
        <>
          <h1 className="text-3xl font-bold mb-2">{blog.title}</h1>
          <p className="text-gray-600 mb-4">
            by <span className="font-semibold">{blog.author?.name || "Unknown"}</span>
          </p>
          <Image
  src={blog.image}
  alt="Blog Image"
  width={800}
  height={300}
  className="w-full h-40 object-cover"
/>
          <div className="prose whitespace-pre-wrap">{blog.content}</div>
          {isAdmin && (
            <div className="mt-6 flex gap-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => setIsUpdating(true)}
              >
                Update
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Title"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full border p-2 rounded h-40"
            placeholder="Content"
          />
          <div className="flex gap-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={handleUpdate}
            >
              Save
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded"
              onClick={() => setIsUpdating(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}