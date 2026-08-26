import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DashboardService } from '../api/dashboard.service';
import type { Recommendation, LearningStatistics } from '../api/dashboard.service';
import { mlApi, type LearningPathQuizzesResponse } from '../api/ml.api';
import type { ConversationItem } from '../api/chat.api';

// Animated Counter Component
const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    const speed = 200;
    const animate = () => {
      const data = valueRef.current;
      const time = value / speed;
      if (data < value) {
        valueRef.current = Math.ceil(data + time);
        setDisplayValue(valueRef.current);
        setTimeout(animate, 10);
      } else {
        valueRef.current = value;
        setDisplayValue(value);
      }
    };
    animate();
  }, [value]);

  return <span>{displayValue}</span>;
};

const RecommendationSkeleton = () => (
  <div className="flex items-start gap-4 p-4 border-2 border-dashed border-surface-border bg-surface-container/50 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0"></div>
    <div className="flex-1 space-y-2 py-1 w-full">
      <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
      <div className="h-3 bg-surface-container-highest rounded w-full"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const name = user?.email?.split('@')[0] || 'Learner';
  
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [pinnedId, setPinnedId] = useState<string | null>(DashboardService.getPinnedConversationId());
  const [stats, setStats] = useState<LearningStatistics>({ totalMessages: 0 });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [refreshingRecs, setRefreshingRecs] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPathQuizzesResponse | null>(null);
  const [sessionPage, setSessionPage] = useState(0);
  const [quizPage, setQuizPage] = useState(0);

  useEffect(() => {
    const handleStorage = () => {
      setPinnedId(DashboardService.getPinnedConversationId());
    };
    
    const handleSoftRefresh = () => {
      DashboardService.getConversationHistory().then(history => {
        setConversations(history);
        const validPinnedConv = DashboardService.getPinnedConversation(history);
        const activeTargetId = validPinnedConv ? validPinnedConv.id : null;
        DashboardService.getLearningStatistics(activeTargetId).then(setStats);
      });
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('conversationFinished', handleSoftRefresh);
    window.addEventListener('quizCompleted', handleSoftRefresh);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('conversationFinished', handleSoftRefresh);
      window.removeEventListener('quizCompleted', handleSoftRefresh);
    };
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('dashboard_recommendations_cache');
      if (cached) {
        setRecommendations(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Failed to parse cached recommendations', e);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const history = await DashboardService.getConversationHistory();
        setConversations(history);
        const validPinnedConv = DashboardService.getPinnedConversation(history);
        const activeTargetId = validPinnedConv ? validPinnedConv.id : null;
        const statsResult = await DashboardService.getLearningStatistics(activeTargetId);
        setStats(statsResult);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDashboardData();
  }, [token, pinnedId]);

  useEffect(() => {
    mlApi
      .getLearningPathQuizzes()
      .then(setLearningPath)
      .catch(() => setLearningPath(null));
  }, []);

  const handleRefreshRecommendations = async () => {
    setRefreshingRecs(true);
    try {
      const recsResult = await DashboardService.getRecommendations();
      setRecommendations(recsResult);
      localStorage.setItem('dashboard_recommendations_cache', JSON.stringify(recsResult));
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingRecs(false);
    }
  };

  const handlePin = (id: string) => {
    DashboardService.pinConversation(id);
    setPinnedId(id);
  };

  const handleUnpin = () => {
    DashboardService.unpinConversation();
    setPinnedId(null);
  };

  const getExistingConversationForTopic = (topic: string) => {
    return conversations.find(c => c.title.toLowerCase().includes(topic.toLowerCase()));
  };

  const handleStartLearning = (topic: string) => {
    const existingConv = getExistingConversationForTopic(topic);
    if (existingConv) {
      navigate(`/ai-tutor?conversation_id=${existingConv.id}`);
    } else {
      navigate(`/ai-tutor?initial_prompt=${encodeURIComponent(`Help me start learning ${topic}`)}`);
    }
  };
  const isNewUser = conversations.length === 0 && (!learningPath || learningPath.items.length === 0);
  const activeConversation = DashboardService.getPinnedConversation(conversations);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="w-16 h-16 border-4 border-surface-border border-t-primary rounded-full animate-spin shadow-[4px_4px_0_0_#111827]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto p-spacing-gutter md:p-margin-desktop gap-spacing-gutter">
      
      <header className="flex flex-col gap-unit mb-8 w-full max-w-4xl">
        <h1 className="font-display-lg text-[48px] md:text-[64px] font-black text-ink-black tracking-tight leading-tight uppercase">
          {isNewUser ? `Welcome, ${name}` : `Good morning, ${name}`}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl font-bold">
          {isNewUser ? 'Start your first conversation and your learning journey will appear here.' : 'Ready to continue your journey?'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-spacing-gutter">
        {/* LEFT COLUMN: Span 8 */}
        <div className="lg:col-span-8 flex flex-col gap-spacing-gutter">
          
          {/* Learning Path */}
          {!isNewUser && learningPath && learningPath.items.length > 0 && (
            <section className="bg-surface-container-high border-4 border-surface-border p-6 md:p-8 relative shadow-[8px_8px_0_0_#111827]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-ink-black mb-2 uppercase font-black tracking-wider">Learning Path</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant font-bold">Ranked by your weakest, most-tested topics — foundation before advanced.</p>
                </div>
                <div className="flex gap-4 font-label-caps text-label-caps text-ink-black uppercase tracking-widest bg-secondary-container px-4 py-2 border-2 border-surface-border font-bold">
                  <span>{learningPath.items.filter(i => i.status === 'weak').length} weak</span>
                  <span className="text-on-surface-variant/30">•</span>
                  <span>{learningPath.items.filter(i => i.status === 'improving').length} improving</span>
                  <span className="text-on-surface-variant/30">•</span>
                  <span>{learningPath.items.filter(i => i.status === 'strong').length} strong</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {learningPath.items.slice(quizPage, quizPage + 1).map((quiz) => (
                  <div key={quiz.quiz_id} className="bg-surface border-4 border-surface-border p-6 flex flex-col gap-6 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#111827] transition-all group cursor-pointer" onClick={() => navigate(`/learning-path/quiz/${quiz.quiz_id}`)}>
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <h3 className="font-headline-lg text-[24px] font-black text-ink-black mb-1">{quiz.quiz_title}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant">Contains {quiz.topic_count} topics tracked.</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 border-2 border-surface-border ${quiz.status === 'weak' ? 'bg-error-container' : quiz.status === 'improving' ? 'bg-tertiary-container' : 'bg-primary-container'}`}>
                        <span className={`font-label-caps text-label-caps uppercase font-bold ${quiz.status === 'weak' ? 'text-on-error-container' : quiz.status === 'improving' ? 'text-on-tertiary-container' : 'text-on-primary-container'}`}>
                          {quiz.status} • {Math.round(quiz.mastery * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-surface-container h-4 border-2 border-surface-border overflow-hidden relative">
                      <div 
                        className={`absolute left-0 top-0 bottom-0 border-r-2 border-surface-border transition-all duration-1000 ${quiz.status === 'weak' ? 'bg-error' : quiz.status === 'improving' ? 'bg-tertiary' : 'bg-primary'}`} 
                        style={{ width: `${Math.max(5, Math.round(quiz.mastery * 100))}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center w-full">
                      <button className="bg-primary text-on-primary font-button-text text-button-text px-6 py-2 border-2 border-surface-border shadow-[4px_4px_0_0_#111827] flex items-center gap-2 uppercase tracking-wider group-hover:translate-y-[2px] group-hover:translate-x-[2px] group-hover:shadow-[2px_2px_0_0_#111827] transition-all">
                        View Progress
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Quiz Pagination Controls */}
                {learningPath.items.length > 1 && (
                  <div className="flex justify-end gap-4 mt-2">
                    <button
                      onClick={() => setQuizPage(Math.max(0, quizPage - 1))}
                      disabled={quizPage === 0}
                      className="w-12 h-12 flex items-center justify-center bg-surface border-4 border-surface-border shadow-[4px_4px_0_0_#111827] enabled:hover:bg-primary-fixed enabled:hover:translate-x-[-2px] enabled:hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous quiz"
                    >
                      <span className="material-symbols-outlined text-[24px] text-ink-black">arrow_back</span>
                    </button>
                    <button
                      onClick={() => setQuizPage(quizPage + 1)}
                      disabled={quizPage + 1 >= learningPath.items.length}
                      className="w-12 h-12 flex items-center justify-center bg-surface border-4 border-surface-border shadow-[4px_4px_0_0_#111827] enabled:hover:bg-primary-fixed enabled:hover:translate-x-[-2px] enabled:hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next quiz"
                    >
                      <span className="material-symbols-outlined text-[24px] text-ink-black">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Continue Learning */}
          <section className="bg-surface border-4 border-surface-border flex flex-col shadow-[8px_8px_0_0_#111827] transition-all overflow-hidden group">
            <div className="p-6 border-b-4 border-surface-border flex justify-between items-center bg-secondary-container">
              <h2 className="font-headline-lg text-[24px] font-black text-ink-black uppercase tracking-wider">Continue Learning</h2>
              <button 
                onClick={() => activeConversation ? navigate(`/ai-tutor?conversation_id=${activeConversation.id}`) : navigate('/chat')}
                className="font-button-text text-button-text text-ink-black flex items-center gap-1 hover:underline decoration-4 underline-offset-4 uppercase"
              >
                View Path <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
            
            {isNewUser || !activeConversation ? (
              <div className="w-full h-64 bg-surface-container flex flex-col items-center justify-center p-8 text-center relative border-b-4 border-surface-border group-hover:bg-primary/5 transition-colors duration-500 overflow-hidden cursor-pointer" onClick={() => navigate('/chat')}>
                <span className="material-symbols-outlined text-[48px] text-ink-black/20 mb-4">school</span>
                <h4 className="font-headline-lg text-[24px] font-black text-ink-black mb-2 uppercase">Ready to start?</h4>
                <p className="font-body-md text-body-md text-on-surface-variant font-bold max-w-sm">Your first conversation will create your personalized learning path.</p>
                <div className="mt-4 bg-primary text-on-primary font-button-text px-6 py-3 border-4 border-surface-border shadow-[4px_4px_0_0_#111827] uppercase tracking-wider">
                  Start First Session
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-64 bg-ink-black relative border-b-4 border-surface-border group-hover:bg-primary-container transition-colors duration-500 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/ai-tutor?conversation_id=${activeConversation.id}`)}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-700" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6BlQyhrMgvXugAU39v2RHd-rxHbbnjRhHSloaBhTzGeuOmxN_ULUHsZj4CrXTWScs_w4gFZ7XBxJLJfBJxrHrUv_lgwpSCEmsvuofYJ_e2XOr2gZzuO5_myf2FVwusTXIxOlX97wfn_EhS-k8nBMbTZJck8lUBRVZCycWMalmZrOgbzdczVKmkRKvSnKahyjI8KWYV_9U0w-vRE69arBPdIOPxTqxFSpSMAt1yyg4rB_AILE10d3u')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink-black/90 to-transparent"></div>
                <div className="absolute bottom-6 left-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-secondary border-4 border-surface-border shadow-[4px_4px_0_0_#fcfae6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-on-secondary">play_arrow</span>
                  </div>
                  <div>
                    <div className="inline-block bg-primary px-2 py-1 border-2 border-surface-border mb-2 shadow-[2px_2px_0_0_#fcfae6]">
                      <p className="font-label-caps text-label-caps text-on-primary uppercase tracking-widest">Suggested Topic</p>
                    </div>
                    <p className="font-headline-lg text-[28px] font-black text-surface leading-tight">{activeConversation.title}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Span 4 */}
        <div className="lg:col-span-4 flex flex-col gap-spacing-gutter">
          
          {/* Current Focus Section */}
          <section className="bg-tertiary-container border-4 border-surface-border p-6 flex flex-col justify-between min-h-[240px] shadow-[8px_8px_0_0_#111827] relative overflow-hidden group cursor-pointer" onClick={() => navigate(activeConversation ? `/ai-tutor?conversation_id=${activeConversation.id}` : '/chat')}>
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-tertiary rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <p className="font-label-caps text-label-caps font-bold text-on-tertiary-container uppercase tracking-widest mb-4 inline-block border-2 border-surface-border px-2 py-1 bg-surface">Current Focus</p>
              <h2 className="font-headline-xl text-[32px] font-black text-ink-black mb-4 leading-tight">{activeConversation ? activeConversation.title : 'Start your learning journey'}</h2>
              <p className="font-body-md text-body-md font-bold text-ink-black/80">{activeConversation ? 'Based on your recent learning conversations.' : 'Tell PaathShala AI what you want to learn.'}</p>
            </div>
            <div className="mt-6 flex justify-end relative z-10">
              <button className="w-14 h-14 bg-ink-black text-surface flex items-center justify-center rounded-full border-4 border-transparent hover:border-surface-border hover:bg-primary transition-all hover:scale-110 duration-200 shadow-lg">
                <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
              </button>
            </div>
          </section>

          {/* Stats Card */}
          <section className="bg-surface border-4 border-surface-border p-8 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_0_#111827] relative group overflow-hidden min-h-[240px]">
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-primary-container border-4 border-surface-border mb-4 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[4px_4px_0_0_#111827]">
                <span className="material-symbols-outlined text-[32px] text-primary-fixed">chat</span>
              </div>
              <div className="font-display-lg text-display-lg font-black text-ink-black mb-2 flex items-baseline">
                <AnimatedCounter value={stats?.totalMessages ?? 0} />
              </div>
              <p className="font-label-caps text-label-caps font-bold text-ink-black uppercase tracking-widest mb-2 border-t-4 border-surface-border pt-4 w-full">Messages Exchanged</p>
              {!isNewUser && activeConversation && (
                <p className="font-body-md text-body-md text-on-surface-variant font-bold max-w-[200px] truncate">
                  in "{activeConversation.title}"
                </p>
              )}
            </div>
          </section>

          {/* Recommended Actions */}
          <section className="bg-surface-container-high border-4 border-surface-border p-6 flex flex-col shadow-[8px_8px_0_0_#111827] min-h-[240px]">
            <div className="flex justify-between items-center mb-6 border-b-4 border-surface-border pb-4">
              <h3 className="font-headline-lg text-[20px] font-black text-ink-black uppercase tracking-wider">Recommended</h3>
              {!isNewUser && (
                <button onClick={handleRefreshRecommendations} disabled={refreshingRecs} className="text-on-surface-variant hover:text-ink-black border-2 border-transparent hover:border-surface-border hover:bg-surface transition-all p-1 active:shadow-[2px_2px_0_0_#111827]">
                  <span className={`material-symbols-outlined text-[24px] ${refreshingRecs ? 'animate-spin' : ''}`}>refresh</span>
                </button>
              )}
            </div>
            
            {isNewUser ? (
               <div className="border-4 border-dashed border-surface-border bg-surface p-6 flex flex-col items-center text-center gap-3 h-full justify-center">
                 <span className="material-symbols-outlined text-tertiary text-[48px]">auto_awesome</span>
                 <h4 className="font-button-text text-[18px] font-black text-ink-black uppercase">No Recommendations Yet</h4>
                 <p className="font-body-md text-body-md text-on-surface-variant font-bold text-sm">Have a few conversations first.</p>
               </div>
            ) : refreshingRecs ? (
               <div className="flex flex-col gap-4">
                 <RecommendationSkeleton />
                 <RecommendationSkeleton />
               </div>
            ) : recommendations.length === 0 ? (
               <div className="border-4 border-dashed border-surface-border bg-surface p-6 flex flex-col items-center text-center gap-3 h-full justify-center">
                 <span className="material-symbols-outlined text-tertiary text-[48px]">auto_awesome</span>
                 <h4 className="font-button-text text-[18px] font-black text-ink-black uppercase leading-tight">Personalized AI Recommendations</h4>
                 <p className="font-body-md text-body-md font-bold text-on-surface-variant text-sm">Generate AI-driven next steps based on your progress.</p>
                 <button onClick={handleRefreshRecommendations} className="mt-2 bg-ink-black text-surface font-button-text px-4 py-2 border-4 border-surface-border hover:bg-tertiary hover:shadow-[4px_4px_0_0_#111827] transition-all uppercase">Generate</button>
               </div>
            ) : (
               <div className="flex flex-col gap-4">
                 {recommendations.slice(0, 3).map((rec, idx) => {
                   const colors = [
                     { bg: "bg-secondary-container", text: "text-on-secondary-container", icon: "quiz", border: "border-secondary" },
                     { bg: "bg-tertiary-container", text: "text-on-tertiary-container", icon: "trending_up", border: "border-tertiary" },
                     { bg: "bg-primary-container", text: "text-on-primary-container", icon: "smart_toy", border: "border-primary" },
                   ];
                   const theme = colors[idx % colors.length];
                   return (
                     <div key={idx} className="bg-surface border-4 border-surface-border p-4 flex gap-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#111827] transition-all cursor-pointer group" onClick={() => handleStartLearning(rec.title)}>
                       <div className={`w-12 h-12 ${theme.bg} border-2 border-surface-border flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#111827]`}>
                         <span className={`material-symbols-outlined text-[24px] ${theme.text}`}>{theme.icon}</span>
                       </div>
                       <div className="flex flex-col">
                         <h4 className="font-button-text text-[16px] font-black text-ink-black uppercase leading-tight line-clamp-1 group-hover:underline decoration-2 underline-offset-2">{rec.title}</h4>
                         <p className="font-body-sm text-[13px] text-on-surface-variant font-bold line-clamp-2 leading-tight mt-1">{rec.reason}</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </section>
        </div>
      </div>

      {/* BOTTOM ROW: Recent Tutor Sessions */}
      <section className="flex flex-col gap-8 mt-8">
        <header className="flex items-center gap-4 border-b-4 border-surface-border pb-4">
          <div className="w-12 h-12 bg-primary-fixed border-4 border-surface-border flex items-center justify-center shadow-[4px_4px_0_0_#111827]">
            <span className="material-symbols-outlined text-[24px] text-ink-black">history</span>
          </div>
          <h2 className="font-headline-lg text-[32px] font-black text-ink-black tracking-tight uppercase">Recent Tutor Sessions</h2>
        </header>
        
        {conversations.length === 0 ? (
          <div className="w-full bg-surface-container-lowest border-4 border-surface-border p-12 text-center shadow-[8px_8px_0_0_#111827]">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">forum</span>
            <h4 className="font-headline-lg text-[24px] font-black text-ink-black uppercase mb-2">No conversations yet</h4>
            <p className="font-body-md font-bold text-on-surface-variant">Start your first conversation with your AI tutor.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {conversations.slice(sessionPage * 3, (sessionPage + 1) * 3).map((session) => (
                <a 
                  key={session.id}
                  href={`/ai-tutor?conversation_id=${session.id}`}
                  onClick={(e) => { e.preventDefault(); navigate(`/ai-tutor?conversation_id=${session.id}`); }}
                  className="group bg-surface border-4 border-surface-border p-6 flex flex-col relative hover:shadow-[8px_8px_0_0_#111827] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all min-h-[200px]"
                >
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        pinnedId === session.id ? handleUnpin() : handlePin(session.id);
                      }}
                      className={`p-2 border-2 border-surface-border transition-colors ${pinnedId === session.id ? 'bg-primary text-on-primary shadow-[2px_2px_0_0_#111827]' : 'bg-surface hover:bg-surface-container-high text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">push_pin</span>
                    </button>
                  </div>
                  <span className="font-label-caps text-label-caps text-outline mb-4 font-bold uppercase tracking-widest">{new Date(session.created_at).toLocaleDateString()}</span>
                  <h4 className="font-headline-lg text-[24px] font-black text-ink-black mb-2 pr-12 line-clamp-3 leading-tight group-hover:underline decoration-4 underline-offset-4">{session.title}</h4>
                  <p className="font-body-md text-[14px] font-bold text-on-surface-variant mt-auto pt-4 border-t-4 border-surface-border">Revisit your previous conversation context.</p>
                </a>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {conversations.length > 3 && (
              <div className="flex justify-end gap-4 mt-2">
                <button
                  onClick={() => setSessionPage(Math.max(0, sessionPage - 1))}
                  disabled={sessionPage === 0}
                  className="w-12 h-12 flex items-center justify-center bg-surface border-4 border-surface-border shadow-[4px_4px_0_0_#111827] enabled:hover:bg-primary-fixed enabled:hover:translate-x-[-2px] enabled:hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous sessions"
                >
                  <span className="material-symbols-outlined text-[24px] text-ink-black">arrow_back</span>
                </button>
                <button
                  onClick={() => setSessionPage(sessionPage + 1)}
                  disabled={(sessionPage + 1) * 3 >= conversations.length}
                  className="w-12 h-12 flex items-center justify-center bg-surface border-4 border-surface-border shadow-[4px_4px_0_0_#111827] enabled:hover:bg-primary-fixed enabled:hover:translate-x-[-2px] enabled:hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next sessions"
                >
                  <span className="material-symbols-outlined text-[24px] text-ink-black">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
