"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, UserRound } from "lucide-react";
import LogoutButton from "./LogoutButton";
import Icon from "./Icon";

export default function DashboardHeader({
    selectedProject,
    view,
    search,
    setSearch,
    selectedId,
    setSelectedId,
    setView,
    initials,
    displayName,
    email,
}) {
    const router = useRouter();

    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const profileRef = useRef(null);
    const notificationsRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setProfileOpen(false);
            }

            if (
                notificationsRef.current &&
                !notificationsRef.current.contains(event.target)
            ) {
                setNotificationsOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setProfileOpen(false);
                setNotificationsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    async function fetchNotifications() {
        setNotificationsLoading(true);

        try {
            const response = await fetch("/api/notifications", {
                cache: "no-store",
            });

            if (!response.ok) return;

            const data = await response.json();

            setNotifications(
                Array.isArray(data.notifications) ? data.notifications : []
            );
            setUnreadCount(Number(data.unreadCount) || 0);
        } catch (error) {
            console.error("Could not load notifications:", error);
        } finally {
            setNotificationsLoading(false);
        }
    }

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, []);

    function openNotification(notification) {
        setNotificationsOpen(false);

        // Navigate immediately.
        if (notification.task_id) {
            router.push(
                `/dashboard?taskId=${encodeURIComponent(notification.task_id)}`
            );
        } else if (notification.project_id) {
            router.push(
                `/dashboard?projectId=${encodeURIComponent(notification.project_id)}`
            );
        }

        // Mark as read in the background.
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
        <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 px-5 py-3 backdrop-blur-md sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 lg:flex-nowrap">
                {/* Page title */}
                <div className="min-w-0 shrink-0">
                    <p className="text-xs text-stone-400">
                        Workspace /{" "}
                        {selectedProject
                            ? `Projects / ${selectedProject.name}`
                            : view}
                    </p>

                    <h1 className="mt-0.5 truncate text-lg font-bold text-stone-900">
                        {selectedProject ? selectedProject.name : view}
                    </h1>
                </div>

                {/* Search */}
                <label className="order-3 flex w-full items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3 text-stone-400 transition focus-within:border-teal-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-600/10 lg:order-none lg:mx-auto lg:w-full lg:max-w-sm">
                    <Icon name="search" size={17} />

                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);

                            if (selectedId) setSelectedId(null);

                            if (view === "Overview" && e.target.value) {
                                setView("Projects");
                            }
                        }}
                        placeholder="Search projects or tasks..."
                        aria-label="Search projects or tasks"
                        className="w-full bg-transparent py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-400"
                    />
                </label>

                {/* Notifications and profile */}
                <div className="flex shrink-0 items-center gap-3">
                    {/* Notification bell */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            type="button"
                            onClick={() => {
                                const nextOpen = !notificationsOpen;
                                setNotificationsOpen(nextOpen);

                                if (nextOpen) {
                                    fetchNotifications();
                                }
                            }}
                            aria-label={`Notifications, ${unreadCount} unread`}
                            aria-expanded={notificationsOpen}
                            className="relative flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                        >
                            <Bell size={21} strokeWidth={1.8} />
                            {unreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}

                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 top-full z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10">
                                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                                    <h2 className="text-sm font-semibold text-stone-900">
                                        Notifications
                                    </h2>

                                    <span className="text-xs text-stone-500">
                                        {unreadCount} unread
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNotificationsOpen(false);
                                            router.push("/dashboard/notifications");
                                        }}
                                        className="border-b border-stone-100 px-4 py-3 pr-0 text-left text-sm font-medium text-teal-700 hover:bg-teal-50"
                                    >
                                        View all notifications →
                                    </button>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {notificationsLoading &&
                                        notifications.length === 0 ? (
                                        <p className="px-4 py-8 text-center text-sm text-stone-500">
                                            Loading notifications...
                                        </p>
                                    ) : notifications.length === 0 ? (
                                        <p className="px-4 py-8 text-center text-sm text-stone-500">
                                            You're all caught up!
                                        </p>
                                    ) : (
                                        notifications.map((notification) => (
                                            <button
                                                key={notification.id}
                                                type="button"
                                                onClick={() =>
                                                    openNotification(notification)
                                                }
                                                className={`block w-full border-b border-stone-100 px-4 py-3 text-left transition hover:bg-stone-50 ${!notification.is_read
                                                    ? "bg-teal-50/60"
                                                    : "bg-white"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span
                                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!notification.is_read
                                                            ? "bg-teal-600"
                                                            : "bg-transparent"
                                                            }`}
                                                    />

                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm leading-5 text-stone-800">
                                                            {notification.message}
                                                        </span>

                                                        <span className="mt-1 block text-xs text-stone-500">
                                                            {notification.task?.title ||
                                                                notification.project?.name ||
                                                                "Open related work"}
                                                        </span>

                                                        <span className="mt-1 block text-xs text-stone-400">
                                                            {notification.created_at
                                                                ? new Date(
                                                                    notification.created_at
                                                                ).toLocaleString()
                                                                : ""}
                                                        </span>
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            type="button"
                            onClick={() => setProfileOpen((open) => !open)}
                            aria-expanded={profileOpen}
                            aria-haspopup="true"
                            aria-label="Open profile menu"
                            className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                        >
                            <div
                                title={displayName}
                                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-stone-700 text-sm font-semibold text-white"
                            >
                                {initials}
                            </div>

                            <div className="hidden min-w-0 sm:block">
                                <p className="max-w-44 truncate text-sm font-semibold text-stone-800">
                                    {displayName}
                                </p>

                                <p className="max-w-44 truncate text-xs text-stone-400">
                                    {email}
                                </p>
                            </div>

                            <Icon name="chevron-down" size={16} />
                        </button>

                        {profileOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white p-2 shadow-lg shadow-stone-900/10"
                            >
                                <div className="border-b border-stone-100 px-3 py-3">
                                    <p className="truncate text-sm font-semibold text-stone-900">
                                        {displayName}
                                    </p>

                                    <p className="mt-1 truncate text-xs text-stone-500">
                                        {email}
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <div
                                        role="menuitem"
                                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                                    >

                                        <UserRound size={22} strokeWidth={1.8} />
                                        <span>My profile</span>
                                    </div>

                                    <div className="mt-1 rounded-lg hover:bg-red-50">
                                        <LogoutButton />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
