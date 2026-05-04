import { useState, useRef, useEffect, useCallback } from "react";
import { Share2, Lock, Globe, Download, Link2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const getBtnStyle = (isDark: boolean) => ({
  fontFamily: MONO,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  padding: "8px 12px",
  height: 34,
  backgroundColor: "hsl(var(--panel-bg))",
  border: isDark ? "1px solid #333" : "1px solid hsl(var(--foreground) / 0.06)",
  borderRadius: 2,
  boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
  color: isDark ? "#888" : undefined,
});

/* ── Invite Modal ── */
const InviteModal = ({
  open,
  onClose,
  analysisId,
  isDark,
}: {
  open: boolean;
  onClose: () => void;
  analysisId: string;
  isDark: boolean;
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleInvite = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !user) return;
    setInviting(true);
    try {
      const { error } = await supabase.from("collaborators").insert({
        analysis_id: analysisId,
        invited_email: trimmed,
        role: "viewer" as const,
        invited_by: user.id,
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already invited", description: "This email has already been invited.", duration: 2000 });
        } else {
          toast({ title: "Invite failed", variant: "destructive", duration: 2000 });
        }
      } else {
        setSuccess(true);
        setTimeout(() => onClose(), 2000);
      }
    } finally {
      setInviting(false);
    }
  }, [email, analysisId, user, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 420,
          borderRadius: 4,
          background: isDark ? "#111" : "white",
          border: isDark ? "1px solid #222" : "1px solid #e0e0e0",
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.12)",
          padding: "28px 28px 24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <p style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "#22c55e" }}>
              Invite sent ✓
            </p>
          </div>
        ) : (
          <>
            {/* Title */}
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#999",
                marginBottom: 12,
                fontWeight: 700,
              }}
            >
              Invite collaborator
            </p>

            {/* Description */}
            <p style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>
              Share this analysis with someone who can leave comments and todos.
            </p>

            {/* Email label */}
            <label
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "#666",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email address
            </label>

            {/* Email input */}
            <input
              ref={inputRef}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
              style={{
                width: "100%",
                fontSize: 14,
                padding: "10px 12px",
                borderRadius: 4,
                outline: "none",
                background: isDark ? "#0d0d0d" : "#fafafa",
                border: isDark ? "1px solid #2a2a2a" : "1px solid #d0d0d0",
                color: isDark ? "#e8e8e0" : "#111",
                fontFamily: "inherit",
              }}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3" style={{ marginTop: 20 }}>
              <button
                onClick={onClose}
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#888",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 14px",
                  letterSpacing: "0.06em",
                }}
              >
                Cancel
              </button>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || inviting}
                className="h-9 px-5 text-[12px] font-bold"
                style={{ fontFamily: MONO, letterSpacing: "0.06em" }}
              >
                {inviting ? "Sending…" : "Send invite →"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface ShareBlockProps {
  onExportPdf?: () => void;
  analysisId?: string | null;
}

const ShareBlock = ({ onExportPdf, analysisId }: ShareBlockProps) => {
  const { user } = useAuth();
  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  const [isPublic, setIsPublic] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch initial is_public state
  useEffect(() => {
    if (!analysisId) return;
    supabase
      .from("analyses")
      .select("is_public")
      .eq("id", analysisId)
      .single()
      .then(({ data }) => {
        if (data) setIsPublic(data.is_public);
      });
  }, [analysisId]);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  const handleCopyLink = async () => {
    try {
      const shareLink = analysisId
        ? `${window.location.origin}/shared/${analysisId}`
        : window.location.href;
      await navigator.clipboard.writeText(shareLink);
      toast({ title: "Copied!", duration: 1500 });
      setPopoverOpen(false);
    } catch {
      toast({ title: "Copy failed", variant: "destructive", duration: 1500 });
    }
  };

  const handleTogglePublic = async () => {
    if (!analysisId || toggling) return;
    setToggling(true);
    const newValue = !isPublic;
    try {
      const { error } = await supabase
        .from("analyses")
        .update({ is_public: newValue })
        .eq("id", analysisId);
      if (error) {
        toast({ title: "Failed to update visibility", variant: "destructive", duration: 2000 });
      } else {
        setIsPublic(newValue);
        toast({ title: newValue ? "Analysis is now public" : "Analysis is now private", duration: 1500 });
      }
    } finally {
      setToggling(false);
    }
  };

  const dropdownItemStyle = {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  };

  return (
    <div className="space-y-2.5">
      {/* ── Share + Export row ── */}
      <div className="flex flex-col gap-1.5">
        {/* Share button with popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setPopoverOpen(!popoverOpen)}
            className="w-full flex items-center justify-center gap-2 text-foreground/40 hover:text-foreground/70 transition-colors"
            style={getBtnStyle(isDark)}
          >
            <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
            Share
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: isDark ? "#555" : "#666",
                background: isDark ? "#222" : "#f0f0ee",
                border: isDark ? "1px solid #333" : "1px solid #e0e0e0",
                padding: "1px 4px",
                borderRadius: 2,
                lineHeight: 1,
                marginLeft: 4,
              }}
            >
              S
            </span>
          </button>

          {popoverOpen && (
            <div
              className="absolute left-0 right-0 mt-1 z-50 rounded-sm overflow-hidden"
              style={{
                backgroundColor: "hsl(var(--panel-bg))",
                border: "1px solid hsl(var(--foreground) / 0.08)",
                boxShadow: "0 4px 12px hsl(0 0% 0% / 0.15), inset 0 1px 2px hsl(var(--panel-inset))",
              }}
            >
              <div className="py-1">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-foreground/50 hover:text-foreground/75 hover:bg-foreground/[0.04] transition-colors"
                  style={dropdownItemStyle}
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  Copy link
                </button>
                <button
                  onClick={() => { setPopoverOpen(false); setInviteOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-foreground/50 hover:text-foreground/75 hover:bg-foreground/[0.04] transition-colors"
                  style={dropdownItemStyle}
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  Invite
                </button>
                <button
                  onClick={handleTogglePublic}
                  disabled={toggling}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-foreground/50 hover:text-foreground/75 hover:bg-foreground/[0.04] transition-colors disabled:opacity-50"
                  style={dropdownItemStyle}
                >
                  {isPublic ? (
                    <>
                      <Lock className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      Make private
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      Make public
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export PDF button */}
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="w-full flex items-center justify-center gap-2 text-foreground/40 hover:text-foreground/70 transition-colors"
            style={getBtnStyle(isDark)}
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Export PDF
          </button>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {analysisId && (
        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          analysisId={analysisId}
          isDark={isDark}
        />
      )}

      {/* ── Brand mark ── */}
      <div
        className="flex items-center gap-1.5 pt-2.5"
        style={{ borderTop: "1px solid hsl(var(--foreground) / 0.05)" }}
      >
        <div
          className="w-[16px] h-[16px] rounded-[2px] flex items-center justify-center shrink-0"
          style={{
            border: "1px solid hsl(var(--foreground) / 0.08)",
            backgroundColor: "hsl(var(--panel-bg))",
          }}
        >
          <span
            className="text-foreground/25 leading-none"
            style={{ fontFamily: MONO, fontSize: 7, fontWeight: 800 }}
          >
            SE
          </span>
        </div>
        <span
          className="text-foreground/22 tracking-[0.04em]"
          style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500 }}
        >
          SecondEar
        </span>
      </div>
    </div>
  );
};

export default ShareBlock;
