"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders, clearAuth, getAuthUser, getToken, AuthUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";

type Todos = {
  id: number;
  title: string;
  description: string | null;
  user_name: string | null;
  is_completed: any;
};

type LaravelPaginatedResponse = {
  data: Todos[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type TodosForm = {
  title: string;
  description: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const emptyForm: TodosForm = {
  title: "",
  description: "",
};

export default function TodoPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [todos, setTodos] = useState<Todos[]>([]);
  const [selectedTodo, setSelectedTodo] = useState<Todos | null>(null);

  const [form, setForm] = useState<TodosForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isEditMode = Boolean(selectedTodo);

  async function loadTodos(pageNumber = page) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(pageNumber),
        per_page: "10",
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(`${API_URL}/todos?${params.toString()}`, {
        headers: authHeaders(),
      });

      if (response.status === 401) {
        clearAuth();
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load Todos");
      }

      const result: LaravelPaginatedResponse = await response.json();
      setTodos(result.data);
      setPage(result.current_page);
      setLastPage(result.last_page);
      setTotal(result.total);
    } catch (error) {
      alert("Failed to load Todos");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setSelectedTodo(null);
    setForm(emptyForm);
    setErrors({});
    setIsFormModalOpen(true);
  }

  function openEditModal(todo: Todos) {
    setSelectedTodo(todo);
    setForm({
      title: todo.title ?? "",
      description: todo.description ?? "",
    });
    setErrors({});
    setIsFormModalOpen(true);
  }

  function openViewModal(vehicle: Todos) {
    setSelectedTodo(vehicle);
    setIsViewModalOpen(true);
  }

  function openDeleteModal(vehicle: Todos) {
    setSelectedTodo(vehicle);
    setIsDeleteModalOpen(true);
  }

  function closeModals() {
    setIsFormModalOpen(false);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedTodo(null);
    setForm(emptyForm);
    setErrors({});
  }

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
      setSaving(true);
      setErrors({});

      const url = isEditMode
        ? `${API_URL}/todos/${selectedTodo?.id}`
        : `${API_URL}/todos`;

      const method = isEditMode ? "PUT" : "POST";

      const payload = {
        ...form,
      };

      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.status === 401) {
        clearAuth();
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        alert("You are not authorized to manage todos.");
        return;
      }

      if (response.status === 422) {
        setErrors(result.errors ?? {});
        return;
      }

      if (!response.ok) {
        throw new Error(result.message ?? "Failed to save todo");
      }

      closeModals();
      await loadTodos(isEditMode ? page : 1);
    } catch (error) {
      alert("Failed to save todo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedTodo) return;

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/todos/${selectedTodo.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (response.status === 401) {
        clearAuth();
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        alert("You are not authorized to delete todo.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      closeModals();
      await loadTodos(page);
    } catch (error) {
      console.error(error);
      alert("Failed to delete todo");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(todo: Todos, status: boolean) {
    try {
      const response = await fetch(`${API_URL}/todos/${todo.id}/toggle`, {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...todo, is_completed: status}),
      });

      if (response.status === 401) {
        clearAuth();
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        alert("You are not authorized to update this todo.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      await loadTodos(page);
    } catch (error) {
      console.error(error);
      alert("Failed to update todo");
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      clearAuth();
      router.push("/login");
    }
}

  function getError(field: keyof TodosForm) {
    return errors[field]?.[0];
  }

  useEffect(() => {
    async function checkAuth() {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/user`, {
          headers: authHeaders(),
        });

        if (response.status === 401) {
          clearAuth();
          router.push("/login");
          return;
        }

        const result = await response.json();

        setAuthUser(result.data);
        localStorage.setItem("auth_user", JSON.stringify(result.data));

        await loadTodos(1);
      } catch (error) {
        clearAuth();
        router.push("/login");
      }
    }

    checkAuth();

  }, []);

 

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar user={authUser} onLogout={handleLogout} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mt-1 text-sm text-slate-600">
              Manage Todos. Total records: {total}
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            + Create Todos
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-white p-4 shadow">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search by Title..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadTodos(1);
              }}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              onClick={() => loadTodos(1)}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search
            </button>

            <button
              onClick={() => {
                setSearch("");
                setTimeout(() => loadTodos(1), 0);
              }}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Loading Todos...
                    </td>
                  </tr>
                ) : todos?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No Todos found.
                    </td>
                  </tr>
                ) : (
                  todos?.map((todo) => (
                    <tr
                      key={todo.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {todo.title}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {todo.description || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {todo.user_name || "-"}
                      </td>
                        <td className="px-4 py-3 text-slate-700">
                        {todo.is_completed === 0 ? (
                            <span className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                            Pending
                            </span>
                        ) : todo.is_completed === 1 ? (
                                <span className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                                Completed
                                </span>
                        ) : (
                            "-"
                        )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                        {todo.is_completed === 0 ? (
                            <button
                              onClick={() => changeStatus(todo, true)}
                              className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                            >
                              Mark as Completed
                            </button>
                        ) : (
                            <button
                              onClick={() => changeStatus(todo, false)}
                              className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Mark as Pending
                            </button>
                        )}
                        </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openViewModal(todo)}
                            className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            View
                          </button>

                          <button
                            onClick={() => openEditModal(todo)}
                            className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => openDeleteModal(todo)}
                            className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-600">
              Page {page} of {lastPage}
            </p>

            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => loadTodos(page - 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                disabled={page >= lastPage}
                onClick={() => loadTodos(page + 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {isFormModalOpen && (
        <Modal title={isEditMode ? "Update Todo" : "Register Todo"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                error={getError("title")}
                required
              />

              
              <Input
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                error={getError("description")}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeModals}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : isEditMode
                    ? "Update Todo"
                    : "Save Todo"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isViewModalOpen && selectedTodo && (
        <Modal title="Todo Details">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="Title" value={selectedTodo.title} />
            <Detail label="Description" value={selectedTodo.description} />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={closeModals}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {isDeleteModalOpen && selectedTodo && (
        <Modal title="Delete Todo">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete Todo{" "}
            <span className="font-semibold text-slate-900">
              {selectedTodo.title}
            </span>
            ?
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={closeModals}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={saving}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-xl font-bold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  name: keyof TodosForm;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  required?: boolean;
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
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}