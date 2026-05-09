import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ChatPage from "./pages/ChatPage";
import WardrobePage from "./pages/WardrobePage";
import ProfilePage from "./pages/ProfilePage";
import WearLogPage from "./pages/WearLogPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wear-log" element={<WearLogPage />} />
      </Route>
    </Routes>
  );
}
