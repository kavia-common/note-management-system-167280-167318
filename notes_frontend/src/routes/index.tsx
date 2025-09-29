import { component$, useSignal, useTask$, $, type QRL } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

// Types
export type Note = {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  tags?: string[];
  updatedAt: string; // ISO date
};

export type Category = {
  id: string;
  name: string;
  color?: string;
  count?: number;
};

// Simulated data (to be replaced by backend integration)
const demoCategories: Category[] = [
  { id: "all", name: "All Notes" },
  { id: "work", name: "Work", color: "#2563EB" },
  { id: "personal", name: "Personal", color: "#F59E0B" },
  { id: "ideas", name: "Ideas", color: "#10B981" },
];

const demoNotes: Note[] = [
  {
    id: "n1",
    title: "Welcome to Ocean Notes",
    content:
      "This is your modern note space. Create, edit, and organize notes with style. Try selecting categories, or start typing.",
    categoryId: "all",
    tags: ["onboarding", "tips"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "n2",
    title: "Work: Sprint Planning",
    content:
      "Draft sprint goals, scope, and timeline. Capture tasks and priorities. Align with team objectives.",
    categoryId: "work",
    tags: ["work", "planning"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "n3",
    title: "Personal: Grocery List",
    content:
      "- Almond milk\n- Berries\n- Oats\n- Coffee beans\nTip: Use separate notes for recurring lists.",
    categoryId: "personal",
    tags: ["personal", "list"],
    updatedAt: new Date().toISOString(),
  },
];

// PUBLIC_INTERFACE
export default component$(() => {
  // App state
  const categoriesSig = useSignal<Category[]>([]);
  const notesSig = useSignal<Note[]>([]);
  const activeCategoryIdSig = useSignal<string>("all");
  const activeNoteIdSig = useSignal<string | null>(null);
  const searchQuerySig = useSignal<string>("");

  // Derived
  const filteredNotesSig = useSignal<Note[]>([]);

  // Initialize demo data
  useTask$(() => {
    // Prepare category counts
    const withCounts = demoCategories.map((c) => {
      const count =
        c.id === "all"
          ? demoNotes.length
          : demoNotes.filter((n) => n.categoryId === c.id || c.id === "all").length;
      return { ...c, count };
    });

    categoriesSig.value = withCounts;
    notesSig.value = demoNotes;
    activeNoteIdSig.value = demoNotes[0]?.id ?? null;
    activeCategoryIdSig.value = "all";
    filteredNotesSig.value = demoNotes;
  });

  // Handlers
  const selectCategory$: QRL<(id: string) => void> = $((id) => {
    activeCategoryIdSig.value = id;
    // filter
    const base =
      id === "all"
        ? notesSig.value
        : notesSig.value.filter((n) => n.categoryId === id || id === "all");
    const query = searchQuerySig.value.trim().toLowerCase();
    filteredNotesSig.value =
      query.length > 0
        ? base.filter(
            (n) =>
              n.title.toLowerCase().includes(query) ||
              n.content.toLowerCase().includes(query),
          )
        : base;
    // reset active if not present
    if (!filteredNotesSig.value.find((n) => n.id === activeNoteIdSig.value!)) {
      activeNoteIdSig.value = filteredNotesSig.value[0]?.id ?? null;
    }
  });

  const selectNote$: QRL<(id: string) => void> = $((id) => {
    activeNoteIdSig.value = id;
  });

  const updateSearch$: QRL<(q: string) => void> = $((q) => {
    searchQuerySig.value = q;
    // Apply search on current category subset
    const id = activeCategoryIdSig.value;
    const base =
      id === "all"
        ? notesSig.value
        : notesSig.value.filter((n) => n.categoryId === id || id === "all");
    const query = q.trim().toLowerCase();
    filteredNotesSig.value =
      query.length > 0
        ? base.filter(
            (n) =>
              n.title.toLowerCase().includes(query) ||
              n.content.toLowerCase().includes(query),
          )
        : base;
  });

  const createNote$: QRL<() => void> = $(() => {
    const newId = Math.random().toString(36).slice(2);
    const cat = activeCategoryIdSig.value === "all" ? null : activeCategoryIdSig.value;
    const newNote: Note = {
      id: newId,
      title: "Untitled Note",
      content: "",
      categoryId: cat,
      tags: [],
      updatedAt: new Date().toISOString(),
    };
    notesSig.value = [newNote, ...notesSig.value];
    // refresh filter
    selectCategory$(activeCategoryIdSig.value);
    activeNoteIdSig.value = newId;
  });

  const saveNote$: QRL<(patch: Partial<Note>) => void> = $((patch) => {
    const id = activeNoteIdSig.value;
    if (!id) return;
    notesSig.value = notesSig.value.map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
    );
    // re-filter as text may have changed
    selectCategory$(activeCategoryIdSig.value);
  });

  const deleteNote$: QRL<() => void> = $(() => {
    const id = activeNoteIdSig.value;
    if (!id) return;
    notesSig.value = notesSig.value.filter((n) => n.id !== id);
    selectCategory$(activeCategoryIdSig.value);
  });

  const moveToCategory$: QRL<(catId: string | null) => void> = $((catId) => {
    const id = activeNoteIdSig.value;
    if (!id) return;
    notesSig.value = notesSig.value.map((n) =>
      n.id === id ? { ...n, categoryId: catId ?? null, updatedAt: new Date().toISOString() } : n,
    );
    // update counts lightly
    const withCounts = categoriesSig.value.map((c) => {
      const count =
        c.id === "all"
          ? notesSig.value.length
          : notesSig.value.filter((n) => n.categoryId === c.id).length;
      return { ...c, count };
    });
    categoriesSig.value = withCounts;
    selectCategory$(activeCategoryIdSig.value);
  });

  // Current active note can be derived synchronously where needed in JSX by
  // reading from signals (see sections using notesSig and activeNoteIdSig).

  return (
    <div class="app-shell">
      {/* Header */}
      <header class="header">
        <div class="header-inner">
          <div class="brand">
            <div class="brand-badge" aria-hidden="true" />
            Ocean Notes
          </div>
          <div class="nav-actions">
            <div class="search" role="search">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M19 19l-4-4m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <input
                aria-label="Search notes"
                placeholder="Search notes..."
                onInput$={(e, el) => updateSearch$(el.value)}
              />
            </div>
            <button class="btn primary" onClick$={createNote$}>New Note</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div class="content-area">
        {/* Sidebar */}
        <aside class="sidebar" aria-label="Categories">
          <div class="section-title">Categories</div>
          <div class="category-list">
            {categoriesSig.value.map((c) => (
              <button
                key={c.id}
                class={{
                  "category-item": true,
                  active: c.id === activeCategoryIdSig.value,
                }}
                onClick$={$(() => selectCategory$(c.id))}
              >
                <div class="category-name">
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "9999px",
                      display: "inline-block",
                      background: c.id === "all" ? "transparent" : c.color ?? "rgba(17,24,39,0.2)",
                      border: c.id === "all" ? "1px dashed rgba(17,24,39,0.2)" : "1px solid rgba(17,24,39,0.2)",
                    }}
                  />
                  {c.name}
                </div>
                <span class="category-count">{c.count ?? 0}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main panel */}
        <section class="main-panel">
          {/* Notes list */}
          <div class="notes-panel">
            <div class="panel-header">
              <div class="panel-title">Notes</div>
              <div class="helper">{filteredNotesSig.value.length} results</div>
            </div>
            <div class="notes-list">
              {filteredNotesSig.value.map((n) => (
                <button
                  key={n.id}
                  class={{
                    "note-card": true,
                    active: n.id === activeNoteIdSig.value,
                  }}
                  onClick$={$(() => selectNote$(n.id))}
                >
                  <div class="note-title">{n.title || "Untitled"}</div>
                  <div class="note-meta">
                    {new Date(n.updatedAt).toLocaleString()}
                    {n.tags && n.tags.length > 0 ? " • " + n.tags.join(", ") : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div class="editor-panel">
            <div class="editor-toolbar">
              <div class="toolbar-left">
                {(() => {
                  const n = notesSig.value.find((x) => x.id === activeNoteIdSig.value) ?? null;
                  return (n?.tags ?? []).map((t) => <span key={t} class="tag">{t}</span>);
                })()}
              </div>
              <div class="toolbar-right">
                <button class="btn" onClick$={$(() => moveToCategory$(null))}>No category</button>
                {categoriesSig.value
                  .filter((c) => c.id !== "all")
                  .map((c) => (
                    <button
                      key={c.id}
                      class="btn ghost"
                      style={{
                        borderColor: "rgba(17,24,39,0.08)",
                        color: c.color ?? "inherit",
                      }}
                      onClick$={$(() => moveToCategory$(c.id))}
                    >
                      {c.name}
                    </button>
                  ))}
                <button class="btn" onClick$={deleteNote$} style={{ color: "var(--color-error)", borderColor: "rgba(239,68,68,0.35)" }}>
                  Delete
                </button>
              </div>
            </div>
            <div class="editor-content">
              {(() => {
                // Evaluate current note synchronously via local computation to keep types simple.
                const n = notesSig.value.find((x) => x.id === activeNoteIdSig.value) ?? null;
                return n ? (
                  <>
                    <input
                      class="input editor-title"
                      placeholder="Note title"
                      value={n.title}
                      onInput$={(e, el) => saveNote$({ title: el.value })}
                    />
                    <textarea
                      class="textarea"
                      placeholder="Start writing your note..."
                      value={n.content}
                      onInput$={(e, el) => saveNote$({ content: el.value })}
                    />
                    <div class="helper">
                      Last updated: {new Date(n.updatedAt).toLocaleString()}
                    </div>
                    <div>
                      <button class="btn primary" onClick$={$(() => {/* In real app, call backend save */})}>
                        Save
                      </button>
                      <button
                        class="btn"
                        style={{ marginLeft: "8px" }}
                        onClick$={$(() => {
                          // Simple export to JSON for now
                          const data = JSON.stringify(n, null, 2);
                          const blob = new Blob([data], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${n.title || "note"}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        })}
                      >
                        Export
                      </button>
                    </div>
                  </>
                ) : (
                  <div class="helper">No note selected. Create a new note to get started.</div>
                );
              })()}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Ocean Notes",
  meta: [
    { name: "description", content: "A modern notes app built with Qwik." },
  ],
};
