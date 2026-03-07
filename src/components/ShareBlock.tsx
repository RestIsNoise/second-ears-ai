import { useState } from "react";
import { Link2, Share2, Lock, Globe, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareBlockProps {
  onExportPdf?: () => void;
}

const ShareBlock = ({ onExportPdf }: ShareBlockProps) => {
  const [isPublic, setIsPublic] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", duration: 1500 });
    } catch {
      toast({ title: "Copy failed", variant: "destructive", duration: 1500 });
    }
  };

  const handleShare = async () => {
    await handleCopyLink();
  };

  return (
    <div className="space-y-5">
      {/* Share section */}
      <div>
        <h4 className="text-xs font-semibold tracking-tight text-foreground mb-3">Share feedback</h4>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1 h-8 text-[11px] gap-1.5"
          >
            <Link2 className="w-3 h-3" />
            Copy link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 text-[11px] gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-3 h-3" />
            Share
          </Button>
          {onExportPdf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportPdf}
              className="h-8 text-[11px] gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <FileDown className="w-3 h-3" />
              PDF
            </Button>
          )}
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
            SecondEars — AI speed, human ears
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareBlock;