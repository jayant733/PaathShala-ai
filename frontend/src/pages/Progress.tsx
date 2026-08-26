import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mlApi, type MasterySummary, type QuizMasterySummary, type TopicMastery } from '../api/ml.api';
import { Loader2, X } from 'lucide-react';

export default function Progress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mastery, setMastery] = useState<MasterySummary | null>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizMasterySummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | undefined>(undefined);
  
  // State for the exact details modal
  const [selectedTopic, setSelectedTopic] = useState<TopicMastery | null>(null);

  const fetchData = useCallback(async (quizId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [masteryRes, quizzesRes] = await Promise.all([
        mlApi.getMastery(quizId),
        mlApi.getLearningPathQuizzes(),
      ]);
      setMastery(masteryRes);
      setAvailableQuizzes(quizzesRes.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedQuizId);
  }, [fetchData, selectedQuizId]);

  // Aggregate stats based on selection
  const selectedQuiz = useMemo(() => 
    availableQuizzes.find(q => q.quiz_id === selectedQuizId),
  [availableQuizzes, selectedQuizId]);

  const displayTitle = selectedQuizId ? selectedQuiz?.quiz_title : 'Overall Mastery';
  const displayAvgMastery = selectedQuizId ? (selectedQuiz?.mastery ?? 0) : (mastery?.average_mastery ?? 0);
  const displayTopicCount = selectedQuizId ? (selectedQuiz?.topic_count ?? 0) : (mastery?.topics.length ?? 0);
  const displayTopics = mastery?.topics ?? [];

  return (
    <div className="flex flex-col w-full px-margin-desktop py-16 gap-16 relative bg-background min-h-[calc(100vh-80px)]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-gradient-to-t from-secondary/5 to-transparent pointer-events-none -z-10"></div>

      {/* Header Section */}
      <div className="flex flex-col gap-4 max-w-4xl relative">
        <div className="absolute -left-12 top-4 w-4 h-32 bg-primary transform -skew-y-12"></div>
        <h1 className="font-display-lg text-display-lg text-on-background relative">
          <span className="relative z-10">My Learning Analytics</span>
          <div className="absolute -bottom-2 left-0 w-full h-8 bg-secondary/30 -z-0 transform skew-x-12"></div>
        </h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest pl-4 border-l-4 border-secondary border-solid bg-surface-container-low py-2">
          Powered by IRT · Elo Ratings · SM-2 Spaced Repetition · Ebbinghaus Forgetting Curve
        </p>
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container font-body-md border-2 border-surface-border">
          {error}
        </div>
      )}

      {loading && !availableQuizzes.length ? (
         <div className="flex justify-center p-20"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>
      ) : (
        <>
          {/* Filters & Summary Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Filters Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <h3 className="font-headline-lg text-[20px] text-on-background uppercase tracking-tight relative inline-block border-b-2 border-surface-border pb-2">
                <span className="material-symbols-outlined align-middle mr-2 text-primary">filter_list</span>Filters
              </h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setSelectedQuizId(undefined)}
                  className={`w-full text-left px-4 py-3 font-button-text text-button-text border-2 border-surface-border transition-all flex items-center justify-between ${selectedQuizId === undefined ? 'bg-primary text-on-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group' : 'bg-surface text-on-surface hover:bg-surface-container-high hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  <span>All Quizzes</span>
                  {selectedQuizId === undefined && <span className="material-symbols-outlined transition-transform group-hover:rotate-12">arrow_forward</span>}
                </button>
                {availableQuizzes.map(q => (
                  <button 
                    key={q.quiz_id}
                    onClick={() => setSelectedQuizId(q.quiz_id)}
                    className={`w-full text-left px-4 py-3 font-button-text text-button-text border-2 border-surface-border transition-all flex items-center justify-between ${selectedQuizId === q.quiz_id ? 'bg-primary text-on-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group' : 'bg-surface text-on-surface hover:bg-surface-container-high hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                  >
                    <span className="truncate">{q.quiz_title}</span>
                    {selectedQuizId === q.quiz_id && <span className="material-symbols-outlined transition-transform group-hover:rotate-12">arrow_forward</span>}
                  </button>
                ))}
              </div>

              {/* Reference Image */}
              <div className="mt-8 border-2 border-surface-border p-2 bg-surface-container shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 hover:rotate-0 transition-transform hidden lg:block">
                <img alt="Original Learning Analytics Dashboard Reference" className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all border-2 border-surface-border" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnTkPfmytTCGUe9gAxAj6vqdSFc_mFL6HEolDtjQO90dyz180-xIVrsYvHECSHKMirK1vM-vDCYGhSIFVowhHMs8ySiplgrIHlfY1NIajx4mVZMxWBTzH6mSDZTHU268IjiwzYUYYpr2apCjhwNgDOHNfhk6K2RFWESal4lmE6F-3JsE2hCeoRR1rXdlXPMhLR4v-GF1VAXNiTTWM348I1uCeBBr4y894lWXC4tqffoE6yHY9n1hvcT5K4fb0BTP73Qw"/>
                <p className="font-label-caps text-[10px] text-center mt-2 text-on-surface-variant">Original Reference</p>
              </div>
            </div>

            {/* Summary Content */}
            <div className="lg:col-span-9 flex flex-col gap-8">
              {/* Summary Card */}
              <div 
                className={`bg-surface-container-low border-4 border-surface-border p-8 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group ${selectedQuizId ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all' : ''}`}
                onClick={() => { if (selectedQuizId) navigate(`/learning-path/quiz/${selectedQuizId}`) }}
              >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10 border-b-2 border-surface-border pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary flex items-center justify-center border-2 border-surface-border transform -rotate-6">
                      <span className="material-symbols-outlined text-on-secondary text-headline-lg">monitoring</span>
                    </div>
                    <h2 className="font-headline-xl text-headline-xl text-on-background">{displayTitle || 'Knowledge Profile'}</h2>
                  </div>
                  {selectedQuizId && (
                    <span className="px-4 py-1 bg-mint-accent border-2 border-surface-border font-label-caps text-label-caps text-ink-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Active</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="flex flex-col gap-2">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Average Mastery</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display-lg text-[64px] text-primary">{Math.round(displayAvgMastery * 100)}%</span>
                      {displayAvgMastery > 0.5 ? (
                        <span className="material-symbols-outlined text-secondary transform rotate-45 text-[32px]">arrow_upward</span>
                      ) : (
                         <span className="material-symbols-outlined text-error transform rotate-135 text-[32px]">arrow_downward</span>
                      )}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-4 bg-surface-border border-2 border-surface-border mt-2 relative overflow-hidden rounded-full">
                      <div className="h-full bg-secondary relative transition-all duration-700 ease-out" style={{ width: `${Math.round(displayAvgMastery * 100)}%` }}>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-l-4 border-surface-border pl-8">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Topics Tracked</span>
                    <span className="font-display-lg text-[64px] text-on-background">{displayTopicCount}</span>
                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {displayTopics.slice(0, 15).map(t => (
                        <button 
                          type="button"
                          key={t.topic} 
                          onClick={(e) => { e.stopPropagation(); setSelectedTopic(t); }}
                          className="px-2 py-1 bg-surface border-2 border-surface-border font-label-caps text-[10px] uppercase hover:bg-secondary-container hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer relative z-20"
                        >
                          {t.topic}
                        </button>
                      ))}
                      {displayTopics.length > 15 && (
                        <span className="px-2 py-1 bg-surface-container-high border border-surface-border font-label-caps text-[10px] uppercase">
                          +{displayTopics.length - 15} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Models Section */}
          <div className="mt-section-gap flex flex-col gap-12">
            <div className="flex flex-col gap-2 relative">
              <div className="absolute -left-margin-desktop w-[120%] h-px bg-surface-border top-1/2 -z-10 opacity-20"></div>
              <span className="bg-background inline-block px-4 font-label-caps text-label-caps text-secondary uppercase tracking-widest border-2 border-surface-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-max mx-auto mb-4">Under The Hood</span>
              <h2 className="font-headline-xl text-headline-xl text-center text-on-background bg-background inline-block px-8 mx-auto">Adaptive Learning Engine</h2>
              <p className="font-body-lg text-body-lg text-center text-on-surface-variant max-w-2xl mx-auto bg-background px-4">ML Models Powering Your Analytics</p>
            </div>

            {/* Technical Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* IRT Card */}
              <div className="bg-surface-container border-2 border-surface-border p-6 flex flex-col gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary opacity-5 rounded-bl-full pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary flex items-center justify-center border-2 border-surface-border text-on-primary font-headline-lg text-[20px]">1</div>
                  <h3 className="font-headline-lg text-[24px] text-on-background">Item Response Theory (IRT)</h3>
                </div>
                <div className="bg-ink-black text-on-error p-4 border-l-4 border-secondary font-label-caps font-mono overflow-x-auto relative">
                  <div className="absolute top-0 right-0 px-2 py-1 bg-surface-border text-on-primary text-[10px] uppercase tracking-widest">Formula</div>
                  P(correct) = 1 / (1 + e^-(θ - b))
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Estimates the probability of a correct response based on the learner's true ability (θ) and the question's underlying difficulty (b). It ensures that your mastery score isn't just about how many questions you answered, but which questions you were able to solve.
                </p>
              </div>

              {/* Elo Rating Card */}
              <div className="bg-surface-container border-2 border-surface-border p-6 flex flex-col gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary opacity-10 rounded-bl-full pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary flex items-center justify-center border-2 border-surface-border text-on-secondary font-headline-lg text-[20px]">2</div>
                  <h3 className="font-headline-lg text-[24px] text-on-background">Elo Rating System</h3>
                </div>
                <div className="bg-ink-black text-on-error p-4 border-l-4 border-primary font-label-caps font-mono overflow-x-auto relative">
                  <div className="absolute top-0 right-0 px-2 py-1 bg-surface-border text-on-primary text-[10px] uppercase tracking-widest">Formula</div>
                  Δ = K · (outcome - E(outcome))
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Continuously updates the difficulty rating of each question based on actual learner performance. If many strong learners miss a specific question, its difficulty rating increases automatically, keeping the assessment challenging and calibrated.
                </p>
              </div>

              {/* Ebbinghaus Card */}
              <div className="bg-surface-container border-2 border-surface-border p-6 flex flex-col gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300 group relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-container opacity-10 rounded-tl-full pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-tint flex items-center justify-center border-2 border-surface-border text-on-primary font-headline-lg text-[20px]">3</div>
                  <h3 className="font-headline-lg text-[24px] text-on-background">Ebbinghaus Forgetting Curve</h3>
                </div>
                <div className="bg-ink-black text-on-error p-4 border-l-4 border-error font-label-caps font-mono overflow-x-auto relative">
                  <div className="absolute top-0 right-0 px-2 py-1 bg-surface-border text-on-primary text-[10px] uppercase tracking-widest">Formula</div>
                  R(t) = e^-λt
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Models how memory retention declines over time. The system calculates exactly when you are most likely to forget a concept, prompting you to review it just before memory decay sets in, optimizing study efficiency.
                </p>
              </div>

              {/* SM-2 Card */}
              <div className="bg-surface-container border-2 border-surface-border p-6 flex flex-col gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300 group relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-tertiary opacity-10 rounded-tl-full pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tertiary flex items-center justify-center border-2 border-surface-border text-on-tertiary font-headline-lg text-[20px]">4</div>
                  <h3 className="font-headline-lg text-[24px] text-on-background">SM-2 Spaced Repetition</h3>
                </div>
                <div className="bg-ink-black text-on-error p-4 border-l-4 border-mint-accent font-label-caps font-mono overflow-x-auto relative">
                  <div className="absolute top-0 right-0 px-2 py-1 bg-surface-border text-on-primary text-[10px] uppercase tracking-widest">Formula</div>
                  I(n) = I(n-1) × EF
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Schedules review intervals based on your past performance. An increasing interval (I) is calculated using an Easiness Factor (EF) that adjusts depending on how smoothly you recalled the information during previous sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Topic Modal */}
          {selectedTopic && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-border/50 backdrop-blur-sm">
              <div className="bg-surface border-4 border-surface-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full relative animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="border-b-4 border-surface-border p-6 flex justify-between items-start bg-secondary-container">
                  <div>
                    <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 block">Topic Details</span>
                    <h3 className="font-headline-lg text-[28px] text-on-surface leading-none">{selectedTopic.topic}</h3>
                  </div>
                  <button onClick={() => setSelectedTopic(null)} className="w-8 h-8 flex items-center justify-center border-2 border-surface-border bg-surface hover:bg-error hover:text-on-error hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Stats */}
                <div className="p-6 grid grid-cols-2 gap-6">
                  
                  {/* Mastery */}
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Mastery</span>
                    <span className="font-display-lg text-[40px] text-primary leading-none">{Math.round(selectedTopic.mastery * 100)}%</span>
                  </div>

                  {/* Accuracy */}
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Accuracy</span>
                    <span className="font-display-lg text-[40px] text-on-background leading-none">
                      {selectedTopic.attempts > 0 ? Math.round((selectedTopic.correct_count / selectedTopic.attempts) * 100) : 0}%
                    </span>
                    <span className="font-label-caps text-[10px] text-on-surface-variant">({selectedTopic.correct_count} correct / {selectedTopic.wrong_count} wrong)</span>
                  </div>

                  {/* ELO Rating */}
                  <div className="flex flex-col gap-1 col-span-1 p-3 border-2 border-surface-border bg-surface-container">
                    <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Elo Rating</span>
                    <span className="font-headline-lg text-[24px] text-secondary">{Math.round(selectedTopic.elo_rating)}</span>
                  </div>

                  {/* Confidence */}
                  <div className="flex flex-col gap-1 col-span-1 p-3 border-2 border-surface-border bg-surface-container">
                    <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Confidence</span>
                    <span className="font-headline-lg text-[24px] text-on-surface">{Math.round(selectedTopic.confidence * 100)}%</span>
                  </div>

                  {/* IRT P(correct) */}
                  <div className="col-span-2 p-3 border-2 border-surface-border bg-ink-black text-on-error flex justify-between items-center">
                    <span className="font-label-caps text-[10px] uppercase">IRT P(Correct)</span>
                    <span className="font-headline-lg text-[20px] text-primary-fixed">{selectedTopic.p_correct !== null ? Math.round(selectedTopic.p_correct * 100) : '--'}%</span>
                  </div>

                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <button 
                    onClick={() => navigate(`/quizzes/create?prompt=${encodeURIComponent(`Practice quiz on ${selectedTopic.topic}`)}`)}
                    className="w-full bg-primary text-on-primary font-button-text py-3 border-2 border-surface-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                    Practice Topic
                  </button>
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
