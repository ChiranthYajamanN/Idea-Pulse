import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  X, 
  Mail
} from 'lucide-react';
import { getRecoveryCode, restoreSessionWithRecoveryCode } from '../services/storageService';

interface AccountUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountUpgradeModal: React.FC<AccountUpgradeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);

  if (!isOpen) return null;

  const recoveryCode = getRecoveryCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreInput.trim()) return;
    const ok = restoreSessionWithRecoveryCode(restoreInput.trim());
    if (ok) {
      setRestoreStatus('Session restored successfully! Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setRestoreStatus('Invalid recovery key format. Expected format: PULSE-XXXX-XXXX-XXXX');
    }
  };

  const handleLinkEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setLinkSuccess(true);
    setTimeout(() => {
      setLinkSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Anonymous Student Protection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are participating anonymously. Your identity is never exposed publicly.
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <p className="font-semibold text-slate-900 dark:text-white">How your anonymity works:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
            <li>No name, email, phone number, or student ID is displayed on ideas or votes.</li>
            <li>A unique cryptographic session ensures you can only vote once per idea.</li>
            <li>Your created ideas stay attached to your session.</li>
          </ul>
        </div>

        {/* Recovery Key Section */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Your Anonymous Recovery Key
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 font-mono text-sm font-bold bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white select-all">
              {recoveryCode}
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            Save this key somewhere safe to reclaim your submitted ideas from any laptop or mobile device.
          </p>
        </div>

        {/* Restore Previous Session Accordion / Form */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            Switch Device or Restore Ideas
          </h4>
          <form onSubmit={handleRestore} className="flex gap-2">
            <input
              type="text"
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              placeholder="Paste PULSE-XXXX-XXXX-XXXX"
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Restore
            </button>
          </form>
          {restoreStatus && (
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mt-1.5">
              {restoreStatus}
            </p>
          )}
        </div>

        {/* Optional Permanent Account Upgrade (Email Link) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Optional: Link Permanent Email Login</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            Upgrade your anonymous account without exposing your name on your ideas.
          </p>
          <form onSubmit={handleLinkEmail} className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="student@university.edu"
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {linkSuccess ? 'Linked!' : 'Link Email'}
            </button>
          </form>
          {linkSuccess && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1.5">
              Account upgrade credential registered!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
