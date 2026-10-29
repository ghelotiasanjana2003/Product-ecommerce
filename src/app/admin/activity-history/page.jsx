
"use client";

import { useCallback, useEffect, useState } from "react";

const actionOptions = [
    { value: "project_created", label: "Project created" },
    { value: "project_name_updated", label: "Project name updated" },
    { value: "project_description_updated", label: "Description updated" },
    { value: "project_due_date_updated", label: "Due date updated" },
    { value: "project_member_added", label: "Member added" },
    { value: "project_member_removed", label: "Member removed" },
    { value: "task_status_changed", label: "Task status changed" },
];

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
}

function readableAction(action) {
    return (action || "activity").replaceAll("_", " ");
}

export default function ActivityHistoryPage() {
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState("");
    const [action, setAction] = useState("");
    const [projectId, setProjectId] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedLogs = logs.slice(startIndex, startIndex + pageSize);
    const loadLogs = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        setError("");

        try {
            const params = new URLSearchParams();
            params.set("limit", "100");

            if (search.trim()) {
                params.set("search", search.trim());
            }

            if (action) {
                params.set("action", action);
            }

            if (projectId.trim()) {
                params.set("projectId", projectId.trim());
            }

            const response = await fetch(
                `/api/admin/activity-logs?${params.toString()}`,
                { cache: "no-store" }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Could not load activity history."
                );
            }

            setLogs(Array.isArray(result.logs) ? result.logs : []);
        } catch (err) {
            setError(err.message || "Could not load activity history.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, action, projectId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadLogs();
        }, 250);

        return () => clearTimeout(timer);
    }, [loadLogs]);

    return (
        <main className="min-h-screen bg-stone-50 p-4 text-stone-800 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-stone-500">
                            Admin / Activity History
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
                            Activity History
                        </h1>

                        <p className="mt-2 text-sm text-stone-500">
                            Review changes made across projects and tasks.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadLogs(false)}
                        disabled={loading || refreshing}
                        className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {refreshing ? "Refreshing..." : "Refresh history"}
                    </button>
                </div>

                <section className="mb-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-3">
                    <div>
                        <label
                            htmlFor="activity-search"
                            className="mb-1.5 block text-sm font-medium"
                        >
                            Search activities
                        </label>

                        <input
                            id="activity-search"
                            type="search"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search messages or actions..."
                            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="activity-action"
                            className="mb-1.5 block text-sm font-medium"
                        >
                            Filter by action
                        </label>

                        <select
                            id="activity-action"
                            value={action}
                            onChange={(event) => {
                                setAction(event.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                        >
                            <option value="">All actions</option>

                            {actionOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="activity-project"
                            className="mb-1.5 block text-sm font-medium"
                        >
                            Filter by project ID
                        </label>

                        <input
                            id="activity-project"
                            type="number"
                            min="1"
                            value={projectId}
                            onChange={(event) => {
                                setProjectId(event.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Enter project ID"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                        <h2 className="font-semibold text-stone-900">
                            Recent activity
                        </h2>

                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                            {logs.length} records
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-sm text-stone-500">
                            Loading activity history...
                        </div>
                    ) : error ? (
                        <div className="p-6">
                            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => loadLogs()}
                                className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50"
                            >
                                Try again
                            </button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="font-medium text-stone-700">
                                No activity found
                            </p>

                            <p className="mt-1 text-sm text-stone-500">
                                Try changing your search or filters.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                                        <tr>
                                            <th className="px-5 py-3">Activity</th>
                                            <th className="px-5 py-3">User</th>
                                            <th className="px-5 py-3">Project</th>
                                            <th className="px-5 py-3">Task</th>
                                            <th className="px-5 py-3">Date</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-stone-100">
                                        {paginatedLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-stone-50">
                                                <td className="max-w-md px-5 py-4">
                                                    <span className="inline-block rounded-md bg-teal-50 px-2 py-1 text-xs font-medium capitalize text-teal-800">
                                                        {readableAction(log.action)}
                                                    </span>

                                                    <p className="mt-2 break-words text-stone-700">
                                                        {log.message}
                                                    </p>

                                                    {(log.old_value != null ||
                                                        log.new_value != null) && (
                                                            <p className="mt-1 text-xs text-stone-500">
                                                                {log.old_value ?? "empty"} →{" "}
                                                                {log.new_value ?? "empty"}
                                                            </p>
                                                        )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-stone-800">
                                                        {log.user?.name || `User #${log.user_id}`}
                                                    </p>

                                                    {log.user?.email && (
                                                        <p className="mt-1 text-xs text-stone-500">
                                                            {log.user.email}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {log.project?.name ||
                                                        `Project #${log.project_id}`}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {log.task?.title ||
                                                        (log.task_id
                                                            ? `Task #${log.task_id}`
                                                            : "—")}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-stone-500">
                                                    {formatDate(log.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="divide-y divide-stone-100 md:hidden">
                                {paginatedLogs.map((log) => (
                                    <article key={log.id} className="p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium capitalize text-teal-800">
                                                {readableAction(log.action)}
                                            </span>

                                            <span className="text-xs text-stone-500">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>

                                        <p className="mt-3 break-words text-sm text-stone-800">
                                            {log.message}
                                        </p>

                                        <p className="mt-2 text-sm text-stone-600">
                                            By {log.user?.name || `User #${log.user_id}`}
                                        </p>

                                        <p className="mt-1 text-xs text-stone-500">
                                            {log.project?.name ||
                                                `Project #${log.project_id}`}
                                            {log.task?.title
                                                ? ` · ${log.task.title}`
                                                : ""}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}


                    {!loading && !error && logs.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-stone-500">
                                Showing {startIndex + 1}–{Math.min(startIndex + pageSize, logs.length)} of {logs.length} records
                            </p>

                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((page) => Math.max(1, page - 1))
                                    }
                                    disabled={currentPage === 1}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <span className="whitespace-nowrap text-sm text-stone-600">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((page) =>
                                            Math.min(totalPages, page + 1)
                                        )
                                    }
                                    disabled={currentPage >= totalPages}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                </section>
            </div>
        </main>
    );
}
