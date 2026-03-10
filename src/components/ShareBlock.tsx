import { useState } from "react";
import { Link2, Share2, Lock, Globe, Download, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

interface ShareBlockProps {
  onExportPdf?: () => void;
  analysisId?: string | null;
}

const ShareBlock = ({ onExportPdf, analysisId }: ShareBlockProps) => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", duration: 1500 });
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
      }
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <div className="space-y-0">
        {/* ── Share actions ── */}
        <div className="flex gap-1">
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-1.5 text-foreground/35 hover:text-foreground/65 transition-colors"
            style={{
              fontFamily: MONO,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "5px 0",
              backgroundColor: "hsl(var(--panel-bg))",
              border: "1px solid hsl(var(--foreground) / 0.06)",
              borderRadius: 2,
              boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
            }}
          >
            <Link2 className="w-[10px] h-[10px]" strokeWidth={2} />
            Link
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 text-foreground/35 hover:text-foreground/65 transition-colors"
            style={{
              fontFamily: MONO,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "5px 0",
              backgroundColor: "hsl(var(--panel-bg))",
              border: "1px solid hsl(var(--foreground) / 0.06)",
              borderRadius: 2,
              boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
            }}
          >
            <Share2 className="w-[10px] h-[10px]" strokeWidth={2} />
            Share
          </button>
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
                boxShadow: isPublic
                  ? "0 0 4px hsl(145 60% 42% / 0.4)"
                  : "none",
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

      {/* Share Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-sm bg-background border-border p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-0">
            <DialogTitle className="text-base font-semibold tracking-tight">Share</DialogTitle>
          </DialogHeader>

          <div className="px-5 py-5 space-y-1">
            {/* Download PDF */}
            {onExportPdf && (
              <button
                onClick={() => {
                  onExportPdf();
                  setModalOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary/40 transition-colors group text-left"
              >
                <div className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center shrink-0 group-hover:bg-secondary">
                  <Download className="w-4 h-4 text-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Download PDF</p>
                  <p className="text-[11px] text-muted-foreground/60">Export analysis as a PDF file</p>
                </div>
              </button>
            )}

            {/* Share with collaborator */}
            <div className="px-3 py-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Share with collaborator</p>
                  <p className="text-[11px] text-muted-foreground/60">Invite by email address</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  className="text-xs h-9 flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={!email.trim() || inviting || !analysisId}
                  className="h-9 px-4 shrink-0 text-xs"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareBlock;
