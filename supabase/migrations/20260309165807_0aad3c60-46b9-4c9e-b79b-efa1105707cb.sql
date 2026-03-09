
-- Table: one vote per user per comment
CREATE TABLE public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (1, -1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

-- RLS
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own votes"
  ON public.comment_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own votes"
  ON public.comment_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own votes"
  ON public.comment_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own votes"
  ON public.comment_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Aggregate counts on comments table
ALTER TABLE public.comments ADD COLUMN upvotes integer NOT NULL DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN downvotes integer NOT NULL DEFAULT 0;

-- Function to recalculate counts
CREATE OR REPLACE FUNCTION public.refresh_comment_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update for the affected comment_id
  IF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET
      upvotes = (SELECT count(*) FROM public.comment_votes WHERE comment_id = OLD.comment_id AND vote = 1),
      downvotes = (SELECT count(*) FROM public.comment_votes WHERE comment_id = OLD.comment_id AND vote = -1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  ELSE
    UPDATE public.comments SET
      upvotes = (SELECT count(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote = 1),
      downvotes = (SELECT count(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote = -1)
    WHERE id = NEW.comment_id;
    -- Also handle old comment_id on update (vote switch between comments, unlikely but safe)
    IF TG_OP = 'UPDATE' AND OLD.comment_id IS DISTINCT FROM NEW.comment_id THEN
      UPDATE public.comments SET
        upvotes = (SELECT count(*) FROM public.comment_votes WHERE comment_id = OLD.comment_id AND vote = 1),
        downvotes = (SELECT count(*) FROM public.comment_votes WHERE comment_id = OLD.comment_id AND vote = -1)
      WHERE id = OLD.comment_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_comment_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
FOR EACH ROW EXECUTE FUNCTION public.refresh_comment_vote_counts();
