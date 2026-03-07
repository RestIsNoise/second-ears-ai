import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabaseClient";

interface CollabProfile {
  id: string;
  invited_email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface CollaboratorAvatarsProps {
  analysisId: string | null;
}

const CollaboratorAvatars = ({ analysisId }: CollaboratorAvatarsProps) => {
  const [collabs, setCollabs] = useState<CollabProfile[]>([]);

  useEffect(() => {
    if (!analysisId) return;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("collaborators")
          .select("id, invited_email, user_id")
          .eq("analysis_id", analysisId);

        if (error || !data || data.length === 0) { setCollabs([]); return; }

      const userIds = data.filter(c => c.user_id).map(c => c.user_id!);
      let profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);
        if (profiles) profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
      }

      setCollabs(data.map(c => ({
        id: c.id,
        invited_email: c.invited_email,
        display_name: c.user_id ? profileMap[c.user_id]?.display_name || null : null,
        avatar_url: c.user_id ? profileMap[c.user_id]?.avatar_url || null : null,
      })));
    };
    load();
  }, [analysisId]);

  if (collabs.length === 0) return null;

  const visible = collabs.slice(0, 5);
  const overflow = collabs.length - 5;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((c) => {
        const initials = c.display_name
          ? c.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
          : c.invited_email.slice(0, 2).toUpperCase();

        return (
          <Tooltip key={c.id}>
            <TooltipTrigger asChild>
              <Avatar className="w-6 h-6 border-2 border-background cursor-default">
                <AvatarImage src={c.avatar_url || undefined} />
                <AvatarFallback className="text-[8px] font-semibold bg-secondary text-foreground/60">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {c.display_name || c.invited_email}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {overflow > 0 && (
        <Avatar className="w-6 h-6 border-2 border-background">
          <AvatarFallback className="text-[8px] font-semibold bg-muted text-muted-foreground">
            +{overflow}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default CollaboratorAvatars;
