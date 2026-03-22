import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal, Music, Ear, Trash2, Camera, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { getAuthHeaders, BACKEND } from "@/lib/backendFetch";

const modes = [
  { id: "technical", label: "Technical", tag: "The engineer", icon: SlidersHorizontal },
  { id: "musical", label: "Musical", tag: "The producer", icon: Music },
  { id: "perception", label: "Perception", tag: "The listener", icon: Ear },
] as const;

const Settings = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [defaultMode, setDefaultMode] = useState("technical");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Fetch user plan
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND}/api/usage`, { headers });
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan || "free");
        }
      } catch { /* default to free */ }
    })();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || null);
    }
    // Load default_mode from DB
    if (user) {
      supabase
        .from("profiles")
        .select("default_mode")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.default_mode) setDefaultMode(data.default_mode as string);
        });
    }
  }, [profile, user]);

  const initials = (profile?.display_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPG and PNG allowed.", variant: "destructive", duration: 2000 });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB.", variant: "destructive", duration: 2000 });
      return;
    }

    setUploading(true);
    try {
      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl } as any)
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      setAvatarUrl(publicUrl);
      await refreshProfile();
      toast({ title: "Avatar updated", duration: 1500 });
    } catch (err) {
      console.error("[Settings] Avatar upload failed:", err);
      toast({ title: "Upload failed", variant: "destructive", duration: 2000 });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", variant: "destructive", duration: 2000 });
    } else {
      toast({ title: "Profile updated", duration: 1500 });
    }
  };

  const handleModeChange = async (mode: string) => {
    setDefaultMode(mode);
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ default_mode: mode } as any)
      .eq("id", user.id);
    toast({ title: "Default mode updated", duration: 1500 });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE" || !user) return;
    setDeleting(true);
    try {
      // Delete user's projects (cascades to analyses, todos)
      await supabase.from("projects").delete().eq("user_id", user.id);
      // Delete profile
      await supabase.from("profiles").delete().eq("id", user.id);
      // Sign out
      await signOut();
      navigate("/", { replace: true });
      toast({ title: "Account deleted", duration: 2000 });
    } catch {
      toast({ title: "Delete failed", variant: "destructive", duration: 2000 });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-lg mx-auto">
          <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-1">
            Settings
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mb-8">Account settings</h1>

          {/* ═══ PROFILE ═══ */}
          <section className="mb-10">
            <h2 className="text-sm font-semibold tracking-tight mb-4">Profile</h2>
            <div className="space-y-4">
              {/* Avatar */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Photo
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="relative group">
                    <Avatar className="h-16 w-16">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                      <AvatarFallback className="text-lg font-medium bg-secondary text-foreground/60">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-4 h-4 text-foreground/70" />
                    </button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Camera className="w-3 h-3" />
                      {uploading ? "Uploading…" : "Upload photo"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">JPG or PNG, max 2MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Display name */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Display name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1.5 h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </label>
                <Input
                  value={user?.email || ""}
                  readOnly
                  className="mt-1.5 h-9 text-sm bg-secondary/30 text-muted-foreground"
                />
              </div>
              <Button
                size="sm"
                onClick={handleSaveProfile}
                disabled={saving}
                className="h-8 text-xs px-5"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </section>

          <div className="border-t border-border-subtle" />

          {/* ═══ PREFERENCES ═══ */}
          <section className="my-10">
            <h2 className="text-sm font-semibold tracking-tight mb-4">Preferences</h2>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Default analysis mode
              </label>
              <div className="flex gap-2 mt-2">
                {modes.map((m) => {
                  const Icon = m.icon;
                  const isActive = defaultMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleModeChange(m.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                        isActive
                          ? "border-foreground/20 bg-secondary text-foreground"
                          : "border-border-subtle text-muted-foreground hover:border-foreground/10 hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-2">
                Pre-selects this mode when starting a new analysis
              </p>
            </div>
          </section>

          <div className="border-t border-border-subtle" />

          {/* ═══ ACCOUNT ═══ */}
          <section className="mt-10">
            <h2 className="text-sm font-semibold tracking-tight mb-4">Account</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="h-8 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete account
            </Button>
          </section>
        </div>
      </main>
      <Footer />

      {/* Delete confirmation modal */}
      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!deleting) { setDeleteOpen(v); setDeleteConfirm(""); } }}>
        <DialogContent className="sm:max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight">Delete account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This will permanently delete your account and all your analyses. This action cannot be undone.
            </p>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Type DELETE to confirm
              </label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="mt-1.5 h-9 text-sm font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}
                disabled={deleting}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="h-8 text-xs"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
