import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3f6] px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-xl font-bold tracking-tight text-[#4f3448]">
          AssetFlow
        </div>
        <Outlet />
      </div>
    </main>
  );
}
