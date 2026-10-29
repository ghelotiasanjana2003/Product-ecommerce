
import { Plus, Folder } from "lucide-react";

export default function ProjectsPage({
    btnPrimary,
    card,
    filteredProjects,
    statsById,
    themes,
    onNewProject,
    openProject,
    StatusPill,
    Progress,
    AvatarStack,
    formatDate,
    canCreateProjects,
    team
}) {
    return (
        <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                        All projects
                    </h2>
                    <p className="mt-1.5 text-sm text-stone-500">
                        Open a project to assign members and manage its tasks.
                    </p>
                </div>

                {canCreateProjects && (
                    <button
                        type="button"
                        className={btnPrimary}
                        onClick={onNewProject}
                    >
                        <Plus size={16} />
                        New project
                    </button>
                )}
            </div>

            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {filteredProjects.map((p) => {
                    const s = statsById[p.id];
                    const theme = themes[p.theme] || themes[0];

                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => openProject(p.id)}
                            className={`${card} p-5 text-left transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md`}
                        >
                            <div className="flex items-start justify-between">
                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.soft}`}
                                >
                                    <Folder size={20} />
                                </div>

                                <StatusPill status={s?.status || "To do"} />
                            </div>

                            <h3 className="mt-4 text-base font-semibold text-stone-900">
                                {p.name}
                            </h3>

                            <p className="mb-2 mt-1.5  text-sm leading-5 text-stone-500">
                                {p.description}
                            </p>
                            <p className="mt-1 text-sm min-h-10 text-stone-600 ">
                                Owner:{" "}
                                <span className="font-semibold text-stone-800">
                                    {p.owner?.role === "admin"
                                        ? "Admin"
                                        : p.owner?.name || "Owner unavailable"}
                                </span>
                            </p>
                            <Progress
                                value={s.progress}
                                done={s.done}
                                total={s.total}
                                bar={theme.bar}
                            />

                            <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                                <AvatarStack
                                    ids={Array.isArray(p.members) ? p.members : []}
                                    size={28}
                                    team={team}
                                />

                                <span className="text-xs text-stone-400">
                                    Due {formatDate(p.due)}
                                </span>
                            </div>
                        </button>
                    );
                })}

                {!filteredProjects.length && (
                    <p className="text-sm text-stone-400">
                        No matching projects found.
                    </p>
                )}
            </div>
        </section>
    );
}
