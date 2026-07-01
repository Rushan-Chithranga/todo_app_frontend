"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrors({});

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (response.status === 422) {
        setErrors(result.errors ?? {});
        return;
      }

      if (!response.ok) {
        alert(result.message ?? "Registration failed");
        return;
      }

      saveAuth(result.token, result.data);

      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function getError(field: string) {
    return errors[field]?.[0];
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-slate-900">Register</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={getError("name")}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={getError("email")}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={getError("password")}
          />

          <Input
            label="Confirm Password"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={handleChange}
            error={getError("password_confirmation")}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-semibold text-blue-600 hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </main>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}