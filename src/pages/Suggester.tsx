import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Rocket, ArrowLeft, AlertCircle, ExternalLink, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { usePipeline } from '../context/PipelineContext';

export const SuggestorPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { prompt, trends, suggestions, suggesting, suggestError, fetchSuggestions } = usePipeline();

  useEffect(() => {
    if (!suggesting && suggestions.length === 0 && !suggestError && prompt) {
      fetchSuggestions();
    }
    // Only fetch once on arrival (or once prompt becomes available) - not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-50' : 'bg-[#343541]'}`}>
      {/* Header */}
      <div className={`${theme === 'light' ? 'bg-white/80 backdrop-blur-sm border-b border-blue-100' : 'bg-[#40414F] border-b border-gray-700'} py-4 px-6 shadow-sm`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 rounded-full ${theme === 'light' ? 'hover:bg-blue-50 text-blue-600' : 'hover:bg-gray-700 text-gray-300'} transition-colors`}
              onClick={() => navigate('/visualization')}
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className={`text-2xl font-bold ${theme === 'light' ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent' : 'text-white'}`}>
                Strategic Recommendations
              </h1>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                Grounded in real trend data scraped by Oxylabs, reasoned over by ai&amp;
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={suggesting}
            onClick={() => fetchSuggestions()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all disabled:opacity-50 shadow-sm ${
              theme === 'light' ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            <motion.div animate={suggesting ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.6, repeat: suggesting ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw className="w-5 h-5" />
            </motion.div>
            {suggesting ? 'Scraping trends + reasoning...' : 'Regenerate'}
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {suggestError && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-300">Couldn't fetch suggestions</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{suggestError}</p>
            </div>
          </div>
        )}

        {trends.length > 0 && (
          <div className={`mb-8 p-4 rounded-xl ${theme === 'light' ? 'bg-white/80 border border-blue-100' : 'bg-[#40414F] border border-gray-700'}`}>
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              <TrendingUp size={16} />
              Real trends used (via Oxylabs)
            </h3>
            <div className="flex flex-wrap gap-2">
              {trends.map((t) => (
                <a
                  key={t.url}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 ${
                    theme === 'light' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                  }`}
                >
                  {t.title}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        )}

        {suggesting && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="animate-spin mb-4 text-blue-500" size={32} />
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Scraping current trends and reasoning over them...</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={suggestions.length}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={`${suggestion.title}-${index}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className={`rounded-2xl shadow-sm p-6 relative hover:shadow-md transition-all h-full flex flex-col ${
                  theme === 'light' ? 'bg-white/90 backdrop-blur-sm border border-blue-100' : 'bg-[#40414F] border border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-blue-700' : 'text-white'}`}>{suggestion.title}</h2>
                  <Rocket className={`${theme === 'light' ? 'text-blue-500' : 'text-blue-400'} h-5 w-5 flex-shrink-0`} />
                </div>

                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{suggestion.reason}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SuggestorPage;
