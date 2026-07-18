import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FileDown, ChevronLeft, ArrowRight, BarChart2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePipeline } from '../context/PipelineContext';

const scoreColor = (score) => (score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500');
const scoreBg = (score) =>
  score >= 80
    ? 'bg-emerald-500'
    : score >= 50
      ? 'bg-amber-500'
      : 'bg-red-500';

const EvaluationResult = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const { variants } = usePipeline();

  const scoredVariants = variants.filter((v) => v.score);

  if (scoredVariants.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen w-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
        <p className="mb-4 text-lg">No scored variants yet.</p>
        <button
          onClick={() => navigate('/new')}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
        >
          Start a new prompt
        </button>
      </div>
    );
  }

  // scoredVariants is already sorted by overallScore (server-side) - slice rather than
  // filter by object identity, since `winner` and `variants[0]` are separate object
  // instances after the JSON round-trip even when they're the same logical variant.
  const best = scoredVariants[0];
  const others = scoredVariants.slice(1);

  const avgOverall = scoredVariants.reduce((sum, v) => sum + v.score.overallScore, 0) / scoredVariants.length;
  const avgPersona =
    scoredVariants.filter((v) => v.score.personaScore !== null).reduce((sum, v) => sum + (v.score.personaScore || 0), 0) /
    (scoredVariants.filter((v) => v.score.personaScore !== null).length || 1);

  const handleDownload = () => {
    console.log('Downloading evaluation results...');
    alert('Download started! (This is just a demo)');
  };

  const handleVisualize = () => {
    navigate('/visualization');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      <header className={`sticky top-0 z-10 shadow-sm py-4 ${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              onClick={() => navigate('/')}
            >
              <ChevronLeft size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
            </motion.button>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>Evaluation Results</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Scored live by Doubleword (persona check) plus deterministic checks
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVisualize}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition-colors shadow-sm`}
            >
              <BarChart2 size={18} />
              <span>Visualize</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors shadow-sm`}
            >
              <FileDown size={18} />
              <span>Download</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}
        >
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Performance Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Average Score</h3>
              <div className="flex items-center">
                <span className={`text-3xl font-bold ${scoreColor(avgOverall)}`}>{avgOverall.toFixed(1)}</span>
                <span className="text-xs ml-1 text-gray-400 self-end mb-1">/100</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Average Persona Score</h3>
              <div className="flex items-center">
                <span className={`text-3xl font-bold ${scoreColor(avgPersona * 10)}`}>{avgPersona.toFixed(1)}</span>
                <span className="text-xs ml-1 text-gray-400 self-end mb-1">/10</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Winner Score</h3>
              <div className="flex items-center">
                <span className={`text-3xl font-bold ${scoreColor(best.score.overallScore)}`}>{best.score.overallScore}</span>
                <span className="text-xs ml-1 text-gray-400 self-end mb-1">/100</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Detailed Results</h2>
          <div className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {scoredVariants.length} variants
          </div>
        </div>

        {/* Winning variant highlighted */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-8">
          <div className={`relative rounded-lg overflow-hidden border-2 ${isDarkMode ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-400'}`}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>

            <div className="p-4 flex items-center">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-blue-600">
                <span className="text-white text-sm font-bold">BEST</span>
              </div>

              <div className="flex-grow ml-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-blue-800'}`}>
                        {best.backendLabel} &times; {best.frontendLabel}
                      </h3>
                      {best.previewUrl && (
                        <a
                          href={best.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Open live preview <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Overall:</span>
                        <span className="text-sm font-bold text-emerald-500">{best.score.overallScore}</span>
                      </div>
                      {best.score.personaScore !== null && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Persona:</span>
                          <span className="text-sm font-bold text-emerald-500">{best.score.personaScore}/10</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Load time:</span>
                        <span className="text-sm font-bold text-emerald-500">{best.score.loadTimeMs ?? '—'}ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {best.score.personaVerdict && (
                  <div className="mt-3">
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{best.score.personaVerdict}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {others.length > 0 && (
          <>
            <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Other Variants</h2>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="visible">
              {others.map((result, index) => (
                <motion.div
                  key={`${result.backendLabel}-${result.frontendLabel}`}
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className={`rounded-lg shadow-sm overflow-hidden border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-md transition-all`}
                >
                  <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          #{index + 2}
                        </span>
                        <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {result.backendLabel} &times; {result.frontendLabel}
                        </h2>
                      </div>

                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        result.score.overallScore >= 80
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : result.score.overallScore >= 50
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {result.score.overallScore}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall Score</span>
                        <span className={`text-sm font-bold ${scoreColor(result.score.overallScore)}`}>{result.score.overallScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.score.overallScore}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={`h-full rounded-full ${scoreBg(result.score.overallScore)}`}
                        ></motion.div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${result.score.loadsOk ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {result.score.loadsOk ? 'Loads OK' : 'Failed to load'}
                      </span>
                      {result.score.hasKeyElements && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Key elements</span>
                      )}
                      {result.score.mobileFriendly && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Mobile-friendly</span>
                      )}
                    </div>

                    {result.score.personaVerdict && (
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-3`}>{result.score.personaVerdict}</p>
                    )}

                    <div className="mt-3 flex justify-end">
                      {result.previewUrl && (
                        <a
                          href={result.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs font-medium flex items-center gap-1 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          Open preview
                          <ArrowRight size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default EvaluationResult;
