import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge,
  Clock,
  ListChecks,
  Smartphone,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { usePipeline } from '../context/PipelineContext';

// The 5 real signals scored server-side (server/services/scoring.ts) - shown here
// as a checklist while the real request is in flight, not a fake per-item timer.
const scoringSignals = [
  { id: 'loads', title: 'Loads without errors', icon: Gauge },
  { id: 'load-time', title: 'Load time', icon: Clock },
  { id: 'key-elements', title: 'Key elements present', icon: ListChecks },
  { id: 'mobile', title: 'Mobile-friendly', icon: Smartphone },
  { id: 'persona', title: 'Persona check (Doubleword)', icon: Users },
];

const EvaluateModal = ({ isOpen, onClose, onComplete }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { scoring, scoreError, scoreVariants } = usePipeline();

  useEffect(() => {
    if (isOpen) {
      scoreVariants().then(() => {
        if (onComplete) onComplete();
      });
    }
    // Only re-run when the modal is (re)opened, not on every scoreVariants identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleViewResults = () => {
    onClose();
    navigate('/evaluation-results');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="font-bold text-2xl">
          <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
            Evaluating Variants
          </span>
        </div>
      }
    >
      <div className="py-2 px-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Scoring each variant live with Doubleword (persona check, running on Nosana GPU compute) plus a few deterministic checks.
        </p>

        <div className="mb-6 space-y-3">
          {scoringSignals.map((signal) => {
            const Icon = signal.icon;
            return (
              <div key={signal.id} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    scoring
                      ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400'
                      : 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                  }`}
                >
                  {scoring ? <Icon size={18} /> : <CheckCircle size={18} />}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{signal.title}</span>
                {scoring && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-cyan-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {scoreError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-3"
            >
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-300">Scoring failed</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{scoreError}</p>
              </div>
            </motion.div>
          )}

          {!scoring && !scoreError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800"
            >
              <div className="flex items-center">
                <CheckCircle className="text-teal-500 mr-3" size={24} />
                <div>
                  <h3 className="font-semibold text-teal-700 dark:text-teal-300">Evaluation Complete!</h3>
                  <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                    All variants scored and ranked.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleViewResults}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              scoring
                ? 'bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white hover:opacity-90 dark:from-blue-600 dark:via-cyan-700 dark:to-teal-700'
            }`}
            disabled={scoring}
          >
            View Evaluation Result
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EvaluateModal;
