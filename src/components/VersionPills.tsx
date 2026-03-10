import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VersionInfo {
  analysisId: string;
  version: number;
  projectId: string;
}

interface Props {
  versions: VersionInfo[];
  currentAnalysisId: string;
  projectId: string;
  trackName: string;
  mode: string;
}

const VersionPills = ({ versions, currentAnalysisId, projectId, trackName, mode }: Props) => {
  const navigate = useNavigate();

  if (versions.length <= 1 && !projectId) return null;

  const handleNewVersion = () => {
    const params = new URLSearchParams({
      newVersion: "true",
      projectId,
      trackName,
      mode,
      parentAnalysisId: currentAnalysisId || versions[versions.length - 1]?.analysisId,
      nextVersion: String((versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 1) + 1),
    });
    navigate(`/analyze?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 mt-2">
      {versions.length > 1 &&
        versions.map((v) => (
          <button
            key={v.analysisId}
            onClick={() => {
              if (v.analysisId !== currentAnalysisId) {
                navigate(`/project/${v.projectId}?analysis=${v.analysisId}`);
              }
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight transition-colors ${
              v.analysisId === currentAnalysisId
                ? "bg-foreground text-background"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            v{v.version}
          </button>
        ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNewVersion}
        className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
      >
        <Plus className="w-3 h-3" />
        New version
      </Button>
    </div>
  );
};

export default VersionPills;
