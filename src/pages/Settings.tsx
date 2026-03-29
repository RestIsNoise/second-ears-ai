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

/* ─── Styled section heading ─── */
const SectionTitle = ({ children, subtitle, isDark }: { children: React.ReactNode; subtitle?: string; isDark: boolean }) => (
  <div style={{ marginBottom: 24 }}>
    <h2
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#888",
        fontWeight: 600,
        paddingBottom: 8,
        borderBottom: isDark ? "1px solid #222" : "1px solid #e0e0e0",
      }}
    >
      {children}
    </h2>
    {subtitle && (
      <p style={{ fontFamily: MONO, fontSize: 11, color: "#888", marginTop: 8 }}>{subtitle}</p>
    )}
  </div>
);

/* ─── Styled label ─── */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label
    style={{
      fontFamily: MONO,
      fontSize: 10,
      letterSpacing: "0.1em",
      color: "#666",
      textTransform: "uppercase",
      display: "block",
      marginBottom: 6,
      fontWeight: 500,
    }}
  >
    {children}
  </label>
);

/* ─── Styled input ─── */
const StyledInput = ({ isDark, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { isDark: boolean }) => (
  <input
    {...props}
    style={{
      width: "100%",
      border: isDark ? "1px solid #2a2a2a" : "1px solid #d0d0cc",
      borderRadius: 3,
      fontSize: 14,
      padding: "10px 12px",
      background: isDark ? "#1a1a1a" : "white",
      color: isDark ? "#e8e8e0" : "#111",
      fontFamily: MONO,
      outline: "none",
      transition: "all 0.2s",
      ...(props.readOnly ? { opacity: 0.6, cursor: "default" } : {}),
      ...((props as any).style || {}),
    }}
    onFocus={(e) => {
      if (!props.readOnly) {
        e.currentTarget.style.borderColor = isDark ? "#666" : "#888";
        e.currentTarget.style.boxShadow = isDark
          ? "0 0 0 3px rgba(255,255,255,0.04)"
          : "0 0 0 3px rgba(0,0,0,0.05)";
      }
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = isDark ? "#2a2a2a" : "#d0d0cc";
      e.currentTarget.style.boxShadow = "none";
    }}
  />
);

const Settings = () => {
  useEffect(() => { document.title = "Settings — SecondEar"; }, []);
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
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div className="flex flex-col md:flex-row">

            {/* ═══ SIDEBAR ═══ */}
            <nav
              className="hidden md:block flex-shrink-0"
              style={{
                width: 200,
                background: isDark ? "#111" : "#f5f5f3",
                borderRadius: 4,
                padding: "8px 0",
                alignSelf: "flex-start",
              }}
            >
              {sidebarItems.map((item) => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "10px 16px",
                      fontWeight: active ? 700 : 400,
                      color: active
                        ? (isDark ? "#e8e8e0" : "#111")
                        : "#888",
                      borderLeft: active
                        ? (isDark ? "2px solid #e8e8e0" : "2px solid #111")
                        : "2px solid transparent",
                      background: active
                        ? (isDark ? "#161616" : "white")
                        : "transparent",
                      transition: "all 0.15s",
                      cursor: "pointer",
                      border: "none",
                      borderLeftStyle: "solid",
                      borderLeftWidth: 2,
                      borderLeftColor: active
                        ? (isDark ? "#e8e8e0" : "#111")
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.color = isDark ? "#ccc" : "#444";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.color = "#888";
                      }
                    }}
                  >
                    <item.icon style={{ width: 14, height: 14, opacity: active ? 1 : 0.5 }} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile: horizontal tabs */}
            <div className="flex md:hidden gap-1 overflow-x-auto pb-3 -mx-1 px-1 mb-4">
              {sidebarItems.map((item) => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className="flex items-center gap-2 whitespace-nowrap"
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: active ? 700 : 400,
                      padding: "8px 14px",
                      borderRadius: 3,
                      backgroundColor: active ? (isDark ? "#e8e8e0" : "#111") : "transparent",
                      color: active ? (isDark ? "#111" : "#fff") : "#888",
                      transition: "all 0.15s",
                    }}
                  >
                    <item.icon style={{ width: 13, height: 13 }} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* ═══ CONTENT ═══ */}
            <div className="flex-1 min-w-0 md:pl-12">

              {/* ── PROFILE ── */}
              {activeSection === "profile" && (
                <section>
                  <SectionTitle isDark={isDark}>Profile</SectionTitle>
                  <div className="space-y-6">
                    {/* Avatar */}
                    <div>
                      <FieldLabel>Photo</FieldLabel>
                      <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <Avatar
                            className="h-12 w-12"
                            style={{ border: isDark ? "1px solid #333" : "1px solid #d0d0cc" }}
                          >
                            <AvatarImage
                              src={avatarError ? undefined : (avatarUrl || undefined)}
                              alt="Avatar"
                              loading="eager"
                              referrerPolicy="no-referrer"
                              onError={() => setAvatarError(true)}
                              style={{ display: avatarUrl && !avatarError ? undefined : "none" }}
                            />
                            <AvatarFallback
                              style={{
                                background: isDark ? "#222" : "#e8e8e4",
                                color: isDark ? "#888" : "#666",
                                fontSize: 14,
                                fontWeight: 600,
                                fontFamily: MONO,
                                display: avatarUrl && !avatarError ? "none" : undefined,
                              }}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)",
                            }}
                          >
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                              fontFamily: MONO,
                              fontSize: 11,
                              letterSpacing: "0.06em",
                              color: isDark ? "#888" : "#666",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              textDecoration: "underline",
                              textUnderlineOffset: 3,
                            }}
                          >
                            {uploading ? "Uploading…" : "Upload photo"}
                          </button>
                          <p style={{ fontFamily: MONO, fontSize: 9, color: "#555", marginTop: 4, letterSpacing: "0.04em" }}>
                            JPG or PNG, max 2 MB
                          </p>
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
                      <FieldLabel>Display name</FieldLabel>
                      <StyledInput
                        isDark={isDark}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <StyledInput
                        isDark={isDark}
                        value={user?.email || ""}
                        readOnly
                      />
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      style={{
                        fontFamily: MONO,
                        letterSpacing: "0.1em",
                        fontSize: 11,
                        textTransform: "uppercase",
                        fontWeight: 700,
                        padding: "10px 28px",
                        borderRadius: 3,
                        border: "none",
                        cursor: saving ? "default" : "pointer",
                        opacity: saving ? 0.5 : 1,
                        background: isDark ? "#e8e8e0" : "#111",
                        color: isDark ? "#111" : "#fff",
                        transition: "all 0.15s",
                      }}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </section>
              )}

              {/* ── PREFERENCES ── */}
              {activeSection === "preferences" && (
                <section>
                  <SectionTitle isDark={isDark}>Preferences</SectionTitle>
                  <div>
                    <FieldLabel>Default analysis mode</FieldLabel>
                    <div className="flex gap-2 mt-2">
                      {modes.map((m) => {
                        const Icon = m.icon;
                        const active = defaultMode === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => handleModeChange(m.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontFamily: MONO,
                              fontSize: 11,
                              fontWeight: active ? 700 : 400,
                              letterSpacing: "0.06em",
                              padding: "8px 14px",
                              borderRadius: 3,
                              border: active
                                ? (isDark ? "1px solid #e8e8e0" : "1px solid #111")
                                : (isDark ? "1px solid #2a2a2a" : "1px solid #d0d0cc"),
                              background: active
                                ? (isDark ? "#1a1a1a" : "#f5f5f3")
                                : "transparent",
                              color: active
                                ? (isDark ? "#e8e8e0" : "#111")
                                : "#888",
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            <Icon style={{ width: 14, height: 14 }} />
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                    <p style={{ fontFamily: MONO, fontSize: 10, color: "#666", marginTop: 8, letterSpacing: "0.04em" }}>
                      Pre-selects this mode when starting a new analysis
                    </p>
                  </div>
                </section>
              )}

              {/* ── APPEARANCE ── */}
              {activeSection === "appearance" && (
                <section>
                  <SectionTitle isDark={isDark}>Appearance</SectionTitle>
                  <div>
                    <FieldLabel>Theme</FieldLabel>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => { if (isDark) toggleTheme(); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          height: 42,
                          minWidth: 130,
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: !isDark ? 700 : 400,
                          fontFamily: MONO,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          justifyContent: "center",
                          transition: "all 0.15s",
                          backgroundColor: !isDark ? "#111" : "transparent",
                          color: !isDark ? "#fff" : "#888",
                          border: !isDark ? "1px solid #111" : (isDark ? "1px solid #2a2a2a" : "1px solid #d0d0cc"),
                          cursor: "pointer",
                        }}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        Light
                      </button>
                      <button
                        onClick={() => { if (!isDark) toggleTheme(); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          height: 42,
                          minWidth: 130,
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: isDark ? 700 : 400,
                          fontFamily: MONO,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          justifyContent: "center",
                          transition: "all 0.15s",
                          backgroundColor: isDark ? "#e8e8e0" : "transparent",
                          color: isDark ? "#111" : "#888",
                          border: isDark ? "1px solid #e8e8e0" : "1px solid #d0d0cc",
                          cursor: "pointer",
                        }}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        Dark
                      </button>
                    </div>
                    <p style={{ fontFamily: MONO, fontSize: 10, color: "#666", marginTop: 8, letterSpacing: "0.04em" }}>
                      Changes apply instantly across the app
                    </p>
                  </div>
                </section>
              )}

              {/* ── SUBSCRIPTION ── */}
              {activeSection === "subscription" && (
                <section>
                  <SectionTitle isDark={isDark}>Subscription</SectionTitle>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <FieldLabel>Current plan</FieldLabel>
                      {userPlan === "pro" ? (
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            padding: "3px 10px",
                            borderRadius: 3,
                            backgroundColor: isDark ? "#4ade80" : "#111",
                            color: isDark ? "#111" : "#fff",
                          }}
                        >
                          PRO
                        </span>
                      ) : (
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            padding: "3px 10px",
                            borderRadius: 3,
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f3",
                            color: "#888",
                            border: isDark ? "1px solid #2a2a2a" : "1px solid #d0d0cc",
                          }}
                        >
                          FREE
                        </span>
                      )}
                    </div>

                    {userPlan === "pro" && (
                      <div>
                        <button
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontFamily: MONO,
                            fontSize: 11,
                            letterSpacing: "0.06em",
                            padding: "10px 20px",
                            borderRadius: 3,
                            border: isDark ? "1px solid #2a2a2a" : "1px solid #d0d0cc",
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#888" : "#444",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = isDark ? "#e8e8e0" : "#111"; e.currentTarget.style.color = isDark ? "#e8e8e0" : "#111"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? "#2a2a2a" : "#d0d0cc"; e.currentTarget.style.color = isDark ? "#888" : "#444"; }}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {portalLoading ? "Redirecting…" : "Manage subscription"}
                        </button>
                        <p style={{ fontFamily: MONO, fontSize: 10, color: "#666", marginTop: 8, letterSpacing: "0.04em" }}>
                          Cancel, change payment method, or view billing history
                        </p>
                      </div>
                    )}

                    {userPlan !== "pro" && (
                      <p style={{ fontFamily: MONO, fontSize: 11, color: "#666", lineHeight: 1.6 }}>
                        Upgrade to Pro for unlimited analyses, all listening modes, and priority processing.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* ── ACCOUNT ── */}
              {activeSection === "account" && (
                <section>
                  <SectionTitle isDark={isDark} subtitle="Danger zone — these actions are permanent.">Account</SectionTitle>
                  <div>
                    <button
                      onClick={() => setDeleteOpen(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: MONO,
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        padding: "10px 20px",
                        borderRadius: 3,
                        border: "1px solid hsl(0 84% 60%)",
                        color: "hsl(0 84% 60%)",
                        background: "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete account
                    </button>
                    <p style={{ fontFamily: MONO, fontSize: 10, color: "#666", marginTop: 8, letterSpacing: "0.04em", lineHeight: 1.6 }}>
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
              <FieldLabel>Type DELETE to confirm</FieldLabel>
              <StyledInput
                isDark={isDark}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
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
