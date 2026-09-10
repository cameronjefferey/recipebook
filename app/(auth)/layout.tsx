import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Wordmark />
      <div className="mt-8">{children}</div>
    </main>
  );
}
