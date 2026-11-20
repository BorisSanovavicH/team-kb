"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Article = {
  id: string;
  title: string;
  category: string;
  body: string;
  author_email: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState({ title: "", category: "General", body: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setArticles(data as Article[]);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else {
        setEmail(data.session.user.email ?? "");
        load();
      }
    });
  }, [router]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    articles.forEach((a) => counts.set(a.category, (counts.get(a.category) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [articles]);

  const visible = articles.filter((a) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q);
    return matchesQuery && (category === "All" || a.category === category);
  });

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error } = await supabase.from("articles").insert({
      title: draft.title.trim(),
      category: draft.category.trim() || "General",
      body: draft.body,
    });
    if (error) setError(error.message);
    else {
      setDraft({ title: "", category: "General", body: "" });
      setWriting(false);
      await load();
    }
    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="shell">
      <nav className="side" aria-label="Categories">
        <h2>Knowledge Base</h2>
        <button className="cat" aria-current={category === "All"} onClick={() => setCategory("All")}>
          <span>All articles</span><span>{articles.length}</span>
        </button>
        {categories.map(([name, count]) => (
          <button key={name} className="cat" aria-current={category === name} onClick={() => setCategory(name)}>
            <span>{name}</span><span>{count}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        <div className="top">
          <input className="input" type="search" placeholder="Search titles and content"
            aria-label="Search articles" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn" onClick={() => setWriting(!writing)}>
            {writing ? "Close" : "New article"}
          </button>
          <span className="me">{email}</span>
          <button className="btn ghost" onClick={signOut}>Sign out</button>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        {writing && (
          <form className="composer" onSubmit={publish}>
            <div className="row">
              <div className="field" style={{ flex: 2 }}>
                <label htmlFor="title">Title</label>
                <input id="title" className="input" required value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="cat">Category</label>
                <input id="cat" className="input" list="cats" value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                <datalist id="cats">{categories.map(([n]) => <option key={n} value={n} />)}</datalist>
              </div>
            </div>
            <div className="field">
              <label htmlFor="body">Content</label>
              <textarea id="body" className="input" required value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            </div>
            <div className="actions">
              <button className="btn" disabled={saving}>{saving ? "Publishing..." : "Publish article"}</button>
              <button type="button" className="btn ghost" onClick={() => setWriting(false)}>Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="empty">Loading articles...</p>
        ) : visible.length === 0 ? (
          <p className="empty">
            {articles.length === 0
              ? "No articles yet. Select New article to write the first one."
              : "No articles match your search."}
          </p>
        ) : (
          visible.map((a) => (
            <article key={a.id} className="article">
              <h3>{a.title}</h3>
              <div className="meta">
                {a.category}, by {a.author_email ?? "unknown"} on{" "}
                {new Date(a.created_at).toLocaleDateString()}
              </div>
              {a.body.length > 220 ? (
                <details>
                  <summary>{a.body.slice(0, 220)}... Read more</summary>
                  <p style={{ marginTop: 8 }}>{a.body}</p>
                </details>
              ) : (
                <p>{a.body}</p>
              )}
            </article>
          ))
        )}
      </main>
    </div>
  );
}