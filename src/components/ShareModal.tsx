import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Globe, Lock, UserPlus, Trash2, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

interface Collaborator {
  id: string;
  invited_email: string;
  user_id: string | null;
  role: "viewer" | "editor";
  profile?: { display_name: string | null; avatar_url: string | null } | null;
}

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string | null;
  isPublic: boolean;
  onTogglePublic: (value: boolean) => void;
  onExportPdf?: () => void;
}

const ShareModal = ({ open, onOpenChange, analysisId, isPublic, onTogglePublic, onExportPdf }: ShareModalProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviting, setInviting] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? (analysisId ? `${window.location.origin}/shared/${analysisId}` : window.location.href)
    : "";

  const fetchCollaborators = useCallback(async () => {
    if (!analysisId) return;
    const { data } = await supabase
      .from("collaborators")
      .select("id, invited_email, user_id, role")
      .eq("analysis_id", analysisId)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch profiles for collaborators that have user_ids
      const userIds = data.filter(c => c.user_id).map(c => c.user_id!);
      let profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      setCollaborators(data.map(c => ({
        ...c,
        role: c.role as "viewer" | "editor",
        profile: c.user_id ? profileMap[c.user_id] || null : null,
      })));
    }
  }, [analysisId]);

  useEffect(() => {
    if (open) fetchCollaborators();
  }, [open, fetchCollaborators]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied", duration: 1500 });
    } catch {
      toast({ title: "Copy failed", variant: "destructive", duration: 1500 });
    }
  };

  const handleInvite = async () => {
    if (!email.trim() || !analysisId || !user) return;
    setInviting(true);
    try {
      const { error } = await supabase.from("collaborators").insert({
        analysis_id: analysisId,
        invited_email: email.trim().toLowerCase(),
        role,
        invited_by: user.id,
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already invited", description: "This email has already been invited.", duration: 2000 });
        } else {
          console.error("[ShareModal] invite error:", error.code, error.message, error.details, error.hint);
          toast({ title: "Invite failed", variant: "destructive", duration: 2000 });
        }
      } else {
        toast({ title: "Collaborator invited", duration: 1500 });
        setEmail("");
        fetchCollaborators();
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: string) => {
    await supabase.from("collaborators").delete().eq("id", id);
    setCollaborators(prev => prev.filter(c => c.id !== id));
    toast({ title: "Collaborator removed", duration: 1500 });
  };

  const getInitials = (collab: Collaborator) => {
    if (collab.profile?.display_name) {
      return collab.profile.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    }
    return collab.invited_email.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Share feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Share link */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Share link</label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input
                readOnly
                value={shareUrl}
                className="text-xs h-9 bg-secondary/30 border-border-subtle font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-9 px-3 shrink-0 gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Copy
              </Button>
            </div>
          </div>

          {/* Public toggle */}
          <button
            onClick={() => onTogglePublic(!isPublic)}
            className="flex items-center gap-2.5 group w-full"
          >
            <div className={`w-8 h-[18px] rounded-full relative transition-colors ${isPublic ? "bg-foreground/20" : "bg-muted"}`}>
              <div className={`absolute top-[3px] w-3 h-3 rounded-full transition-all ${isPublic ? "left-[14px] bg-foreground/70" : "left-[3px] bg-muted-foreground/40"}`} />
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {isPublic ? <><Globe className="w-3.5 h-3.5" /> Anyone with the link can view and comment</> : <><Lock className="w-3.5 h-3.5" /> Only invited collaborators</>}
            </span>
          </button>

          {/* Invite collaborators */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Invite collaborators</label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="text-xs h-9 flex-1"
              />
              <Select value={role} onValueChange={(v) => setRole(v as "viewer" | "editor")}>
                <SelectTrigger className="h-9 w-[100px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleInvite} disabled={!email.trim() || inviting} className="h-9 gap-1.5 shrink-0">
                <UserPlus className="w-3.5 h-3.5" />
                Invite
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5">
              Viewers can comment · Editors can add To-Do items and Human Feedback markers
            </p>
          </div>

          {/* Collaborator list */}
          {collaborators.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Collaborators ({collaborators.length})
              </label>
              <div className="mt-2 space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin">
                {collaborators.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-secondary/30 transition-colors group">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={c.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[9px] font-medium bg-secondary text-foreground/60">
                        {getInitials(c)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {c.profile?.display_name || c.invited_email}
                      </p>
                      {c.profile?.display_name && (
                        <p className="text-[10px] text-muted-foreground/50 truncate">{c.invited_email}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider shrink-0">
                      {c.role}
                    </span>
                    <button
                      onClick={() => handleRemove(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export PDF */}
          {onExportPdf && (
            <div className="pt-3 border-t border-border-subtle">
              <Button variant="ghost" size="sm" onClick={onExportPdf} className="h-8 text-[11px] gap-1.5 text-muted-foreground hover:text-foreground">
                <FileDown className="w-3.5 h-3.5" />
                Export as PDF
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
