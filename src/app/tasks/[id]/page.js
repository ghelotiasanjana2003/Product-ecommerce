
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const statusLabels = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
};

const priorityColors = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-rose-50 text-rose-700",
};

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(minutes) {
  if (minutes == null) return "Not estimated";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours) return `${hours}h`;

  return `${remainingMinutes}m`;
}

function getMentionIds(mentions) {
  if (!Array.isArray(mentions)) return [];
  return mentions.map(String);
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [mentionUsers, setMentionUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [message, setMessage] = useState("");
  const [mentionIds, setMentionIds] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");

  const loadComments = useCallback(async () => {
    setCommentLoading(true);
    setCommentError("");

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/comments`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load the discussion."
        );
      }

      setComments(
        Array.isArray(data.comments) ? data.comments : []
      );

      setMentionUsers(
        Array.isArray(data.mentionUsers) ? data.mentionUsers : []
      );
    } catch (err) {
      setCommentError(
        err.message || "Could not load the discussion."
      );
    } finally {
      setCommentLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;

    async function loadTask() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load task details."
          );
        }

        if (!cancelled) {
          setTask(data.task);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Could not load task details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    if (taskId) loadComments();
  }, [taskId, loadComments]);

  function resetComposer() {
    setMessage("");
    setMentionIds([]);
    setMentionQuery(null);
    setReplyTo(null);
  }

  function handleMessageChange(value) {
    setMessage(value);

    // Keep only mentions that still appear in the edited message.
    setMentionIds((previous) =>
      previous.filter((id) => {
        const person = mentionUsers.find(
          (item) => String(item.id) === String(id)
        );

        return (
          person?.name &&
          value.includes(`@${person.name}`)
        );
      })
    );

    // Show suggestions when the user types @ or @ followed by a name.
    const match = value.match(/(?:^|\s)@([^\s@]*)$/);

    if (match) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
  }

  function selectMention(person) {
    const match = message.match(/(?:^|\s)@([^\s@]*)$/);

    if (!match) return;

    const start = match.index + match[0].indexOf("@");
    const nextMessage =
      message.slice(0, start) + `@${person.name} `;

    setMessage(nextMessage);

    setMentionIds((previous) =>
      previous.includes(String(person.id))
        ? previous
        : [...previous, String(person.id)]
    );

    setMentionQuery(null);
  }

  function startReply(comment) {
    setReplyTo(comment);
    setMessage("");
    setMentionIds([]);
    setMentionQuery(null);

    document.getElementById("task-comment")?.focus();
  }

  async function sendComment(event) {
    event.preventDefault();

    const text = message.trim();

    if (!text || sending || text.length > 5000) return;

    setSending(true);
    setCommentError("");

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            parent_comment_id: replyTo?.id ?? null,
            mentions: mentionIds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not send your comment."
        );
      }

      resetComposer();
      await loadComments();
    } catch (err) {
      setCommentError(
        err.message || "Could not send your comment."
      );
    } finally {
      setSending(false);
    }
  }

  function renderCommentMessage(comment) {
    const ids = getMentionIds(comment.mentions);

    if (!ids.length) {
      return comment.message;
    }

    const mentionedPeople = mentionUsers.filter((person) =>
      ids.includes(String(person.id))
    );

    const names = mentionedPeople
      .map((person) => person.name)
      .filter(Boolean);

    if (!names.length) return comment.message;

    const escapedNames = names.map((name) =>
      name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );

    const regex = new RegExp(
      `(@(?:${escapedNames.join("|")}))`,
      "g"
    );

    return comment.message.split(regex).map((part, index) =>
      part.startsWith("@") ? (
        <span
          key={index}
          className="rounded bg-teal-100 px-1 font-medium text-teal-800"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  function renderReplies(comment) {
    if (!comment.replies?.length) return null;

    return (
      <div className="mt-4 space-y-3 border-l-2 border-teal-100 pl-4 sm:ml-3">
        {comment.replies.map((reply) => (
          <article
            key={reply.id}
            className="rounded-xl border border-stone-100 bg-white p-3 sm:p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-stone-800">
                {reply.user?.name || "Team member"}
              </p>

              <time className="text-xs text-stone-400">
                {reply.created_at
                  ? new Date(reply.created_at).toLocaleString()
                  : ""}
              </time>
            </div>

            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">
              {renderCommentMessage(reply)}
            </p>

            <button
              type="button"
              onClick={() => startReply(comment)}
              className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              Reply to thread
            </button>
          </article>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 p-6">
        <div className="mx-auto max-w-5xl py-20 text-center text-stone-500">
          Loading task details...
        </div>
      </main>
    );
  }

  if (error || !task) {
    return (
      <main className="min-h-screen bg-stone-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-8">
          <p className="font-medium text-rose-600">
            {error || "Task not found."}
          </p>

          <button
            onClick={() => router.back()}
            className="mt-5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const assignees = (task.taskAssignees || [])
    .map((assignment) => assignment.user)
    .filter(Boolean);

  if (
    task.assigned_to &&
    !assignees.some(
      (member) =>
        String(member.id) === String(task.assigned_to)
    )
  ) {
    assignees.push({
      id: task.assigned_to,
      name: "Assigned member",
    });
  }

  const filteredMentionUsers =
    mentionQuery === null
      ? []
      : mentionUsers
          .filter((person) =>
            (person.name || "")
              .toLowerCase()
              .includes(mentionQuery)
          )
          .slice(0, 8);

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-teal-700"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>

        {/* Task heading */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-teal-700">
            {task.project?.name || "Project"}
          </p>

          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                {task.title}
              </h1>

              <p className="mt-2 text-sm text-stone-500">
                Task #{task.id}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                priorityColors[task.priority] ||
                "bg-stone-100 text-stone-700"
              }`}
            >
              {task.priority
                ? `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`
                : "Priority not set"}
            </span>
          </div>

          <div className="mt-5">
            <span className="inline-flex rounded-full bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800">
              {statusLabels[task.status] || task.status}
            </span>
          </div>
        </section>

        {/* Task information */}
        <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-stone-900">
            Task information
          </h2>

          <div className="mt-5">
            <h3 className="text-sm font-medium text-stone-500">
              Description
            </h3>

            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">
              {task.description || "No description provided."}
            </p>
          </div>

          <div className="mt-6 grid gap-5 border-t border-stone-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Due date
              </h3>
              <p className="mt-1.5 text-sm font-medium text-stone-800">
                {formatDate(task.due_date)}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Estimated duration
              </h3>
              <p className="mt-1.5 text-sm font-medium text-stone-800">
                {formatDuration(task.estimated_minutes)}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Created
              </h3>
              <p className="mt-1.5 text-sm font-medium text-stone-800">
                {formatDate(task.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-stone-100 pt-6">
            <h3 className="text-sm font-medium text-stone-500">
              Assigned members
            </h3>

            {assignees.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {assignees.map((member) => (
                  <span
                    key={member.id}
                    className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700"
                  >
                    {member.name || member.email || "Team member"}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-stone-500">
                No members assigned.
              </p>
            )}
          </div>

          <div className="mt-6 border-t border-stone-100 pt-6">
            <h3 className="text-sm font-medium text-stone-500">
              Project owner
            </h3>

            <div className="mt-3">
              {task.project?.owner ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
                    {task.project.owner.name?.charAt(0)?.toUpperCase() || "O"}
                  </span>

                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {task.project.owner.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      Project owner
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-stone-500">
                  Owner information unavailable.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-stone-100 pt-6">
            <h3 className="text-sm font-medium text-stone-500">
              Attachment
            </h3>

            {task.attachment_name ? (
              <p className="mt-2 break-all text-sm text-stone-700">
                📎 {task.attachment_name}
                <span className="ml-2 text-xs text-stone-400">
                  ({Math.max(
                    1,
                    Math.round((task.attachment_size || 0) / 1024)
                  )} KB)
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-stone-500">
                No attachment.
              </p>
            )}
          </div>
        </section>

        {/* Task discussion */}
        <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Task discussion
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Ask questions, reply to messages, and mention teammates.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {commentLoading ? (
              <p className="py-8 text-center text-sm text-stone-500">
                Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <div className="rounded-xl bg-stone-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-stone-700">
                  No comments yet
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Start the conversation.
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-xl border border-stone-100 bg-stone-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-800">
                      {comment.user?.name || "Team member"}
                    </p>

                    <time className="text-xs text-stone-400">
                      {comment.created_at
                        ? new Date(comment.created_at).toLocaleString()
                        : ""}
                    </time>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">
                    {renderCommentMessage(comment)}
                  </p>

                  <button
                    type="button"
                    onClick={() => startReply(comment)}
                    className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-900"
                  >
                    ↳ Reply
                  </button>

                  {renderReplies(comment)}
                </article>
              ))
            )}
          </div>

          {commentError && (
            <p role="alert" className="mt-4 text-sm text-rose-600">
              {commentError}
            </p>
          )}

          <form
            onSubmit={sendComment}
            className="mt-5 border-t border-stone-100 pt-5"
          >
            {replyTo && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-teal-50 px-3 py-2">
                <p className="text-sm text-teal-800">
                  Replying to{" "}
                  <span className="font-semibold">
                    {replyTo.user?.name || "Team member"}
                  </span>
                </p>

                <button
                  type="button"
                  onClick={resetComposer}
                  className="text-sm font-medium text-teal-800 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <label
              htmlFor="task-comment"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              {replyTo ? "Write a reply" : "Add a comment"}
            </label>

            <textarea
              id="task-comment"
              rows={3}
              maxLength={5000}
              value={message}
              onChange={(event) =>
                handleMessageChange(event.target.value)
              }
              placeholder="Write a message... Type @ to mention someone."
              className="w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              disabled={sending}
            />

            {mentionQuery !== null && (
              <div className="mt-2 rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
                {filteredMentionUsers.length ? (
                  <>
                    <p className="px-3 py-2 text-xs text-stone-400">
                      Mention a teammate
                    </p>

                    {filteredMentionUsers.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => selectMention(person)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-teal-50"
                      >
                        <span className="text-sm font-medium text-stone-800">
                          @{person.name}
                        </span>

                        <span className="text-xs text-stone-400">
                          {String(person.role || "").toLowerCase() === "admin"
                            ? "Admin"
                            : String(person.id) === String(task.project?.owner_id)
                              ? "Project owner"
                              : "Task member"}
                        </span>
                      </button>
                    ))}
                  </>
                ) : (
                  <p className="px-3 py-2 text-sm text-stone-500">
                    No matching people found.
                  </p>
                )}
              </div>
            )}

            {mentionIds.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-stone-500">
                  Mentioning:
                </span>

                {mentionIds.map((id) => {
                  const person = mentionUsers.find(
                    (item) => String(item.id) === String(id)
                  );

                  if (!person) return null;

                  return (
                    <span
                      key={id}
                      className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800"
                    >
                      @{person.name}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-stone-400">
                {message.length}/5000
              </span>

              <button
                type="submit"
                disabled={
                  !message.trim() ||
                  sending ||
                  commentLoading
                }
                className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending
                  ? "Sending..."
                  : replyTo
                    ? "Send reply"
                    : "Send comment"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
