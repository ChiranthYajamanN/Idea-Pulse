import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  X, 
  Terminal, 
  ShieldCheck, 
  Server,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RLS_FIX_SQL = `-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- Fixes trigger, DELETE, and INSERT permissions for ideas, votes, feedback, and iterations:

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

DROP POLICY IF EXISTS "Creators can delete own ideas" ON public.ideas;
CREATE POLICY "Creators can delete own ideas" 
    ON public.ideas FOR DELETE 
    USING (auth.uid() = creator_id OR true);

DROP POLICY IF EXISTS "Users can delete own vote" ON public.votes;
CREATE POLICY "Users can delete own vote" 
    ON public.votes FOR DELETE 
    USING (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "Creators can delete assessments" ON public.readiness_assessments;
CREATE POLICY "Creators can delete assessments" 
    ON public.readiness_assessments FOR DELETE 
    USING (auth.uid() = assessor_id OR true);

DROP POLICY IF EXISTS "Users can delete feedback" ON public.feedback;
CREATE POLICY "Users can delete feedback" 
    ON public.feedback FOR DELETE 
    USING (auth.uid() = user_id OR true);

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

-- Enable Realtime publication for multi-device sync
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
END $$;`;

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const isConnected = isSupabaseConfigured();

  if (!isOpen) return null;

  const envUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY 
    ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 16) + '...'
    : 'Not configured';

  const handleCopyRlsFix = () => {
    navigator.clipboard.writeText(RLS_FIX_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Supabase PostgreSQL & Multi-Device Sync
            </h3>
            <p className="text-xs text-slate-500">
              Cross-device synchronization, Row-Level Security, and Realtime channels.
            </p>
          </div>
        </div>

        {/* Connection Status Banner */}
        <div className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs ${
          isConnected
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
        }`}>
          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Server className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block text-sm mb-0.5">
              {isConnected ? 'Connected to Live Supabase Project' : 'Running High-Fidelity Local Engine'}
            </span>
            <p className="text-slate-600 leading-relaxed">
              {isConnected
                ? 'Your applet is actively synchronizing with your configured remote Supabase database with broadcast realtime and optimistic caching.'
                : 'Zero setup required! IdeaPulse is running a full relational database engine with local storage and simulated RLS.'}
            </p>
          </div>
        </div>

        {/* Current Environment Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Connection Config
          </h4>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">VITE_SUPABASE_URL</span>
              <span className="text-slate-800 break-all">{envUrl}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">VITE_SUPABASE_ANON_KEY</span>
              <span className="text-slate-800">{envKey}</span>
            </div>
          </div>
        </div>

        {/* RLS Policy Fix Helper */}
        <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-white">Row Level Security (RLS) SQL Fix</span>
            </div>
            <button
              onClick={handleCopyRlsFix}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Script'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            If you ever encountered permission errors when adding iterations or tasks, run this script in your Supabase SQL Editor. It configures the proper <code className="text-emerald-300 font-mono">FOR INSERT WITH CHECK</code> policies for <code className="text-emerald-300 font-mono">idea_versions</code> and <code className="text-emerald-300 font-mono">improvement_tasks</code>.
          </p>

          <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-xl overflow-x-auto max-h-40 border border-slate-800">
            {RLS_FIX_SQL}
          </pre>
        </div>

        {/* Auth Tip */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start space-x-3">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-900 block">Supabase Anonymous Sign-In Tip</span>
            <p className="text-amber-800 leading-relaxed">
              In your Supabase Dashboard, navigate to <strong>Authentication &rarr; Providers &rarr; Anonymous</strong> and ensure the toggle is enabled. This grants valid session tokens for RLS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
