import { useState, useRef, useEffect } from "react";
import { Share2, Lock, Globe, Download, Link2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const btnStyle = {
  fontFamily: MONO,
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  padding: "5px 0",
  backgroundColor: "hsl(var(--panel-bg))",
  border: "1px solid hsl(var(--foreground) / 0.06)",
  borderRadius: 2,
  boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
};

interface ShareBlockProps {
  onExportPdf?: () => void;
  analysisId?: string | null;
}

const ShareBlock = ({ onExportPdf, analysisId }: ShareBlockProps) => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
        setShowInvite(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", duration: 1500 });
      setPopoverOpen(false);
    } catch {
      toast({ title: "Copy failed", variant: "destructive", duration: 1500 });
    }
  };

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !analysisId || !user) return;
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
        toast({ title: "Invite sent", duration: 1500 });
        setEmail("");
        setShowInvite(false);
        setPopoverOpen(false);
      }
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-0">
      {/* ── Share + Export row ── */}
      <div className="flex gap-1">
        {/* Share button with popover */}
        <div className="flex-1 relative" ref={popoverRef}>
          <button
            onClick={() => { setPopoverOpen(!popoverOpen); setShowInvite(false); }}
            className="w-full flex items-center justify-center gap-1.5 text-foreground/35 hover:text-foreground/65 transition-colors"
            style={btnStyle}
          >
            <Share2 className="w-[10px] h-[10px]" strokeWidth={2} />
            Share
          </button>

          {popoverOpen && (
            <div
              className="absolute left-0 right-0 mt-1 z-50 rounded-[3px] overflow-hidden"
              style={{
                backgroundColor: "hsl(var(--panel-bg))",
                border: "1px solid hsl(var(--foreground) / 0.08)",
                boxShadow: "0 4px 12px hsl(0 0% 0% / 0.15)",
              }}
            >
              {!showInvite ? (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.04] transition-colors"
                    style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
                  >
                    <Link2 className="w-[10px] h-[10px]" strokeWidth={2} />
                    Copy link
                  </button>
                  <div style={{ height: 1, backgroundColor: "hsl(var(--foreground) / 0.06)" }} />
                  <button
                    onClick={() => setShowInvite(true)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.04] transition-colors"
                    style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
                  >
                    <UserPlus className="w-[10px] h-[10px]" strokeWidth={2} />
                    Invite collaborator
                  </button>
                </>
              ) : (
                <div className="p-2 space-y-1.5">
                  <span
                    className="text-foreground/40"
                    style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
                  >
                    Invite by email
                  </span>
                  <div className="flex gap-1">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      className="text-[10px] h-6 flex-1 bg-background/50"
                    />
                    <Button
                      size="sm"
                      onClick={handleInvite}
                      disabled={!email.trim() || inviting || !analysisId}
                      className="h-6 px-2 text-[9px]"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export PDF button */}
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="flex-1 flex items-center justify-center gap-1.5 text-foreground/35 hover:text-foreground/65 transition-colors"
            style={btnStyle}
          >
            <Download className="w-[10px] h-[10px]" strokeWidth={2} />
            Export PDF
          </button>
        )}
      </div>

      {/* ── Visibility toggle — hardware switch style ── */}
      <button
        onClick={() => setIsPublic(!isPublic)}
        className="w-full flex items-center gap-2 mt-2 group"
        style={{ padding: "4px 0" }}
      >
        <div
          className="relative shrink-0"
          style={{
            width: 24,
            height: 12,
            borderRadius: 2,
            backgroundColor: isPublic ? "hsl(145 60% 42% / 0.15)" : "hsl(var(--foreground) / 0.06)",
            border: `1px solid ${isPublic ? "hsl(145 60% 42% / 0.3)" : "hsl(var(--foreground) / 0.08)"}`,
            boxShadow: "inset 0 1px 2px hsl(0 0% 0% / 0.06)",
            transition: "all 0.15s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 1,
              width: 8,
              height: 8,
              borderRadius: 1,
              transition: "all 0.15s",
              left: isPublic ? 13 : 1,
              backgroundColor: isPublic ? "hsl(145 60% 42%)" : "hsl(var(--foreground) / 0.3)",
              boxShadow: isPublic ? "0 0 4px hsl(145 60% 42% / 0.4)" : "none",
            }}
          />
        </div>
        <span
          className="flex items-center gap-1 text-foreground/35 group-hover:text-foreground/55 transition-colors"
          style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          {isPublic ? (
            <>
              <Globe className="w-[9px] h-[9px]" strokeWidth={2} />
              Public
            </>
          ) : (
            <>
              <Lock className="w-[9px] h-[9px]" strokeWidth={2} />
              Private
            </>
          )}
        </span>
      </button>

      {/* ── Brand mark ── */}
      <div
        className="flex items-center gap-1.5 mt-3 pt-2"
        style={{ borderTop: "1px solid hsl(var(--foreground) / 0.05)" }}
      >
        <div
          className="w-[14px] h-[14px] rounded-[2px] flex items-center justify-center shrink-0"
          style={{
            border: "1px solid hsl(var(--foreground) / 0.08)",
            backgroundColor: "hsl(var(--panel-bg))",
          }}
        >
          <span
            className="text-foreground/25 leading-none"
            style={{ fontFamily: MONO, fontSize: 6, fontWeight: 800 }}
          >
            SE
          </span>
        </div>
        <span
          className="text-foreground/18 tracking-[0.04em]"
          style={{ fontFamily: MONO, fontSize: 7 }}
        >
          SecondEar
        </span>
      </div>
    </div>
  );
};

export default ShareBlock;
