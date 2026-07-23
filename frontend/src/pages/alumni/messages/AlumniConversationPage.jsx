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
    // Fill exactly the space below the fixed AlumniLayout header (h-16): the
    // -m-* cancels <main>'s padding so we sit flush under the 4rem header, and
    // the height is the viewport minus that header — no leftover strip below.
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100dvh-4rem)] overflow-hidden bg-white sm:bg-[#f5f7fb]">
      <div className="h-full bg-white rounded-none sm:rounded-2xl overflow-hidden sm:border border-slate-200 sm:m-4 sm:h-[calc(100dvh-2rem)]">
        <ConversationThread
          conversationId={Number(id)}
          onBack={() => navigate("/alumni/messages")}
        />
      </div>
    </div>
  );
}
