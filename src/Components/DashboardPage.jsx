"use client";
import AccountAccessScreen from "@/Components/AccountAccessScreen";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardHeader from "./DashboardHeader";
import ProjectsPage from "./ProjectsPage";
/* ---------- constants & seed data ---------- */

const STATUSES = ["To do", "In progress", "Done"];
const PRIORITIES = ["High", "Medium", "Low"];
const STORAGE_KEY = "wandernest-dashboard-tw-v1";

const THEMES = [
  { dot: "bg-teal-600", soft: "bg-teal-50 text-teal-700", bar: "bg-teal-600" },
  { dot: "bg-sky-600", soft: "bg-sky-50 text-sky-700", bar: "bg-sky-600" },
  { dot: "bg-amber-500", soft: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  { dot: "bg-rose-500", soft: "bg-rose-50 text-rose-700", bar: "bg-rose-500" },
  { dot: "bg-indigo-500", soft: "bg-indigo-50 text-indigo-700", bar: "bg-indigo-500" },
  { dot: "bg-emerald-600", soft: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-600" },
];


/* ---------- shared class strings ---------- */

const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800";
const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50";
const inputCls =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";
const selectCls =
  "rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";
const card = "rounded-2xl border border-stone-200 bg-white shadow-sm";

/* ---------- helpers ---------- */

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const memberOf = (id, team = []) =>
  team.find((m) => String(m.id) === String(id));

function formatDate(iso) {
  if (!iso) return "No date";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d)) return "No date";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function isOverdue(task) {
  if (!task.due || task.status === "Done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.due}T00:00:00`) < today;
}

function projectStats(project, tasks) {
  const list = tasks.filter((t) => t.projectId === project.id);
  const done = list.filter((t) => t.status === "Done").length;
  const progress = list.length ? Math.round((done / list.length) * 100) : 0;
  let status = "To do";
  if (list.length && done === list.length) status = "Completed";
  else if (list.some((t) => t.status !== "To do")) status = "In progress";
  return { total: list.length, done, progress, status };
}

/* ---------- small UI pieces ---------- */

const ICONS = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  check: "M20 6 9 17l-5-5",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
  x: "M18 6 6 18M6 6l12 12",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
};

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Avatar({ id, size = 30, team = [] }) {
  const member = team.find(
    (item) => String(item.id) === String(id)
  );

  const name = member?.name || member?.email || "User";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      title={name}
      aria-label={name}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-teal-100 font-semibold text-teal-800"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.35),
      }}
    >
      {initials}
    </div>
  );
}

function AvatarStack({ ids = [], size = 30, team = [] }) {
  const safeIds = Array.isArray(ids) ? ids : [];

  if (safeIds.length === 0) {
    return (
      <span className="text-xs text-stone-400">
        No members
      </span>
    );
  }

  return (
    <div className="flex -space-x-2">
      {safeIds.map((id) => (
        <Avatar
          key={String(id)}
          id={id}
          size={size}
          team={team}
        />
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const styles =
    status === "Done" || status === "Completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
      : status === "In progress"
        ? "bg-sky-50 text-sky-700 ring-sky-600/15"
        : "bg-stone-100 text-stone-600 ring-stone-500/10";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {status}
    </span>
  );
}

function PriorityPill({ priority }) {
  const styles =
    priority === "High"
      ? "bg-rose-50 text-rose-700"
      : priority === "Medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-stone-100 text-stone-600";
  return <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${styles}`}>{priority}</span>;
}

function Progress({ value, done, total, bar }) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-semibold text-stone-700">{value}%</span>
        <span className="text-stone-400">
          {done}/{total} tasks
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${value === 100 ? "bg-emerald-600" : bar}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function MemberPicker({ team = [], selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {team.map((m) => {
        const on = selected.includes(String(m.id));
        return (
          <button
            type="button"
            key={m.id}
            onClick={() => onToggle(m.id)}
            aria-pressed={on}
            className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition ${on ? "border-teal-600 bg-teal-50 text-teal-800" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              }`}
          >
            <Avatar id={m.id} size={26} team={team} />
            {m.name}
          </button>
        );
      })}
    </div>
  );
}


function TaskList({
  list,
  projects,
  team = [],
  showProject = true,
  onStatus,
  onToggle,
  onDelete,
  onEditAssignees,
}) {
  if (!list.length) {
    return (
      <div className="px-5 py-10 text-center text-sm text-stone-400">
        No tasks to show.
      </div>
    );
  }

  return (
    <div className="divide-y divide-stone-100">
      {list.map((task) => {
        const project = projects.find(
          (p) => String(p.id) === String(task.projectId)
        );

        const theme = THEMES[project?.theme ?? 0];
        const done = task.status === "Done";

        const assignee = team.find(
          (member) =>
            String(member.id) === String(task.assignee)
        );

        const assignedNames =
          task.assigneeNames?.length
            ? task.assigneeNames.join(", ")
            : assignee?.name || "Unassigned";

        const initials = task.assignees?.length
          ? task.assignees
            .map((member) =>
              (member.name || member.email || "?")
                .trim()
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )
            .join(", ")
          : assignee
            ? (assignee.name || assignee.email || "?")
              .trim()
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
            : "?";

        return (
          <div
            key={task.id}
            style={{ cursor: "pointer" }}
            onClick={() => {
              window.location.href = `/tasks/${task.id}`;
            }}
            className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-stone-50/70"
          >
            <button
              type="button"
              onClick={() => onToggle(task)}
              aria-label={`Mark "${task.title}" as ${done ? "not done" : "done"
                }`}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${done
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-stone-300 text-transparent hover:border-teal-600"
                }`}
            >
              <Icon name="check" size={13} />
            </button>

            <div className="min-w-[160px] flex-1">
              <p
                className={`text-sm font-medium ${done
                  ? "text-stone-400 line-through"
                  : "text-stone-800"
                  }`}
              >
                {task.title}
              </p>

              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-stone-400">
                {showProject && (
                  <>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${theme.dot}`}
                    />
                    <span>{project?.name || "Unknown project"}</span>
                    <span>·</span>
                  </>
                )}

                <span
                  className={
                    isOverdue(task)
                      ? "font-medium text-rose-600"
                      : ""
                  }
                >
                  {isOverdue(task) ? "Overdue · " : "Due "}
                  {formatDate(task.due)}
                </span>
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
              {task.estimated_minutes != null && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="clock" size={13} />
                  {Math.floor(task.estimated_minutes / 60) > 0
                    ? `${Math.floor(task.estimated_minutes / 60)}h `
                    : ""}
                  {task.estimated_minutes % 60 > 0
                    ? `${task.estimated_minutes % 60}m`
                    : task.estimated_minutes === 0
                      ? "0m"
                      : ""}
                </span>
              )}

              {task.attachment_name && (
                <a
                  href={`/api/tasks/${task.id}/attachment`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-48 items-center gap-1 truncate text-teal-700 hover:underline"
                  title={task.attachment_name}
                >
                  <span aria-hidden="true">📎</span>
                  {task.attachment_name}
                </a>
              )}
            </div>
            <PriorityPill priority={task.priority} />

            <select
              className={selectCls}
              value={task.status}
              onChange={(e) => onStatus(task.id, e.target.value)}
              aria-label="Task status"
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <div
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
                {initials}
              </div>
              <span
                className="max-w-32 truncate text-xs text-stone-600"
                title={assignedNames}
              >
                {assignedNames}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditAssignees(task)}
              title="Edit assignees"
              aria-label={`Edit assignees for ${task.title}`}
              className="rounded-lg p-1.5 text-stone-400 transition hover:bg-teal-50 hover:text-teal-700"
            >
              <span className="text-xs font-semibold">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label={`Delete task ${task.title}`}
              className="rounded-lg p-1.5 text-stone-300 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}


/* ---------- modals ---------- */


function ProjectModal({
  team = [],
  project = null,
  onClose,
  onSubmit,
  error = "",
}) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(
    project?.description || ""
  );
  const [due, setDue] = useState(
    project?.due_date?.slice(0, 10) ||
    project?.due ||
    ""
  );
  const [members, setMembers] = useState(
    (project?.members || []).map(String)
  );
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!project && team.length > 0 && members.length === 0) {
      setMembers([String(team[0].id)]);
    }
  }, [project, team, members.length]);

  const toggle = (id) => {
    const memberId = String(id);

    setMembers((current) =>
      current.includes(memberId)
        ? current.filter((m) => m !== memberId)
        : [...current, memberId]
    );
  };

  async function submit(e) {
    e.preventDefault();

    if (!name.trim() || saving) return;

    setSaving(true);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        due,
        members,
      });
    } finally {
      setSaving(false);
    }
  }

  const isEditing = Boolean(project);

  return (
    <Modal
      title={isEditing ? "Edit project" : "Create project"}
      subtitle={
        isEditing
          ? "Update your project details."
          : "Set it up and assign your team."
      }
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {error}
          </div>
        )}
        <Field label="Project name">
          <input
            required
            autoFocus
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website redesign"
            className={inputCls}
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label="Due date">
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="mb-5">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Team members
          </span>

          <MemberPicker
            team={team}
            selected={members}
            onToggle={toggle}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={btn}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={btnPrimary}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TaskModal({
  projects,
  team = [],
  defaultProjectId,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(
    String(defaultProjectId || projects[0]?.id || "")
  );
  const [priority, setPriority] = useState("Medium");
  const [due, setDue] = useState("");
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("0");
  const [estimatedMinutes, setEstimatedMinutes] = useState("0");
  const [attachment, setAttachment] = useState(null);
  const project = projects.find(
    (p) => String(p.id) === String(projectId)
  );

  const assignees = (project?.members || []).map(String);

  useEffect(() => {
    setAssigneeIds((current) =>
      current.filter((id) =>
        (project?.members || []).some(
          (memberId) => String(memberId) === String(id)
        )
      )
    );
  }, [projectId, project?.members]);

  if (!projects.length) {
    return (
      <Modal title="New task" onClose={onClose}>
        <p className="text-sm text-stone-600">
          Create a project first, then you can add tasks to it.
        </p>
        <div className="mt-5 flex justify-end">
          <button className={btn} onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }


  async function submit(e) {
    e.preventDefault();

    if (!title.trim() || !projectId || saving) return;

    const hours = Number(estimatedHours);
    const minutes = Number(estimatedMinutes);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59 ||
      hours * 60 + minutes > 4294967295
    ) {
      setError("Enter a valid estimated duration.");
      return;
    }

    if (attachment) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (!allowedTypes.includes(attachment.type)) {
        setError("Please select an image or PDF file.");
        return;
      }

      if (attachment.size > 5 * 1024 * 1024) {
        setError("The attachment must be 5 MB or smaller.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit({
        title: title.trim(),
        projectId,
        assigneeIds,
        priority,
        due: due || null,
        estimatedHours: hours,
        estimatedMinutes: minutes,
        attachment,
      });
    } catch (err) {
      setError(err.message || "Could not create task.");
    } finally {
      setSaving(false);
    }
  }


  return (
    <Modal
      title="New task"
      subtitle="Assign it to someone on the project."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <Field label="Task title">
          <input
            required
            autoFocus
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design the pricing page"
            className={inputCls}
          />
        </Field>

        <Field label="Project">
          <select
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={inputCls}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="Assignees">
            <div className="space-y-2 rounded-lg border border-stone-200 p-3">
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={assigneeIds.length === 0}
                  onChange={() => setAssigneeIds([])}
                />
                Unassigned
              </label>

              {assignees.map((id) => {
                const member = team.find(
                  (m) => String(m.id) === String(id)
                );

                return (
                  <label
                    key={id}
                    className="flex items-center gap-2 text-sm text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={assigneeIds.includes(String(id))}
                      onChange={(e) =>
                        setAssigneeIds((current) =>
                          e.target.checked
                            ? [...current, String(id)]
                            : current.filter((item) => item !== String(id))
                        )
                      }
                    />
                    {member?.name || `User ${id}`}
                  </label>
                );
              })}
            </div>
          </Field>

          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={inputCls}
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Due date">
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Estimated hours">
            <input
              type="number"
              min="0"
              step="1"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className={inputCls}
              placeholder="Hours"
            />
          </Field>

          <Field label="Estimated minutes">
            <input
              type="number"
              min="0"
              max="59"
              step="1"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className={inputCls}
              placeholder="Minutes"
            />
          </Field>
        </div>

        <Field label="Attachment (optional)">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={(e) =>
              setAttachment(e.target.files?.[0] || null)
            }
            className={inputCls}
          />
          <p className="mt-1 text-xs text-stone-500">
            One image or PDF, up to 5 MB.
          </p>

          {attachment && (
            <div className="mt-2 flex items-center justify-between gap-2 text-sm text-stone-600">
              <span className="truncate">{attachment.name}</span>
              <button
                type="button"
                className="text-rose-600 hover:text-rose-700"
                onClick={() => setAttachment(null)}
              >
                Remove
              </button>
            </div>
          )}
        </Field>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={btn}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={btnPrimary}
            disabled={saving}
          >
            {saving ? "Saving..." : "Add task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TaskComments({ taskId }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/tasks/${taskId}/comments`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load comments."
          );
        }

        if (!cancelled) {
          setComments(
            Array.isArray(data.comments) ? data.comments : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load comments.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function sendComment(e) {
    e.preventDefault();

    const text = message.trim();

    if (!text || sending || text.length > 5000) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: text }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not send comment."
        );
      }

      // Refresh comments from the database after sending.
      const refreshResponse = await fetch(
        `/api/tasks/${taskId}/comments`,
        { cache: "no-store" }
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error(
          refreshData.message || "Could not refresh comments."
        );
      }

      setComments(
        Array.isArray(refreshData.comments)
          ? refreshData.comments
          : []
      );

      setMessage("");
    } catch (err) {
      setError(err.message || "Could not send comment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-6 border-t border-stone-200 pt-5">
      <h3 className="mb-1 text-base font-semibold text-stone-900">
        Task discussion
      </h3>

      <p className="mb-4 text-xs text-stone-500">
        Ask questions, share updates, and discuss this task.
      </p>

      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-3">
        {loading ? (
          <p className="py-4 text-center text-sm text-stone-500">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-stone-500">
            No comments yet. Start the discussion!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-stone-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-teal-800">
                  {comment.user?.name || "Unknown user"}
                </span>

                <time className="text-[11px] text-stone-400">
                  {comment.created_at
                    ? new Date(comment.created_at).toLocaleString()
                    : ""}
                </time>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm text-stone-700">
                {comment.message}
              </p>
            </div>
          ))
        )}
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-rose-600">
          {error}
        </p>
      )}

      <form onSubmit={sendComment}>
        <textarea
          rows={3}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a question or update..."
          className={`${inputCls} resize-y`}
          disabled={sending}
        />

        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            className={btnPrimary}
            disabled={!message.trim() || sending}
          >
            {sending ? "Sending..." : "Send comment"}
          </button>
        </div>
      </form>
    </section>
  );
}

function EditAssigneesModal({
  task,
  projects,
  team = [],
  onClose,
  onSubmit,
}) {
  const project = projects.find(
    (p) => String(p.id) === String(task.projectId)
  );

  const projectMembers = [
    ...new Set([
      ...(project?.members || []).map(String),
      ...(project?.owner_id != null
        ? [String(project.owner_id)]
        : []),
    ]),
  ];
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [due, setDue] = useState(
    task.due || task.due_date || ""
  );
  const [priority, setPriority] = useState(
    (task.priority || "Medium").toLowerCase()
  );


  const [selected, setSelected] = useState(() => {
    const multipleAssignees = (task.assignees || [])
      .map((member) => String(member.id))
      .filter((id) => id !== "undefined" && id !== "null");

    // Support the older single-assignee field too.
    const legacyAssignee =
      task.assigned_to != null
        ? [String(task.assigned_to)]
        : [];

    // Only preselect users who are currently valid project members.
    const validProjectMembers = new Set(projectMembers);

    return [
      ...new Set([...multipleAssignees, ...legacyAssignee])
    ].filter((id) => validProjectMembers.has(id));
  });

  const [estimatedHours, setEstimatedHours] = useState(
    String(Math.floor((task.estimated_minutes || 0) / 60))
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    String((task.estimated_minutes || 0) % 60)
  );
  const [attachment, setAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleMember(id, checked) {
    setSelected((current) => {
      const memberId = String(id);

      if (checked) {
        return current.includes(memberId)
          ? current
          : [...current, memberId];
      }

      return current.filter((item) => item !== memberId);
    });
  }

  async function submit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (saving) return;

    const hours = Number(estimatedHours);
    const minutes = Number(estimatedMinutes);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59 ||
      hours * 60 + minutes > 4294967295
    ) {
      setError("Enter a valid estimated duration.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (attachment) {
      if (!allowedTypes.includes(attachment.type)) {
        setError("Please select an image or PDF file.");
        return;
      }

      if (attachment.size > 5 * 1024 * 1024) {
        setError("The attachment must be 5 MB or smaller.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit(task.id, {
        title: title.trim(),
        description: description.trim(),
        due_date: due || null,
        priority,
        assignee_ids: selected.map(Number),
        estimated_hours: Number(estimatedHours),
        estimated_minutes: Number(estimatedMinutes),
        attachment,
        remove_attachment: removeAttachment,
      });

      onClose();
    } catch (err) {
      setError(err.message || "Could not update task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Edit task"
      subtitle="Update task details and assigned members."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <Field label="Task title">
          <input
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what needs to be done..."
            className={`${inputCls} resize-y`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due date">
            <input
              type="date"
              value={due ? String(due).slice(0, 10) : ""}
              onChange={(e) => setDue(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={inputCls}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Estimated hours">
            <input
              type="number"
              min="0"
              step="1"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Estimated minutes">
            <input
              type="number"
              min="0"
              max="59"
              step="1"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Replace attachment (optional)">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className={inputCls}
            onChange={(e) => {
              setAttachment(e.target.files?.[0] || null);
              setRemoveAttachment(false);
            }}
          />

          {task.attachment_name && !removeAttachment && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <a
                href={`/api/tasks/${task.id}/attachment`}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-56 truncate text-teal-700 hover:underline"
              >
                📎 {task.attachment_name}
              </a>

              <button
                type="button"
                className="text-rose-600 hover:underline"
                onClick={() => {
                  setRemoveAttachment(true);
                  setAttachment(null);
                }}
              >
                Remove
              </button>
            </div>
          )}

          {removeAttachment && (
            <p className="mt-1 text-xs text-rose-600">
              Attachment will be removed when you save.
            </p>
          )}

          {attachment && (
            <p className="mt-1 truncate text-xs text-stone-500">
              New file: {attachment.name}
            </p>
          )}

          <p className="mt-1 text-xs text-stone-500">
            One image or PDF, up to 5 MB.
          </p>
        </Field>
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-stone-700">
            Assign members
          </p>

          <p className="mb-3 text-xs text-stone-500">
            Select as many project members as needed. Select a new person
            to add them, or uncheck someone to remove them.
          </p>

          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-2">
            {projectMembers.map((id) => {
              const member = team.find(
                (m) => String(m.id) === id
              );

              if (!member) return null;

              const checked = selected.includes(id);

              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${checked
                    ? "bg-teal-50 text-teal-900"
                    : "text-stone-700 hover:bg-stone-50"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      toggleMember(id, e.target.checked)
                    }
                    className="h-4 w-4 shrink-0 cursor-pointer accent-teal-700"
                  />

                  <span className="flex-1">
                    {member.name || member.email || `User ${id}`}
                    {member.email && member.name && (
                      <span className="block text-xs text-stone-500">
                        {member.email}
                      </span>
                    )}
                  </span>

                  {checked && (
                    <span className="text-xs font-medium text-teal-700">
                      Selected
                    </span>
                  )}
                </label>
              );
            })}

            {projectMembers.length === 0 && (
              <p className="p-3 text-sm text-stone-500">
                Add members to this project first.
              </p>
            )}
          </div>

          <p className="mt-2 text-xs text-stone-500">
            {selected.length} member{selected.length === 1 ? "" : "s"} selected
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={btn}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={btnPrimary}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save task"}
          </button>
        </div>
      </form>

      {/* Task discussion - separate from the edit form */}
      <TaskComments taskId={task.id} />
    </Modal>
  );
}

/* ---------- main component ---------- */

export default function DashboardPage({ user, email, userRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledNotificationTarget = useRef("");
  const normalizedRole = String(userRole || "").toLowerCase();

  const canCreateProjects =
    normalizedRole === "admin" ||
    normalizedRole === "project_owner";
  const [projectModalError, setProjectModalError] = useState("");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [team, setTeam] = useState([]);
  const [view, setView] = useState("Overview");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [projectModal, setProjectModal] = useState(false);
  const [taskModal, setTaskModal] = useState(null);

  const displayName = user?.trim() || "there";
  const firstName = displayName.split(/\s+/)[0];
  const initials = displayName.slice(0, 2).toUpperCase();
  const [accessUnavailable, setAccessUnavailable] = useState(false);

  function handleAccessUnavailable() {
    setProjects([]);
    setTasks([]);
    setTeam([]);
    setAccessUnavailable(true);
  }
  //get team members from the API when the component mounts
  useEffect(() => {
    async function loadTeam() {
      try {
        const response = await fetch("/api/users");

        if (response.status === 401) {
          handleAccessUnavailable();
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load team members.");
        }

        const data = await response.json();

        setTeam(Array.isArray(data.users) ? data.users : []);
      } catch (error) {
        console.error("Load team error:", error);
      }
    }

    loadTeam();
  }, []);
  //GET projects from the API when the component mounts
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        if (response.status === 401) {
          if (!cancelled) handleAccessUnavailable();
          return;
        }
        if (!response.ok) {
          throw new Error(data.message || "Failed to load projects.");
        }

        if (!cancelled) {
          setProjects(
            Array.isArray(data.projects)
              ? data.projects.map((project, index) => ({
                ...project,
                id: String(project.id),
                description: project.description || "",
                due: project.due_date || null,
                members: Array.isArray(project.members)
                  ? project.members
                  : [],
                theme:
                  Number.isInteger(project.theme)
                    ? project.theme
                    : index % THEMES.length,
              }))
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Dashboard loading error:", error);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);
  //PROJECT CREATION: Send a POST request to the API to create a new project  
  async function createProject(data) {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          due_date: data.due || null,
          memberIds: (data.members || []).map(Number),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not create project.");
      }

      const project = result.project;

      // Resolve the owner from the loaded team list if the API
      // returned only owner_id instead of owner.name.
      const ownerId =
        project.owner?.id ??
        project.owner_id ??
        project.ownerId;

      const resolvedOwner =
        project.owner?.name
          ? project.owner
          : team.find(
            (member) => String(member.id) === String(ownerId)
          );

      const createdProject = {
        ...project,
        id: String(project.id),
        description: project.description || "",
        due: project.due_date || null,
        owner: resolvedOwner
          ? {
            ...resolvedOwner,
            id: String(resolvedOwner.id),
          }
          : project.owner || null,
        members: Array.isArray(project.members)
          ? project.members.map(String)
          : [],
        theme: projects.length % THEMES.length,
      };

      setProjects((current) => [createdProject, ...current]);
      setProjectModal(false);
      setNotice("Project created successfully.");
    } catch (error) {
      console.error("Create project error:", error);
      setNotice(error.message || "Could not create project.");
    }
  }
  //delete project from the API when the user confirms deletion
  async function deleteProject(id) {
    const projectToDelete = projects.find(
      (p) => String(p.id) === String(id)
    );

    if (!projectToDelete) {
      setNotice("Project not found.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not delete project."
        );
      }

      // Remove the project and its associated tasks from the UI.
      setProjects((current) =>
        current.filter((p) => String(p.id) !== String(id))
      );

      setTasks((current) =>
        current.filter((t) => String(t.projectId) !== String(id))
      );

      setSelectedId(null);
      setView("Projects");
      setNotice("Project deleted successfully.");
    } catch (error) {
      console.error("Delete project error:", error);
      setNotice(error.message || "Could not delete project.");
    }
  }
  /* persistence */
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "null"
      );

      if (Array.isArray(saved?.tasks)) {
        setTasks(saved.tasks);
      }
    } catch {
      // Ignore invalid local task data.
    }
  }, []);

  //GET tasks from the API when the component mounts
  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks");
        const result = await response.json();
        if (response.status === 401) {
          if (!cancelled) handleAccessUnavailable();
          return;
        }
        if (!response.ok) {
          throw new Error(result.message || "Could not load tasks.");
        }

        const rows = Array.isArray(result.tasks) ? result.tasks : [];


        const normalized = rows.map((task) => {
          const assignees = (task.taskAssignees || [])
            .map((assignment) => assignment.user)
            .filter(Boolean);

          // Support both the older single-assignee field
          // and the current multiple-assignee table.
          const primaryAssignee =
            assignees[0] ||
            (task.assigned_to != null
              ? team.find(
                (member) =>
                  String(member.id) === String(task.assigned_to)
              )
              : null);

          return {
            ...task,
            id: String(task.id),
            projectId: String(task.project_id),
            assignee: primaryAssignee ? String(primaryAssignee.id) : "",
            assignees,
            assigneeNames: assignees.map((member) => member.name),
            priority:
              task.priority.charAt(0).toUpperCase() +
              task.priority.slice(1),
            status: {
              todo: "To do",
              in_progress: "In progress",
              completed: "Done",
            }[task.status] || "To do",
            due: task.due_date || null,
          };
        });

        if (!cancelled) setTasks(normalized);


        if (!cancelled) setTasks(normalized);
      } catch (error) {
        console.error("Load tasks error:", error);
        if (!cancelled) {
          setNotice(error.message || "Could not load tasks.");
        }
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  // Update project details in the API when editing a project
  async function updateProject(data) {
    if (!editingProject) return;

    try {
      const response = await fetch(
        `/api/projects/${editingProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            due_date: data.due || null,
            memberIds: (data.members || []).map(String),
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        setProjectModalError(
          result.message ||
          "You do not have permission to edit this project."
        );
        return;
      }

      setProjectModalError("");

      const updatedProject = {
        ...result.project,
        id: String(result.project.id),
        description: result.project.description || "",
        due: result.project.due_date || null,
        members: (result.project.members || []).map(String),
      };

      setProjects((current) =>
        current.map((project) =>
          String(project.id) === updatedProject.id
            ? { ...project, ...updatedProject }
            : project
        )
      );

      setEditingProject(null);
      setNotice("Project updated successfully.");
    } catch (error) {
      console.error("Update project error:", error);
      setNotice("Something went wrong. Please try again.");
    }
  }

  useEffect(() => {
    if (accessUnavailable) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tasks })
      );
    } catch {
      // Ignore storage errors.
    }
  }, [tasks, accessUnavailable]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  /* derived */
  const q = search.trim().toLowerCase();
  const statsById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, projectStats(p, tasks)])), [projects, tasks]);
  const activeProjects = projects.filter((p) => statsById[p.id].status === "In progress").length;
  const doneTasks = tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In progress").length;
  const overdueTasks = tasks.filter(isOverdue).length;

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "";
  const filteredProjects = projects.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
  const visibleTasks = tasks.filter((t) => {
    const hit = `${t.title} ${projectName(t.projectId)} ${memberOf(t.assignee, team)?.name || ""}`.toLowerCase().includes(q);
    const okFilter = taskFilter === "All" ? true : taskFilter === "Overdue" ? isOverdue(t) : t.status === taskFilter;
    return hit && okFilter;
  });

  const selectedProject = projects.find((p) => p.id === selectedId);


  useEffect(() => {
    const taskId = searchParams.get("taskId");
    const projectId = searchParams.get("projectId");

    if (!taskId && !projectId) return;

    const targetKey = taskId
      ? `task:${taskId}`
      : `project:${projectId}`;

    if (handledNotificationTarget.current === targetKey) return;


    if (taskId) {
      const task = tasks.find(
        (item) => String(item.id) === String(taskId)
      );

      // Wait until the task data is available.
      if (!task) return;

      handledNotificationTarget.current = targetKey;

      setView("My tasks");
      setSelectedId(null);
      setSearch("");
      setTaskFilter("To do");
      setTaskModal(null);

      router.replace("/dashboard", { scroll: false });
      return;
    }


    const project = projects.find(
      (item) => String(item.id) === String(projectId)
    );

    // Wait until projects have loaded.
    if (!project) return;

    handledNotificationTarget.current = targetKey;

    setView("Projects");
    setSelectedId(String(project.id));
    setSearch("");

    router.replace("/dashboard", { scroll: false });
  }, [searchParams, tasks, projects, router]);


  /* actions */
  function go(next) {
    setView(next);
    setSelectedId(null);
    setSearch("");
  }

  function openProject(id) {
    setView("Projects");
    setSelectedId(id);
    setSearch("");
  }


  async function createTask(data) {
    const formData = new FormData();

    formData.append("project_id", String(data.projectId));
    formData.append("title", data.title);
    formData.append("priority", data.priority.toLowerCase());
    formData.append("status", "todo");
    formData.append("due_date", data.due || "");
    formData.append("estimated_hours", String(data.estimatedHours));
    formData.append("estimated_minutes", String(data.estimatedMinutes));
    formData.append("assignee_ids", JSON.stringify(
      (data.assigneeIds || []).map(Number)
    ));

    if (data.attachment) {
      formData.append("attachment", data.attachment);
    }

    const response = await fetch("/api/tasks", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();


    if (!response.ok) {
      throw new Error(
        result.error || result.message || "Could not create task."
      );
    }

    const task = result.task;

    const assignees = (task.taskAssignees || [])
      .map((assignment) => assignment.user)
      .filter(Boolean);

    const normalizedTask = {
      ...task,
      id: String(task.id),
      projectId: String(task.project_id),
      assignees,
      assigneeNames: assignees.map(
        (member) => member.name || member.email || "Unknown user"
      ),
      assignee: assignees[0] ? String(assignees[0].id) : "",
      priority:
        task.priority.charAt(0).toUpperCase() +
        task.priority.slice(1),
      status: {
        todo: "To do",
        in_progress: "In progress",
        completed: "Done",
      }[task.status] || "To do",
      due: task.due_date || null,
    };

    setTasks((current) => [normalizedTask, ...current]);
    setTaskModal(null);
    setNotice(`Task "${data.title}" added.`);
  }


  async function setTaskStatus(id, status) {
    const statusToApi = {
      "To do": "todo",
      "In progress": "in_progress",
      Done: "completed",
    };

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: statusToApi[status],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not update task status.");
      }

      setTasks((current) =>
        current.map((task) =>
          String(task.id) === String(id)
            ? { ...task, status }
            : task
        )
      );
    } catch (error) {
      setNotice(error.message || "Could not update task status.");
    }
  }
  const toggleTaskDone = (task) => setTaskStatus(task.id, task.status === "Done" ? "To do" : "Done");

  async function updateTaskAssignees(taskId, updates) {
    const formData = new FormData();

    formData.append("title", updates.title ?? "");
    formData.append("description", updates.description ?? "");
    formData.append("due_date", updates.due_date ?? "");
    formData.append("priority", updates.priority ?? "medium");
    formData.append(
      "assignee_ids",
      JSON.stringify(updates.assignee_ids ?? [])
    );
    formData.append(
      "estimated_hours",
      String(updates.estimated_hours ?? 0)
    );
    formData.append(
      "estimated_minutes",
      String(updates.estimated_minutes ?? 0)
    );
    formData.append(
      "remove_attachment",
      String(Boolean(updates.remove_attachment))
    );

    if (updates.attachment) {
      formData.append("attachment", updates.attachment);
    }

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Could not update task.");
    }

    const task = result.task;

    const assignees = (task.taskAssignees || [])
      .map((assignment) => assignment.user)
      .filter(Boolean);

    const normalizedTask = {
      ...task,
      id: String(task.id),
      projectId: String(task.project_id),
      assignees,
      assigneeNames: assignees.map(
        (member) => member.name || member.email || "Unknown user"
      ),
      assignee: assignees[0] ? String(assignees[0].id) : "",
      priority:
        task.priority.charAt(0).toUpperCase() +
        task.priority.slice(1),
      due: task.due_date || null,
      status: {
        todo: "To do",
        in_progress: "In progress",
        completed: "Done",
      }[task.status] || "To do",
    };

    setTasks((current) =>
      current.map((item) =>
        String(item.id) === String(taskId)
          ? { ...item, ...normalizedTask }
          : item
      )
    );

    setNotice("Task updated successfully.");
  }


  async function deleteTask(id) {
    const task = tasks.find(
      (item) => String(item.id) === String(id)
    );

    if (!task) return;

    if (!window.confirm(`Delete "${task.title}"?`)) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not delete task."
        );
      }

      setTasks((current) =>
        current.filter(
          (item) => String(item.id) !== String(id)
        )
      );

      setNotice("Task deleted successfully.");
    } catch (error) {
      setNotice(error.message || "Could not delete task.");
    }
  }

  function toggleMember(projectId, memberId) {
    setProjects((cur) =>
      cur.map((p) => {
        if (p.id !== projectId) return p;
        const members = Array.isArray(p.members) ? p.members : [];
        const has = members.includes(memberId);

        if (has && members.length === 1) return p;

        return {
          ...p,
          members: has
            ? members.filter((m) => m !== memberId)
            : [...members, memberId],
        };
      })
    );
  }

  const taskListProps = {
    projects,
    team,
    onStatus: setTaskStatus,
    onToggle: toggleTaskDone,
    onDelete: deleteTask,
    onEditAssignees: (task) => setTaskModal({
      ...task,
      editAssignees: true,
    }),
  };

  /* ---------- views ---------- */

  const stats = [
    { label: "Total projects", value: projects.length, note: "Across your workspace", icon: "folder", tone: "bg-teal-50 text-teal-700" },
    { label: "Active projects", value: activeProjects, note: "Currently in progress", icon: "clock", tone: "bg-sky-50 text-sky-700" },
    { label: "Tasks completed", value: `${doneTasks}/${tasks.length}`, note: `${tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0}% of all tasks`, icon: "check", tone: "bg-emerald-50 text-emerald-700" },
    { label: "Tasks in progress", value: inProgressTasks, note: overdueTasks ? `${overdueTasks} overdue` : "Nothing overdue", icon: "trend", tone: "bg-amber-50 text-amber-700" },
  ];

  const overview = (
    <>
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Your workspace</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Good to see you, {firstName}!</h2>
          <p className="mt-1.5 text-sm text-stone-500">Here&apos;s what&apos;s happening across your projects today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateProjects && (
            <div className="flex flex-wrap gap-2">
              <button
                className={btn}
                onClick={() => setTaskModal({})}
              >
                <Icon name="plus" size={16} /> New task
              </button>

              <button
                className={btnPrimary}
                onClick={() => setProjectModal(true)}
              >
                <Icon name="plus" size={16} /> New project
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <article key={s.label} className={`${card} p-5 transition hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-500">{s.label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}>
                <Icon name={s.icon} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-stone-900">{s.value}</p>
            <p className="mt-1 text-xs text-stone-400">{s.note}</p>
          </article>
        ))}
      </section>

      <section className={`${card} mt-6 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-stone-900">Recent projects</h3>
            <p className="mt-0.5 text-xs text-stone-500">Progress is calculated from completed tasks.</p>
          </div>
          <button onClick={() => go("Projects")} className="text-sm font-medium text-teal-700 hover:text-teal-900">
            View all projects →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-5 py-3 font-semibold">Team</th>
                <th className="w-52 px-5 py-3 font-semibold">Progress</th>
                <th className="px-5 py-3 font-semibold">Due date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {projects.slice(0, 5).map((p) => {
                const s = statsById[p.id];
                const theme = THEMES[p.theme] || THEMES[0];
                return (
                  <tr key={p.id} onClick={() => openProject(p.id)} className="cursor-pointer transition hover:bg-stone-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.soft}`}>
                          <Icon name="folder" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-800">{p.name}</p>
                          <p className="mt-0.5 max-w-[240px] truncate text-xs text-stone-400">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <AvatarStack ids={p.members} team={team} />
                    </td>
                    <td className="px-5 py-4">
                      <Progress value={s.progress} done={s.done} total={s.total} bar={theme.bar} />
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-500">{formatDate(p.due)}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={s.status} />
                    </td>
                  </tr>
                );
              })}
              {!projects.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-400">
                    No projects yet. Create your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <div>
              <h3 className="font-semibold text-stone-900">My tasks</h3>
              <p className="mt-0.5 text-xs text-stone-500">Change a status right from here.</p>
            </div>
            <button onClick={() => go("My tasks")} className="text-sm font-medium text-teal-700 hover:text-teal-900">
              View all →
            </button>
          </div>
          <TaskList list={tasks.filter((t) => t.status !== "Done").slice(0, 5)} {...taskListProps} />
        </div>

        <div className={`${card} p-5`}>
          <h3 className="font-semibold text-stone-900">Team members</h3>
          <p className="mt-0.5 text-xs text-stone-500">Open tasks per person.</p>
          <div className="mt-4 divide-y divide-stone-100">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <Avatar id={m.id} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800">{m.name}</p>
                  <p className="text-xs text-stone-400">{m.role}</p>
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                  {tasks.filter((t) => t.assignee === m.id && t.status !== "Done").length} open
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => go("Team")} className={`${btn} mt-3 w-full`}>
            Manage team
          </button>
        </div>
      </section>
    </>
  );


  const projectDetail = selectedProject && (
    <section>
      <button onClick={() => setSelectedId(null)} className="mb-4 text-sm font-medium text-stone-500 transition hover:text-teal-700">
        ← Back to projects
      </button>
      <div className={`${card} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${(THEMES[selectedProject.theme] || THEMES[0]).soft}`}>
                <Icon name="folder" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">{selectedProject.name}</h2>

                <p className="text-xs text-stone-400">
                  Due {formatDate(selectedProject.due)}
                </p>

                <p className="mt-1 text-sm text-stone-600">
                  Owner:{" "}
                  <span className="font-semibold text-stone-800">
                    {selectedProject.owner?.name || "Owner unavailable"}
                  </span>
                </p>

              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-stone-500">{selectedProject.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreateProjects && (
              <>
                <button className={btnPrimary} onClick={() => setTaskModal({ projectId: selectedProject.id })}>
                  <Icon name="plus" size={16} /> Add task
                </button>
                <button className={btnPrimary} onClick={() => setEditingProject(selectedProject)}>
                  Edit Project
                </button>
                <button className={btnDanger} onClick={() => deleteProject(selectedProject.id)}>
                  <Icon name="trash" size={16} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-6 max-w-lg">
          <Progress
            value={statsById[selectedProject.id].progress}
            done={statsById[selectedProject.id].done}
            total={statsById[selectedProject.id].total}
            bar={(THEMES[selectedProject.theme] || THEMES[0]).bar}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-stone-100 px-5 py-4">
            <h3 className="font-semibold text-stone-900">Tasks</h3>
            <p className="mt-0.5 text-xs text-stone-500">Update status to move the project forward.</p>
          </div>
          <TaskList list={tasks.filter((t) => t.projectId === selectedProject.id)} showProject={false} {...taskListProps} />
        </div>
        <div className={`${card} h-fit p-5`}>
          <h3 className="font-semibold text-stone-900">Assign team members</h3>
          <p className="mb-4 mt-0.5 text-xs text-stone-500">Click a person to add or remove them.</p>
          <MemberPicker
            team={team}
            selected={selectedProject.members || []}
            onToggle={(id) => toggleMember(selectedProject.id, id)}
          />
        </div>
      </div>
    </section>
  );

  const myTasks = (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">Task board</h2>
          <p className="mt-1.5 text-sm text-stone-500">Every task across all your projects.</p>
        </div>
        {canCreateProjects && (
          <button
            className={btnPrimary}
            onClick={() => setTaskModal({})}
          >
            <Icon name="plus" size={16} /> New task
          </button>
        )}
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap gap-2 border-b border-stone-100 px-5 py-3.5">
          {["All", ...STATUSES, "Overdue"].map((f) => (
            <button
              key={f}
              onClick={() => setTaskFilter(f)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${taskFilter === f ? "border-teal-700 bg-teal-700 text-white" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <TaskList list={visibleTasks} {...taskListProps} />
      </div>
    </section>
  );
  const myTeam = (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Your team
        </h2>
        <p className="mt-1.5 text-sm text-stone-500">
          See your registered team members.
        </p>
      </div>

      {team.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-stone-500`}>
          No team members found.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {team.map((member) => (
            <div key={member.id} className={`${card} p-5`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800">
                {(member.name || member.email || "?")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <p className="mt-4 font-semibold text-stone-900">
                {member.name || "Unnamed user"}
              </p>

              <p className="mt-1 break-all text-sm text-stone-500">
                {member.email}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  <section>
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-stone-900">Your team</h2>
      <p className="mt-1.5 text-sm text-stone-500">See workload and project involvement at a glance.</p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {team.map((m) => {
        const mine = tasks.filter((t) => t.assignee === m.id);
        return (
          <div key={m.id} className={`${card} p-5`}>
            <Avatar id={m.id} size={52} />
            <p className="mt-4 font-semibold text-stone-900">{m.name}</p>
            <p className="text-xs text-stone-400">{m.role}</p>
            <div className="mt-4 flex gap-5 border-t border-stone-100 pt-4">
              {[
                [
                  "Projects",
                  projects.filter(
                    (p) =>
                      Array.isArray(p.members) &&
                      p.members.includes(m.id)
                  ).length,
                ],
                ["Open", mine.filter((t) => t.status !== "Done").length],
                ["Done", mine.filter((t) => t.status === "Done").length],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xl font-bold text-stone-800">{value}</p>
                  <p className="text-[11px] text-stone-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </section>

  const navItems = [
    { label: "Overview", icon: "grid" },
    { label: "My tasks", icon: "check", count: tasks.filter((t) => t.status !== "Done").length },
    { label: "Projects", icon: "folder" },
    { label: "Team", icon: "users" },
  ];

  if (accessUnavailable) {
    return <AccountAccessScreen />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 md:flex">
      {/* Sidebar */}
      <aside className="flex w-full shrink-0 flex-col border-b border-stone-200 bg-white p-4 md:sticky md:top-0 md:h-screen md:w-64 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl  text-lg font-bold text-white">
            <img src="/assets/task-logo.png" alt="TaskPilot" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-bold tracking-tight text-stone-900">TaskPilot</p>
            <p className="text-[11px] text-stone-400">Project workspace</p>
          </div>
        </div>
        {canCreateProjects && (
          <button onClick={() => setProjectModal(true)} className={`${btnPrimary} mt-6 w-full py-2.5`}>
            <Icon name="plus" size={16} /> Create new project
          </button>
        )}
        {String(userRole || "").toLowerCase() === "admin" && (
          <button
            type="button"
            onClick={() => window.location.href = "/admin"}
            className={`${btnPrimary} mt-3 w-full py-2.5`}
          >
            Admin Page
          </button>
        )}
        {String(userRole || "").toLowerCase() === "admin" && (
          <button
            type="button"
            onClick={() => window.location.href = "/admin/activity-history"}
            className={`${btnPrimary} mt-3 w-full py-2.5`}
          >
            Activity Logs
          </button>
        )}
        <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Workspace</p>
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => go(item.label)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${view === item.label ? "bg-teal-50 font-semibold text-teal-800" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                }`}
            >
              <Icon name={item.icon} />
              <span className="flex-1">{item.label}</span>
              {item.count > 0 && <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">{item.count}</span>}
            </button>
          ))}
        </nav>

        <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Your projects</p>
        <div className="space-y-0.5">
          {projects.slice(0, 6).map((p) => (
            <button
              key={p.id}
              onClick={() => openProject(p.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-1 mt-1 text-left text-[13px] text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${(THEMES[p.theme] || THEMES[0]).dot}`} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>

      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1">
        <DashboardHeader
          selectedProject={selectedProject}
          view={view}
          search={search}
          setSearch={setSearch}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          setView={setView}
          initials={initials}
          displayName={displayName}
          email={email}
        />

        <div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:py-9">
          {notice && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss" className="text-emerald-700 hover:text-emerald-900">
                <Icon name="x" size={16} />
              </button>
            </div>
          )}

          {view === "Overview" && overview}
          {view === "Projects" && (
            selectedProject ? (
              projectDetail
            ) : (
              <ProjectsPage
                btnPrimary={btnPrimary}
                card={card}
                filteredProjects={filteredProjects}
                statsById={statsById}
                themes={THEMES}
                onNewProject={() => setProjectModal(true)}
                openProject={openProject}
                StatusPill={StatusPill}
                Progress={Progress}
                AvatarStack={AvatarStack}
                formatDate={formatDate}
                canCreateProjects={canCreateProjects}
                team={team}
              />
            )
          )}
          {view === "My tasks" && myTasks}
          {view === "Team" && myTeam}
        </div>
      </main>

      {projectModal && (
        <ProjectModal
          team={team}
          onClose={() => setProjectModal(false)}
          onSubmit={createProject}
        />
      )}
      {editingProject && (
        <ProjectModal
          key={editingProject.id}
          team={team}
          project={editingProject}
          error={projectModalError}
          onClose={() => {
            setEditingProject(null);
            setProjectModalError("");
          }}
          onSubmit={updateProject}
        />
      )}
      {taskModal && (
        taskModal.editAssignees ? (
          <EditAssigneesModal
            key={taskModal.id}
            task={taskModal}
            projects={projects}
            team={team}
            onClose={() => setTaskModal(null)}
            onSubmit={updateTaskAssignees}
          />
        ) : (
          <TaskModal
            projects={projects}
            team={team}
            defaultProjectId={taskModal.projectId}
            onClose={() => setTaskModal(null)}
            onSubmit={createTask}
          />
        )
      )}
    </div>
  );
}