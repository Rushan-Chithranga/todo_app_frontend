"use client";

import { AuthUser } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type NavbarProps = {
  user: AuthUser | null;
  onLogout: () => void;
};

export default function Navbar({
  user,
  onLogout,
}: NavbarProps) {


  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm mb-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Todos Management System
          </h1>
          <p className="text-sm text-slate-500">Dashboard / Todos</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {user && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}