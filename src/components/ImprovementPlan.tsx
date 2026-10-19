import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Target
} from 'lucide-react';
import { ImprovementTask, TaskStatus, AssessmentScores } from '../types';
import { updateTaskStatus, addTask } from '../services/storageService';

interface ImprovementPlanProps {
  ideaId: string;
  isCreator: boolean;
  tasks: ImprovementTask[];
  scores?: AssessmentScores;
  onTasksUpdated: () => void;
}

export const ImprovementPlan: React.FC<ImprovementPlanProps> = ({
  ideaId,
  isCreator,
  tasks,
  scores: _scores,
  onTasksUpdated,
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleToggleStatus = async (task: ImprovementTask) => {
    if (!isCreator) return;
    const nextStatusMap: Record<TaskStatus, TaskStatus> = {
      not_started: 'in_progress',
      in_progress: 'completed',
      completed: 'not_started',
    };
    const nextStatus = nextStatusMap[task.status];
    await updateTaskStatus(task.id, nextStatus);
    onTasksUpdated();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    await addTask(ideaId, newTaskText.trim());
    setNewTaskText('');
    setIsAdding(false);
    onTasksUpdated();
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Circle className="w-3 h-3 text-slate-400" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
      {/* Plan Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400">
              <Target className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Personalized Improvement Plan
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritized action items derived from readiness assessment parameters & community feedback.
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[180px]">
          <div className="flex justify-between items-center text-xs mb-1 font-bold">
            <span className="text-slate-600 dark:text-slate-300">Action Progress</span>
            <span className="text-indigo-700 dark:text-indigo-400">{completedCount}/{tasks.length} Done ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            onClick={() => handleToggleStatus(task)}
            className={`p-4 rounded-xl border transition flex items-center justify-between gap-3 ${
              isCreator ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500' : 'cursor-default'
            } ${
              task.status === 'completed'
                ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="mt-0.5 w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                P{task.priority || idx + 1}
              </span>
              <div>
                <p className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                  {task.task}
                </p>
                {task.category && (
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-0.5 block">
                    {task.category}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center space-x-2">
              {getStatusBadge(task.status)}
              {isCreator && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                  Click to change
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Task Form (Creator Only) */}
      {isCreator && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          {isAdding ? (
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new milestone or testing goal..."
                autoFocus
                className="flex-1 text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Milestone Task</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
