"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Status = 'Draft' | 'Published' | 'Archived'

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  status: Status | string;
  author: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  read_time?: string | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function computeReadTime(content: string) {
  const text = (content || "").replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 225));
  return `${minutes} min read`;
}

type PostFormState = {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  author: string;
  status: Status;
}

function isStatus(value: string): value is Status {
  return value === 'Draft' || value === 'Published' || value === 'Archived'
}

type PostInsert = Omit<Post, 'id'> & { id?: never }

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState<PostFormState>({
    title: "",
    content: "",
    excerpt: "",
    category: "AI",
    author: "",
    status: "Draft",
  });

  const computedSlug = useMemo(() => slugify(form.title || ""), [form.title]);
  const computedReadTime = useMemo(() => computeReadTime(form.content || ""), [form.content]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setPosts((data || []) as Post[]);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to fetch posts";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) =>
      [p.title, p.excerpt, p.category, p.author].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [posts, query]);

  const createPost = async () => {
    setError(null);
    const now = new Date().toISOString();
    const slug = slugify(form.title);
    try {
      const insertBody: PostInsert = {
        id: undefined as never,
        title: form.title,
        slug,
        content: form.content,
        excerpt: form.excerpt,
        category: form.category,
        status: form.status,
        author: form.author,
        created_at: now,
        updated_at: now,
        published_at: form.status === "Published" ? now : null,
        read_time: computeReadTime(form.content),
      };
      const { data, error } = await supabase
        .from("posts")
        .insert([insertBody])
        .select()
        .single();
      if (error) throw error;
      setPosts((prev) => [data as Post, ...prev]);
      setShowNew(false);
      setForm({ title: "", content: "", excerpt: "", category: "AI", author: "", status: "Draft" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create post";
      setError(message);
    }
  };

  const startEdit = (p: Post) => {
    setEditing(p);
    setForm({
      title: p.title || "",
      content: p.content || "",
      excerpt: p.excerpt || "",
      category: p.category || "AI",
      author: p.author || "",
      status: isStatus(p.status) ? p.status : "Draft",
    });
  };

  const updatePost = async () => {
    if (!editing) return;
    setError(null);
    const now = new Date().toISOString();
    const newSlug = slugify(form.title);
    const willPublish = form.status === "Published";
    const wasPublished = !!editing.published_at;
    const updates: Partial<Post> & {
      slug: string;
      updated_at: string;
      published_at: string | null;
      read_time: string;
    } = {
      title: form.title,
      content: form.content,
      excerpt: form.excerpt,
      category: form.category,
      author: form.author,
      status: form.status,
      slug: newSlug,
      updated_at: now,
      published_at: willPublish ? (wasPublished ? editing.published_at : now) : null,
      read_time: computeReadTime(form.content),
    };
    try {
      const { data, error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", editing.id)
        .select()
        .single();
      if (error) throw error;
      setPosts((prev) => prev.map((x) => (x.id === editing.id ? (data as Post) : x)));
      setEditing(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update post";
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Posts</h1>
          <p className="text-sm text-gray-400">Create and manage blog posts</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search posts..."
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] sm:min-w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Title</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Author</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Published</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-white/5">
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3">{p.author}</td>
                <td className="px-4 py-3">{p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>No posts found</td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-400">Loading...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-neutral-950 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create New Post</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm text-gray-300">Title</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Slug</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-gray-300"
                  value={computedSlug}
                  readOnly
                />
                <div className="mt-1 text-xs text-gray-500">Preview: /blog/{computedSlug || '...'}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Category</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Author</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Status</label>
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: (e.target.value as Status) })}
                >
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Archived</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">Excerpt</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Content</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Read time</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-gray-300"
                  value={computedReadTime}
                  readOnly
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowNew(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createPost}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium"
              >
                Create Post
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-neutral-950 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Post</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm text-gray-300">Title</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Slug</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-gray-300"
                  value={computedSlug}
                  readOnly
                />
                <div className="mt-1 text-xs text-gray-500">Preview: /blog/{computedSlug || '...'}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Category</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Author</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Status</label>
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: (e.target.value as Status) })}
                >
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Archived</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">Excerpt</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Content</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Read time</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-gray-300"
                  value={computedReadTime}
                  readOnly
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={updatePost}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

 