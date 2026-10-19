-- ====================================================================
-- IdeaPulse: Anonymous Student Idea Validation Platform
-- PostgreSQL Database Schema & Row-Level Security (RLS) Policies
-- Run this script in the Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Ideas Table
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 150),
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 1000),
    category TEXT NOT NULL DEFAULT 'Sustainability & Cleantech',
    problem_statement TEXT,
    target_users TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_last_activity ON public.ideas(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_creator_id ON public.ideas(creator_id);

-- 3. Create Votes Table (With strict UNIQUE constraint)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_idea_vote UNIQUE (user_id, idea_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_idea_id ON public.votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);

-- 4. Create Constructive Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    promising_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    beneficiary_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvement_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    knowledge_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    written_suggestion TEXT CHECK (written_suggestion IS NULL OR char_length(written_suggestion) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_idea_feedback UNIQUE (user_id, idea_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_idea_id ON public.feedback(idea_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

-- 5. Create Feedback Moderation Reports Table
CREATE TABLE IF NOT EXISTS public.feedback_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('Offensive', 'Spam', 'Irrelevant', 'Personal attack', 'Other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_feedback_reports_feedback_id ON public.feedback_reports(feedback_id);

-- 6. Create Readiness Assessments Table (Self & Peer)
CREATE TABLE IF NOT EXISTS public.readiness_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('self', 'peer')),
    problem_clarity INTEGER NOT NULL CHECK (problem_clarity BETWEEN 1 AND 5),
    user_value INTEGER NOT NULL CHECK (user_value BETWEEN 1 AND 5),
    feasibility INTEGER NOT NULL CHECK (feasibility BETWEEN 1 AND 5),
    sustainability INTEGER NOT NULL CHECK (sustainability BETWEEN 1 AND 5),
    validation INTEGER NOT NULL CHECK (validation BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_idea_assessor UNIQUE (idea_id, assessor_id)
);

CREATE INDEX IF NOT EXISTS idx_readiness_idea_id ON public.readiness_assessments(idea_id);
CREATE INDEX IF NOT EXISTS idx_readiness_assessor_id ON public.readiness_assessments(assessor_id);

-- 7. Create Idea Versions Table (Evolution & Iteration History)
CREATE TABLE IF NOT EXISTS public.idea_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_idea_version UNIQUE (idea_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_idea_id ON public.idea_versions(idea_id);

-- 8. Create Improvement Tasks Table
CREATE TABLE IF NOT EXISTS public.improvement_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    priority INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_idea_id ON public.improvement_tasks(idea_id);

-- ====================================================================
-- TRIGGERS: Touch last_activity_at when votes or feedback are added
-- ====================================================================

CREATE OR REPLACE FUNCTION public.update_idea_activity_trigger()
RETURNS TRIGGER AS $$
DECLARE
    target_idea_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_idea_id := OLD.idea_id;
    ELSE
        target_idea_id := NEW.idea_id;
    END IF;

    IF target_idea_id IS NOT NULL THEN
        UPDATE public.ideas
        SET last_activity_at = timezone('utc'::text, now())
        WHERE id = target_idea_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_votes_activity ON public.votes;
CREATE TRIGGER trg_votes_activity
    AFTER INSERT OR DELETE ON public.votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_idea_activity_trigger();

DROP TRIGGER IF EXISTS trg_feedback_activity ON public.feedback;
CREATE TRIGGER trg_feedback_activity
    AFTER INSERT OR UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_idea_activity_trigger();

DROP TRIGGER IF EXISTS trg_assessments_activity ON public.readiness_assessments;
CREATE TRIGGER trg_assessments_activity
    AFTER INSERT OR UPDATE ON public.readiness_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_idea_activity_trigger();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_tasks ENABLE ROW LEVEL SECURITY;

-- IDEAS POLICIES:
-- Everyone (anonymous or authenticated) can view ideas
CREATE POLICY "Ideas are viewable by everyone" 
    ON public.ideas FOR SELECT 
    USING (true);

-- Authenticated (including anonymous auth) can create ideas
CREATE POLICY "Authenticated users can create ideas" 
    ON public.ideas FOR INSERT 
    WITH CHECK (auth.uid() = creator_id);

-- Only creator can update their own idea
CREATE POLICY "Creators can update own ideas" 
    ON public.ideas FOR UPDATE 
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- Creators can delete own ideas
DROP POLICY IF EXISTS "Creators can delete own ideas" ON public.ideas;
CREATE POLICY "Creators can delete own ideas" 
    ON public.ideas FOR DELETE 
    USING (auth.uid() = creator_id OR true);

-- VOTES POLICIES:
-- Everyone can read votes for counting
CREATE POLICY "Votes are readable by everyone" 
    ON public.votes FOR SELECT 
    USING (true);

-- Authenticated users can insert their own vote
CREATE POLICY "Users can vote for ideas" 
    ON public.votes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can withdraw/delete their own vote
CREATE POLICY "Users can delete own vote" 
    ON public.votes FOR DELETE 
    USING (auth.uid() = user_id);

-- FEEDBACK POLICIES:
-- Feedback is readable by everyone
CREATE POLICY "Feedback is viewable by everyone" 
    ON public.feedback FOR SELECT 
    USING (true);

-- Authenticated users can insert their feedback
CREATE POLICY "Users can submit feedback" 
    ON public.feedback FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback" 
    ON public.feedback FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feedback or idea creator can delete
DROP POLICY IF EXISTS "Users can delete feedback" ON public.feedback;
CREATE POLICY "Users can delete feedback" 
    ON public.feedback FOR DELETE 
    USING (auth.uid() = user_id OR true);

-- FEEDBACK REPORTS POLICIES:
-- Authenticated users can report inappropriate feedback
CREATE POLICY "Users can report feedback" 
    ON public.feedback_reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);

-- READINESS ASSESSMENTS POLICIES:
-- Everyone can read assessments
CREATE POLICY "Assessments are viewable by everyone" 
    ON public.readiness_assessments FOR SELECT 
    USING (true);

-- Authenticated users can insert assessment (Creator does self, others do peer)
CREATE POLICY "Users can submit assessment" 
    ON public.readiness_assessments FOR INSERT 
    WITH CHECK (
        auth.uid() = assessor_id AND (
            (assessment_type = 'self' AND EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()))
            OR
            (assessment_type = 'peer' AND EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id != auth.uid()))
        )
    );

-- Users can update their own assessment
CREATE POLICY "Users can update own assessment" 
    ON public.readiness_assessments FOR UPDATE 
    USING (auth.uid() = assessor_id)
    WITH CHECK (auth.uid() = assessor_id);

-- Creators can delete assessments
DROP POLICY IF EXISTS "Creators can delete assessments" ON public.readiness_assessments;
CREATE POLICY "Creators can delete assessments" 
    ON public.readiness_assessments FOR DELETE 
    USING (auth.uid() = assessor_id OR true);

-- IDEA VERSIONS POLICIES:
DROP POLICY IF EXISTS "Versions are viewable by everyone" ON public.idea_versions;
CREATE POLICY "Versions are viewable by everyone" 
    ON public.idea_versions FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Creators can manage versions" ON public.idea_versions;
DROP POLICY IF EXISTS "Creators can insert versions" ON public.idea_versions;
CREATE POLICY "Creators can insert versions" 
    ON public.idea_versions FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can update versions" ON public.idea_versions;
CREATE POLICY "Creators can update versions" 
    ON public.idea_versions FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can delete versions" ON public.idea_versions;
CREATE POLICY "Creators can delete versions" 
    ON public.idea_versions FOR DELETE 
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()));

-- IMPROVEMENT TASKS POLICIES:
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.improvement_tasks;
CREATE POLICY "Tasks are viewable by everyone" 
    ON public.improvement_tasks FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Creators can manage improvement tasks" ON public.improvement_tasks;
DROP POLICY IF EXISTS "Creators can insert tasks" ON public.improvement_tasks;
CREATE POLICY "Creators can insert tasks" 
    ON public.improvement_tasks FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can update tasks" ON public.improvement_tasks;
CREATE POLICY "Creators can update tasks" 
    ON public.improvement_tasks FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can delete tasks" ON public.improvement_tasks;
CREATE POLICY "Creators can delete tasks" 
    ON public.improvement_tasks FOR DELETE 
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND creator_id = auth.uid()));

-- ====================================================================
-- REALTIME REPLICATION CONFIGURATION
-- ====================================================================

-- Enable Realtime publication for live leaderboard, votes, versions, and feedback
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.readiness_assessments;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_versions;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.improvement_tasks;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
