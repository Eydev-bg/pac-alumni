// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/messages/AlumniConversationPage.jsx
//  Phase 3.3 — Standalone chat thread (mobile / direct link).
// ═══════════════════════════════════════════════════════════

import { useNavigate, useParams } from "react-router-dom";
import ConversationThread from "./ConversationThread";

export default function AlumniConversationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    // Offset the fixed AlumniLayout header (h-16) so the thread fills the
    // remaining viewport and the input bar stays reachable.
    <div className="-m-4 sm:-m-6 lg:-m-8 -mt-16 h-screen pt-16 bg-[#f5f7fb]">
      <div className="h-full bg-white rounded-none sm:rounded-2xl overflow-hidden sm:border border-slate-200 sm:m-4 sm:h-[calc(100vh-2rem)]">
        <ConversationThread
          conversationId={Number(id)}
          onBack={() => navigate("/alumni/messages")}
        />
      </div>
    </div>
  );
}
