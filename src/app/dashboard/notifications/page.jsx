
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck, FolderOpen } from "lucide-react";

export default function NotificationsPage() {
    const router = useRouter();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadNotifications() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/notifications", {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Failed to load notifications.");
            }

            const data = await response.json();

            setNotifications(
                Array.isArray(data.notifications)
                    ? data.notifications
                    : []
            );
            setUnreadCount(Number(data.unreadCount) || 0);
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadNotifications();
    }, []);

   
function handleNotificationClick(notification) {
    setError("");

    // Navigate without waiting for the PATCH request.
    if (notification.task_id) {
        router.push(
            `/dashboard?taskId=${encodeURIComponent(notification.task_id)}`
        );
    } else if (notification.project_id) {
        router.push(
            `/dashboard?projectId=${encodeURIComponent(notification.project_id)}`
        );
    } else {
        setError("This notification has no linked task or project.");
        return;
    }

    // Update read status asynchronously.
    if (!notification.is_read) {
        fetch("/api/notifications", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                notificationId: notification.id,
            }),
        })
            .then(async (response) => {
                if (!response.ok) return;

                const data = await response.json();

                setNotifications((current) =>
                    current.map((item) =>
                        String(item.id) === String(notification.id)
                            ? { ...item, is_read: true }
                            : item
                    )
                );

                setUnreadCount(Number(data.unreadCount) || 0);
            })
            .catch((error) => {
                console.error(
                    "Could not mark notification as read:",
                    error
                );
            });
    }
}

    return (
        <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-4xl">
                <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="mb-6 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-teal-700"
                >
                    <ArrowLeft size={17} />
                    Back to dashboard
                </button>

                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <Bell size={23} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">
                                Notifications
                            </h1>
                            <p className="mt-1 text-sm text-stone-500">
                                All your task and project updates
                            </p>
                        </div>
                    </div>

                    <div className="rounded-full bg-white px-4 py-2 text-sm text-stone-600 ring-1 ring-stone-200">
                        {unreadCount} unread
                    </div>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                    {loading ? (
                        <p className="p-8 text-center text-sm text-stone-500">
                            Loading notifications...
                        </p>
                    ) : notifications.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <Bell
                                size={32}
                                className="mx-auto mb-3 text-stone-300"
                            />
                            <h2 className="font-semibold text-stone-800">
                                No notifications yet
                            </h2>
                            <p className="mt-1 text-sm text-stone-500">
                                Updates about your tasks and projects will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() =>
                                        handleNotificationClick(notification)
                                    }
                                    className={`flex w-full items-start gap-4 p-5 text-left transition hover:bg-stone-50 ${
                                        !notification.is_read
                                            ? "bg-teal-50/50"
                                            : "bg-white"
                                    }`}
                                >
                                    <span
                                        className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                                            !notification.is_read
                                                ? "bg-teal-600"
                                                : "bg-stone-200"
                                        }`}
                                    />

                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium leading-6 text-stone-900">
                                            {notification.message}
                                        </span>

                                        <span className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                                            <FolderOpen size={14} />
                                            {notification.task?.title ||
                                                notification.project?.name ||
                                                (notification.task_id
                                                    ? `Task #${notification.task_id}`
                                                    : notification.project_id
                                                      ? `Project #${notification.project_id}`
                                                      : "Workspace update")}
                                        </span>

                                        <span className="mt-2 block text-xs text-stone-400">
                                            {notification.created_at
                                                ? new Date(
                                                      notification.created_at
                                                  ).toLocaleString()
                                                : ""}
                                        </span>
                                    </span>

                                    {notification.is_read && (
                                        <span
                                            title="Read"
                                            className="shrink-0 text-stone-400"
                                        >
                                            <CheckCheck size={17} />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
