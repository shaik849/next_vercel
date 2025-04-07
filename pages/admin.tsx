import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import { Session } from "next-auth"; // ✅ Import Session type

export default function AdminPage({ userRole }: { userRole: string }) {
  if (userRole !== "admin") {
    return <p>Access Denied</p>;
  }

  return <h1>Admin Dashboard</h1>;
}

// Protect page using getServerSideProps
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session: Session | null = await getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session || session.user.role !== "ADMIN") {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }

  return {
    props: { userRole: session.user.role },
  };
}
