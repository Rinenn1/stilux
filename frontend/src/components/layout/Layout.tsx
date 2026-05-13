import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const nav = [
  { to: "/chat", label: "Chat", icon: ChatIcon },
  { to: "/wardrobe", label: "Wardrobe", icon: HangerIcon },
  { to: "/wear-log", label: "Wear Log", icon: CalendarIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export default function Layout() {
  const [displayName, setDisplayName] = useState("");
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const name = user.user_metadata?.full_name || user.email || "";
      setDisplayName(name.split("@")[0]);
      const parts = name.replace(/@.*/, "").split(/[\s.]+/);
      setInitials(parts.map((p: string) => p[0]?.toUpperCase() || "").join("").slice(0, 2) || "?");
    });
  }, []);

  return (
    <div className="app">
      <div className="app-frame">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">S</div>
            <div className="brand-name">
              Stil<em>ux</em>
            </div>
          </div>

          <div className="nav-label">STYLE OS</div>
          <nav className="nav" aria-label="Primary navigation">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
                <span className="ico">
                  <Icon />
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="tonight-card">
            <div className="label">Tonight</div>
            <div className="body">Dinner, 22C, dry</div>
            <div className="meta">3 looks ready</div>
          </div>

          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-tier">Free</div>
            </div>
            <button
              className="sign-out-btn"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              Sign out
            </button>
          </div>
        </aside>

        <Outlet />
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function HangerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v4" />
      <circle cx="12" cy="6" r="2" />
      <path d="M12 12 3 18h18l-9-6z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
