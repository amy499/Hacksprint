import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { usePipeline } from '../context/PipelineContext';
import EvaluateModal from '../components/EvaluateModal';

const BackendFrontendOverview = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { prompt, variants, generating, generateError } = usePipeline();
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);

  // If someone lands here directly without a prompt in flight, send them back.
  useEffect(() => {
    if (!generating && !prompt && variants.length === 0) {
      navigate('/new');
    }
  }, [generating, prompt, variants.length, navigate]);

  const succeededCount = variants.filter((v) => v.previewUrl && !v.error).length;

  return (
    <div
      className={`relative w-full min-h-screen px-4 py-8 ${
        theme === 'light' ? 'bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-50' : 'bg-[#343541]'
      }`}
    >
      <h2
        className={`text-3xl font-bold text-center mb-3 ${
          theme === 'light'
            ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent'
            : 'text-white'
        }`}
      >
        Your Variants
      </h2>
      <p className={`text-center mb-12 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
        "{prompt}"
      </p>

      {generating && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className={`animate-spin mb-4 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} size={40} />
          <p className={`text-lg font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            Generating variants with ai&amp; and running them in live Daytona sandboxes...
          </p>
          <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
            This can take up to a minute for all 4 variants.
          </p>
        </div>
      )}

      {!generating && generateError && (
        <div className="max-w-xl mx-auto p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={22} />
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-300">Generation failed</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{generateError}</p>
            <button
              onClick={() => navigate('/new')}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Try a different prompt
            </button>
          </div>
        </div>
      )}

      {!generating && !generateError && variants.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {variants.map((variant, index) => (
              <motion.div
                key={`${variant.backendLabel}-${variant.frontendLabel}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`rounded-lg shadow-lg overflow-hidden ${
                  theme === 'light' ? 'bg-white/90 border border-blue-100' : 'bg-[#40414F] border border-gray-700'
                }`}
              >
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${theme === 'light' ? 'text-blue-700' : 'text-white'}`}>
                      {variant.backendLabel} &times; {variant.frontendLabel}
                    </h3>
                  </div>
                  {variant.previewUrl && !variant.error && (
                    <a
                      href={variant.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      Open <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {variant.error ? (
                  <div className="mx-4 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-start gap-2">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-red-600 dark:text-red-400">{variant.error}</p>
                  </div>
                ) : (
                  <iframe
                    title={`${variant.backendLabel} x ${variant.frontendLabel} preview`}
                    src={variant.previewUrl}
                    className="w-full h-64 border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className={`px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white'
                  : 'bg-blue-600 text-white'
              } hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100`}
              onClick={() => setShowEvaluateModal(true)}
              disabled={succeededCount === 0}
            >
              <span className="text-lg font-semibold">Evaluate</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          </div>
        </>
      )}

      <EvaluateModal
        isOpen={showEvaluateModal}
        onClose={() => setShowEvaluateModal(false)}
        onComplete={() => {}}
      />
    </div>
  );
};

export default BackendFrontendOverview;
