
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, RefreshCw } from "lucide-react";

export default function ProjectsRoute() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load projects.");
      }

      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              All projects
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Manage your projects and collaborate with your team.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Plus size={17} />
            New project
          </Link>
        </div>

        {loading && (
          <p className="rounded-xl bg-white p-6 text-stone-500">
            Loading projects...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-white p-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadProjects}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-teal-700"
            >
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <FolderKanban
              size={38}
              className="mx-auto text-teal-700"
            />
            <h2 className="mt-4 text-xl font-semibold text-stone-900">
              No projects yet
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Create your first project to get started.
            </p>
            <Link
              href="/projects/new"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus size={17} /> Create project
            </Link>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={String(project.id)}
                href={`/projects/${project.id}`}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <FolderKanban className="text-teal-700" size={25} />
                <h2 className="mt-4 font-semibold text-stone-900">
                  {project.name}
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  {project.description || "No description added yet."}
                </p>
                <p className="mt-4 text-sm font-medium text-teal-700">
                  Open project →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
