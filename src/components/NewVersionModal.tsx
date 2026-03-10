import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  trackName: string;
  currentAnalysisId?: string;
  nextVersion: number;
  mode?: string;
}

const NewVersionModal = ({ open, onClose, projectId, trackName, currentAnalysisId, nextVersion, mode }: Props) => {
  const navigate = useNavigate();

  if (!open) return null;

  const handleConfirm = () => {
    const params = new URLSearchParams({
      newVersion: "true",
      projectId,
      trackName,
      parentAnalysisId: currentAnalysisId || "",
      nextVersion: String(nextVersion),
      ...(mode ? { mode } : {}),
    });
    onClose();
    navigate(`/analyze?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">New version</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Upload and analyze a new mix of <span className="font-medium text-foreground/70">{trackName}</span> (v{nextVersion}).
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm}>Continue to upload</Button>
        </div>
      </div>
    </div>
  );
};

export default NewVersionModal;
