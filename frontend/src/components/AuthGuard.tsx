import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api";

export default function AuthGuard() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(() => {
        setAuthed(true);
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
        // 401 interceptor in api.ts handles the redirect to /login
      });
  }, []);

  if (checking) {
    return (
      <div className="auth-checking">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (!authed) return null;

  return <Outlet />;
}
