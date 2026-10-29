
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
    "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";

function Badge({ children, color = "gray" }) {
    const colors = {
        green: "bg-emerald-50 text-emerald-700",
        red: "bg-rose-50 text-rose-700",
        blue: "bg-sky-50 text-sky-700",
        purple: "bg-violet-50 text-violet-700",
        gray: "bg-stone-100 text-stone-600",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[color] || colors.gray
                }`}
        >
            {children}
        </span>
    );
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function AdminPage() {
    const router = useRouter();

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/admin/users", {
                cache: "no-store",
            });

            const data = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (response.status === 403) {
                setError("You do not have permission to access the Admin area.");
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || "Could not load users.");
            }

            setUsers(
                Array.isArray(data.users)
                    ? data.users.filter((user) => user.role !== "admin")
                    : []
            );
        } catch (err) {
            setError(err.message || "Could not load users.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => {
            const matchesSearch = [
                user.name,
                user.email,
                user.role,
                String(user.id),
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));

            const active = Boolean(user.is_active);

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && active) ||
                (statusFilter === "inactive" && !active);

            return matchesSearch && matchesStatus;
        });
    }, [users, search, statusFilter]);

    const activeCount = users.filter(
        (user) => Boolean(user.is_active)
    ).length;

    const inactiveCount = users.length - activeCount;

    async function toggleStatus(user) {
        const nextStatus = !Boolean(user.is_active);
        const action = nextStatus ? "activate" : "deactivate";

        if (
            !window.confirm(
                `Are you sure you want to ${action} ${user.name}'s account?`
            )
        ) {
            return;
        }

        setUpdatingId(String(user.id));
        setError("");
        setNotice("");

        try {
            const response = await fetch(
                `/api/admin/users/${encodeURIComponent(user.id)}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        is_active: nextStatus,
                    }),
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || "Could not update account status.");
            }

            setUsers((current) =>
                current.map((item) =>
                    String(item.id) === String(data.user.id)
                        ? { ...item, ...data.user }
                        : item
                )
            );

            setNotice(data.message || "Account status updated.");
        } catch (err) {
            setError(err.message || "Could not update account status.");
        } finally {
            setUpdatingId(null);
        }
    }

    const roleLabel = (role) =>
        ({
            admin: "Admin",
            project_owner: "Project Owner",
            project_member: "Project Member",
        })[role] || role || "Unknown";

    const roleColor = (role) =>
        ({
            admin: "purple",
            project_owner: "blue",
            project_member: "gray",
        })[role] || "gray";

    return (
        <main className="min-h-screen bg-stone-50 text-stone-800">
            <header className="border-b border-stone-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                            WanderNest Administration
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight">
                            User management
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            View registered accounts and manage account access.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadUsers}
                        disabled={loading}
                        className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "Refresh users"}
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-6 px-5 py-7 sm:px-8">
                <section className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Registered users" value={users.length} />
                    <StatCard label="Active accounts" value={activeCount} />
                    <StatCard label="Inactive accounts" value={inactiveCount} />
                </section>

                {error && (
                    <div
                        role="alert"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                        {error}
                        {error.includes("permission") && (
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="ml-2 font-semibold underline"
                            >
                                Return to dashboard
                            </button>
                        )}
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    >
                        {notice}
                    </div>
                )}

                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-stone-100 p-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-semibold text-stone-900">
                                Registered accounts
                            </h2>
                            <p className="mt-1 text-sm text-stone-500">
                                {filteredUsers.length} of {users.length} users
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name, email, role, ID..."
                                aria-label="Search users"
                                className={`${inputClass} sm:w-72`}
                            />

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                aria-label="Filter by account status"
                                className={inputClass}
                            >
                                <option value="all">All accounts</option>
                                <option value="active">Active only</option>
                                <option value="inactive">Inactive only</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-sm text-stone-500">
                            Loading registered users...
                        </div>
                    ) : error && users.length === 0 ? (
                        <div className="p-12 text-center text-sm text-stone-500">
                            User information could not be displayed.
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-sm text-stone-500">
                            No users match your search.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">User</th>
                                        <th className="px-5 py-3 font-semibold">Role</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Joined</th>
                                        <th className="px-5 py-3 text-right font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-stone-100">
                                    {filteredUsers.map((user) => {
                                        const active = Boolean(user.is_active);
                                        const updating =
                                            updatingId === String(user.id);

                                        return (
                                            <tr
                                                key={user.id}
                                                className="transition hover:bg-stone-50/70"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-800">
                                                            {(user.name || "?")
                                                                .trim()
                                                                .slice(0, 1)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-stone-800">
                                                                {user.name}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-stone-500">
                                                                {user.email}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-stone-400">
                                                                ID: {user.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <Badge color={roleColor(user.role)}>
                                                        {roleLabel(user.role)}
                                                    </Badge>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <Badge color={active ? "green" : "red"}>
                                                        {active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-stone-500">
                                                    {formatDate(user.created_at)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <select
                                                        value={user.role}
                                                        disabled={
                                                            updating ||
                                                            !user.is_active ||
                                                            user.role === "admin"
                                                        }
                                                        onChange={async (event) => {
                                                            const role = event.target.value;

                                                            if (
                                                                !window.confirm(
                                                                    `Change ${user.name}'s role to ${role === "project_owner"
                                                                        ? "Project Owner"
                                                                        : "Project Member"
                                                                    }?`
                                                                )
                                                            ) {
                                                                return;
                                                            }

                                                            setUpdatingId(String(user.id));
                                                            setError("");
                                                            setNotice("");

                                                            try {
                                                                const response = await fetch(
                                                                    `/api/admin/users/${encodeURIComponent(user.id)}`,
                                                                    {
                                                                        method: "PUT",
                                                                        headers: {
                                                                            "Content-Type": "application/json",
                                                                        },
                                                                        body: JSON.stringify({ role }),
                                                                    }
                                                                );

                                                                const data = await response.json();

                                                                if (!response.ok) {
                                                                    throw new Error(
                                                                        data.message || "Could not update role."
                                                                    );
                                                                }

                                                                setUsers((current) =>
                                                                    current.map((item) =>
                                                                        String(item.id) === String(data.user.id)
                                                                            ? { ...item, ...data.user }
                                                                            : item
                                                                    )
                                                                );

                                                                setNotice(data.message);
                                                            } catch (err) {
                                                                setError(err.message || "Could not update role.");
                                                            } finally {
                                                                setUpdatingId(null);
                                                            }
                                                        }}
                                                        className={`${inputClass} min-w-40`}
                                                        aria-label={`Change role for ${user.name}`}
                                                    >
                                                        <option value="project_member">Project Member</option>
                                                        <option value="project_owner">Project Owner</option>
                                                    </select>
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStatus(user)}
                                                        disabled={updating}
                                                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${active
                                                            ? "border border-rose-200 text-rose-700 hover:bg-rose-50"
                                                            : "bg-teal-700 text-white hover:bg-teal-800"
                                                            }`}
                                                    >
                                                        {updating
                                                            ? "Saving..."
                                                            : active
                                                                ? "Deactivate"
                                                                : "Activate"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="border-t border-stone-100 px-5 py-3 text-xs text-stone-400">
                        Account changes are saved to the database.
                    </div>
                </section>
            </div>
        </main>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
                {value}
            </p>
        </div>
    );
}
