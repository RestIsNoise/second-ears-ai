import { useState } from "react";
import { Link2, Share2, Lock, Globe, Download, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

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
      <div className="space-y-5 overflow-hidden">
        {/* Share section */}
        <div>
          <h4 className="text-xs font-semibold tracking-tight text-foreground mb-3">Share feedback</h4>
          <div className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="w-full h-8 text-[11px] gap-1.5 justify-center"
            >
              <Link2 className="w-3 h-3 shrink-0" />
              <span className="truncate">Copy link</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="w-full h-8 text-[11px] gap-1.5 justify-center text-muted-foreground hover:text-foreground"
            >
              <Share2 className="w-3 h-3 shrink-0" />
              <span className="truncate">Share</span>
            </Button>
          </div>

          {/* Visibility toggle */}
          <button
            onClick={() => setIsPublic(!isPublic)}
            className="flex items-center gap-2 mt-3 group"
          >
            <div
              className={`w-7 h-4 rounded-full relative transition-colors ${
                isPublic ? "bg-foreground/15" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                  isPublic
                    ? "left-3.5 bg-foreground/60"
                    : "left-0.5 bg-muted-foreground/40"
                }`}
              />
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
              {isPublic ? (
                <>
                  <Globe className="w-3 h-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" /> Private
                </>
              )}
            </span>
          </button>
          <p className="text-[10px] text-muted-foreground/45 mt-1.5 leading-relaxed">
            {isPublic
              ? "Visible on your profile"
              : "Only people with the link can view"}
          </p>
        </div>

        {/* Brand footer */}
        <div className="pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-foreground/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-foreground/40 leading-none">SE</span>
            </div>
            <p className="text-[10px] text-muted-foreground/40 tracking-wide">
              SecondEar — AI speed, human ears
            </p>
          </div>
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
