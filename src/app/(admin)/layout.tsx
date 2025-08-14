"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Posts", href: "/posts", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Top bar for mobile */}
      <header className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur flex items-center justify-between h-14 px-4">
        <button
          aria-label="Open menu"
          className="rounded-md border border-white/10 px-3 py-1 text-sm"
          onClick={() => setMobileOpen(true)}
        >
          Menu
        </button>
        <span className="text-sm font-medium">Admin Portal</span>
        <div className="w-[52px]" />
      </header>

      {/* Sidebar - desktop */}
      <div className="hidden md:flex">
        <aside className="w-64 shrink-0 border-r border-white/10 bg-white/5 backdrop-blur min-h-screen fixed inset-y-0">
          <div className="h-16 hidden md:flex items-center justify-center border-b border-white/10">
            <span className="font-semibold">Admin Portal</span>
          </div>
          {userId && (
            <div className="px-3 py-3 border-b border-white/10 text-xs text-gray-400 break-words">
              <div className="truncate" title={userEmail || undefined}>{userEmail}</div>
              <div className="font-mono text-[11px] mt-1 truncate" title={userId}>ID: {userId}</div>
            </div>
          )}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? "bg-blue-500/20 text-blue-300" : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto p-3 border-t border-white/10">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace('/login');
              }}
              className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg px-3 py-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 h-full w-72 max-w-[80%] border-r border-white/10 bg-neutral-950">
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              <span className="font-medium">Menu</span>
              <button
                aria-label="Close menu"
                className="rounded-md border border-white/10 px-2 py-1 text-xs"
                onClick={() => setMobileOpen(false)}
              >
                Close
              </button>
            </div>
            {userId && (
              <div className="px-4 py-3 border-b border-white/10 text-xs text-gray-400 break-words">
                <div className="truncate" title={userEmail || undefined}>{userEmail}</div>
                <div className="font-mono text-[11px] mt-1 truncate" title={userId}>ID: {userId}</div>
              </div>
            )}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => { setMobileOpen(false); router.push(item.href); }}
                    className={`w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active ? "bg-blue-500/20 text-blue-300" : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto p-3 border-t border-white/10">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setMobileOpen(false);
                  router.replace('/login');
                }}
                className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg px-3 py-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}


