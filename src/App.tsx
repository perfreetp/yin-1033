import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Projects from "@/pages/Projects";
import Templates from "@/pages/Templates";
import CanvasPage from "@/pages/Canvas";
import DictionaryPage from "@/pages/Dictionary";
import CommentsPage from "@/pages/Comments";
import VersionsPage from "@/pages/Versions";
import PublishPage from "@/pages/Publish";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Projects />} />
        <Route path="/projects" element={<Navigate to="/" replace />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/project/:id/canvas" element={<CanvasPage />} />
        <Route path="/project/:id/dictionary" element={<DictionaryPage />} />
        <Route path="/project/:id/comments" element={<CommentsPage />} />
        <Route path="/project/:id/versions" element={<VersionsPage />} />
        <Route path="/project/:id/publish" element={<PublishPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
