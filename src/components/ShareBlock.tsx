import { useState, useEffect } from "react";
import { Share2, Download } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ShareModal from "@/components/ShareModal";
import { toast } from "@/hooks/use-toast";

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

interface ShareBlockProps {
  onExportPdf?: () => void;
  analysisId?: string | null;
}

const ShareBlock = ({ onExportPdf, analysisId }: ShareBlockProps) => {
  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  const [isPublic, setIsPublic] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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

  const handleTogglePublic = async (val: boolean) => {
    if (!analysisId) return;
    const { error } = await supabase.from("analyses").update({ is_public: val }).eq("id", analysisId);
    if (error) {
      toast({ title: "Failed to update visibility", variant: "destructive", duration: 2000 });
    } else {
      setIsPublic(val);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => setShareOpen(true)}
          className="w-full flex items-center justify-center gap-2 text-foreground/40 hover:text-foreground/70 transition-colors"
          style={getBtnStyle(isDark)}
        >
          <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
          Share
        </button>

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

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        analysisId={analysisId ?? null}
        isPublic={isPublic}
        onTogglePublic={handleTogglePublic}
        onExportPdf={onExportPdf}
      />

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
