import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal, Music, Ear, Trash2, Camera, CreditCard, User, Settings2, Layers, AlertTriangle, Sun, Moon, Palette } from "lucide-react";
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
import { cn } from "@/lib/utils";

const modes = [
  { id: "technical", label: "Technical", tag: "The engineer", icon: SlidersHorizontal },
  { id: "musical", label: "Musical", tag: "The producer", icon: Music },
  { id: "perception", label: "Perception", tag: "The listener", icon: Ear },
] as const;

type Section = "profile" | "preferences" | "appearance" | "subscription" | "account";

const sidebarItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Settings2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "subscription", label: "Subscription", icon: Layers },
  { id: "account", label: "Account", icon: AlertTriangle },
];

const MONO = "'IBM Plex Mono', monospace";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-[14px] font-semibold tracking-tight mb-3">{children}</h2>
    <div className="h-px" style={{ background: "hsl(0 0% 0% / 0.08)" }} />
  </div>
);

const Settings = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [displayName, setDisplayName] = useState("");
  const [defaultMode, setDefaultMode] = useState("technical");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [portalLoading, setPortalLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute("data-theme") === "dark");

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

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
      setAvatarUrl(
        profile.avatar_url ||
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture ||
        null
      );
    }
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
      setAvatarError(false);
      await refreshProfile();
      toast({ title: "Avatar updated", duration: 1500 });
    } catch (err) {
      console.error("[Settings] Avatar upload failed:", err);
      toast({ title: "Upload failed", variant: "destructive", duration: 2000 });
    } finally {
      setUploading(false);
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
      await supabase.from("projects").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
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
        <div className="max-w-4xl mx-auto">
          <p
            className="text-[10px] text-muted-foreground/40 tracking-[0.2em] uppercase mb-1"
            style={{ fontFamily: MONO }}
          >
            Settings
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mb-8">Account settings</h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* ═══ SIDEBAR (desktop) / TABS (mobile) ═══ */}
            <nav className="md:w-[200px] md:shrink-0">
              {/* Mobile: horizontal tabs */}
              <div className="flex md:hidden gap-1 overflow-x-auto pb-2 -mx-1 px-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      activeSection === item.id
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                    style={{ fontFamily: MONO }}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Desktop: vertical sidebar */}
              <div className="hidden md:flex flex-col gap-0.5">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-[12px] font-medium transition-colors text-left w-full",
                      activeSection === item.id
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                    style={{ fontFamily: MONO }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="flex-1 min-w-0">
              {/* ── PROFILE ── */}
              {activeSection === "profile" && (
                <section>
                  <SectionTitle>Profile</SectionTitle>
                  <div className="space-y-5">
                    {/* Avatar */}
                    <div>
                      <label
                        className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2"
                        style={{ fontFamily: MONO }}
                      >
                        Photo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <Avatar
                            className="h-[72px] w-[72px]"
                            style={{ border: "1px solid hsl(0 0% 87%)" }}
                          >
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
                            <Camera className="w-5 h-5 text-foreground/70" />
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
                      <label
                        className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5"
                        style={{ fontFamily: MONO }}
                      >
                        Display name
                      </label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="h-10 text-sm"
                        style={{ border: "1px solid hsl(0 0% 82%)", borderRadius: 4, padding: "0 12px" }}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5"
                        style={{ fontFamily: MONO }}
                      >
                        Email
                      </label>
                      <Input
                        value={user?.email || ""}
                        readOnly
                        className="h-10 text-sm bg-secondary/30 text-muted-foreground"
                        style={{ border: "1px solid hsl(0 0% 82%)", borderRadius: 4, padding: "0 12px" }}
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="h-9 text-xs px-6 w-full"
                      style={{ maxWidth: 200 }}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </section>
              )}

              {/* ── PREFERENCES ── */}
              {activeSection === "preferences" && (
                <section>
                  <SectionTitle>Preferences</SectionTitle>
                  <div>
                    <label
                      className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2"
                      style={{ fontFamily: MONO }}
                    >
                      Default analysis mode
                    </label>
                    <div className="flex gap-2 mt-1">
                      {modes.map((m) => {
                        const Icon = m.icon;
                        const isActive = defaultMode === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => handleModeChange(m.id)}
                            className={cn(
                              "flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium transition-all",
                              isActive
                                ? "border-foreground/20 bg-secondary text-foreground"
                                : "border-border text-muted-foreground hover:border-foreground/10 hover:text-foreground"
                            )}
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
              )}

              {/* ── APPEARANCE ── */}
              {activeSection === "appearance" && (
                <section>
                  <SectionTitle>Appearance</SectionTitle>
                  <div>
                    <label
                      className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-3"
                      style={{ fontFamily: MONO }}
                    >
                      Theme
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { if (isDark) toggleTheme(); }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all",
                          !isDark
                            ? "border-foreground/20 bg-secondary text-foreground"
                            : "border-border text-muted-foreground hover:border-foreground/10 hover:text-foreground"
                        )}
                      >
                        <Sun className="w-4 h-4" />
                        Light mode
                      </button>
                      <button
                        onClick={() => { if (!isDark) toggleTheme(); }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all",
                          isDark
                            ? "border-foreground/20 bg-secondary text-foreground"
                            : "border-border text-muted-foreground hover:border-foreground/10 hover:text-foreground"
                        )}
                      >
                        <Moon className="w-4 h-4" />
                        Dark mode
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-2">
                      Changes apply instantly across the app
                    </p>
                  </div>
                </section>
              )}

              {/* ── SUBSCRIPTION ── */}
              {activeSection === "subscription" && (
                <section>
                  <SectionTitle>Subscription</SectionTitle>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[12px] font-medium text-muted-foreground"
                        style={{ fontFamily: MONO }}
                      >
                        Current plan
                      </span>
                      {userPlan === "pro" ? (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm"
                          style={{
                            fontFamily: MONO,
                            backgroundColor: "hsl(145 55% 45% / 0.12)",
                            color: "hsl(145 55% 45%)",
                            border: "1px solid hsl(145 55% 45% / 0.25)",
                          }}
                        >
                          PRO
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm"
                          style={{
                            fontFamily: MONO,
                            backgroundColor: "hsl(var(--foreground) / 0.05)",
                            color: "hsl(var(--foreground) / 0.4)",
                            border: "1px solid hsl(var(--foreground) / 0.08)",
                          }}
                        >
                          FREE
                        </span>
                      )}
                    </div>

                    {userPlan === "pro" && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={portalLoading}
                          onClick={async () => {
                            setPortalLoading(true);
                            try {
                              const headers = await getAuthHeaders();
                              const res = await fetch(`${BACKEND}/api/stripe/portal`, {
                                method: "POST",
                                headers: { ...headers, "Content-Type": "application/json" },
                              });
                              if (!res.ok) throw new Error("Failed to open portal");
                              const { url } = await res.json();
                              window.location.href = url;
                            } catch {
                              toast({ title: "Could not open subscription portal", variant: "destructive", duration: 2500 });
                              setPortalLoading(false);
                            }
                          }}
                          className="h-9 text-xs gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {portalLoading ? "Redirecting…" : "Manage subscription"}
                        </Button>
                        <p className="text-[10px] text-muted-foreground/50 mt-2">
                          Cancel, change payment method, or view billing history
                        </p>
                      </div>
                    )}

                    {userPlan !== "pro" && (
                      <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                        Upgrade to Pro for unlimited analyses, all listening modes, and priority processing.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* ── ACCOUNT ── */}
              {activeSection === "account" && (
                <section>
                  <SectionTitle>Account</SectionTitle>
                  <div>
                    <button
                      onClick={() => setDeleteOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-medium transition-colors hover:bg-destructive/5"
                      style={{
                        border: "1px solid hsl(0 84% 60%)",
                        color: "hsl(0 84% 60%)",
                        background: "transparent",
                        fontFamily: MONO,
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete account
                    </button>
                    <p className="text-[11px] text-muted-foreground/50 mt-2.5 leading-relaxed">
                      This will permanently delete all your projects and analyses.
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>
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
