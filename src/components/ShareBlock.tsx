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
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  padding: "8px 12px",
  height: 34,
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
        setShowInvite(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Copied!", duration: 1500 });
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
            onClick={() => { setPopoverOpen(!popoverOpen); setShowInvite(false); }}
            className="w-full flex items-center justify-center gap-2 text-foreground/40 hover:text-foreground/70 transition-colors"
            style={btnStyle}
          >
            <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
            Share
          </button>

          {popoverOpen && (
            <div
              className="absolute left-0 right-0 mt-1.5 z-50 rounded-[3px] overflow-hidden"
              style={{
                backgroundColor: "hsl(var(--panel-bg))",
                border: "1px solid hsl(var(--foreground) / 0.1)",
                boxShadow: "0 6px 16px hsl(0 0% 0% / 0.18)",
              }}
            >
              {!showInvite ? (
                <>
                  {/* Copy link */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-4 py-3 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.04] transition-colors"
                    style={dropdownItemStyle}
                  >
                    <Link2 className="w-4 h-4" strokeWidth={2} />
                    Copy link
                  </button>
                  <div style={{ height: 1, backgroundColor: "hsl(var(--foreground) / 0.06)" }} />
                  {/* Invite collaborator */}
                  <button
                    onClick={() => setShowInvite(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.04] transition-colors"
                    style={dropdownItemStyle}
                  >
                    <UserPlus className="w-4 h-4" strokeWidth={2} />
                    Invite collaborator
                  </button>
                  <div style={{ height: 1, backgroundColor: "hsl(var(--foreground) / 0.06)" }} />
                  {/* Make public / Make private */}
                  <button
                    onClick={handleTogglePublic}
                    disabled={toggling}
                    className="w-full flex items-center gap-3 px-4 py-3 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.04] transition-colors disabled:opacity-50"
                    style={dropdownItemStyle}
                  >
                    {isPublic ? (
                      <>
                        <Lock className="w-4 h-4" strokeWidth={2} />
                        Make private
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" strokeWidth={2} />
                        Make public
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="p-3 space-y-2">
                  <span
                    className="text-foreground/45"
                    style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
                  >
                    Invite by email
                  </span>
                  <div className="flex gap-1.5">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      className="text-xs h-8 flex-1 bg-background/50"
                    />
                    <Button
                      size="sm"
                      onClick={handleInvite}
                      disabled={!email.trim() || inviting || !analysisId}
                      className="h-8 px-3 text-[11px]"
                    >
                      Invite
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
            className="w-full flex items-center justify-center gap-2 text-foreground/40 hover:text-foreground/70 transition-colors"
            style={btnStyle}
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            Export PDF
          </button>
        )}
      </div>

      {/* ── Brand mark ── */}
      <div
        className="flex items-center gap-2 pt-3"
        style={{ borderTop: "1px solid hsl(var(--foreground) / 0.05)" }}
      >
        <div
          className="w-[18px] h-[18px] rounded-[2px] flex items-center justify-center shrink-0"
          style={{
            border: "1px solid hsl(var(--foreground) / 0.08)",
            backgroundColor: "hsl(var(--panel-bg))",
          }}
        >
          <span
            className="text-foreground/25 leading-none"
            style={{ fontFamily: MONO, fontSize: 8, fontWeight: 800 }}
          >
            SE
          </span>
        </div>
        <span
          className="text-foreground/22 tracking-[0.04em]"
          style={{ fontFamily: MONO, fontSize: 16, fontWeight: 500 }}
        >
          SecondEar
        </span>
      </div>
    </div>
  );
};

export default ShareBlock;
