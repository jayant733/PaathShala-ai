import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DashboardService } from '../api/dashboard.service';
import type { Recommendation, LearningStatistics } from '../api/dashboard.service';
import type { ConversationItem } from '../api/chat.api';
import { HistoryItem } from '../components/HistoryItem';

const RecommendationSkeleton = () => (
  <div className="flex items-start gap-4 p-3 rounded-lg bg-surface-container/50 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0"></div>
    <div className="flex-1 space-y-2 py-1">
      <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
      <div className="h-3 bg-surface-container-highest rounded w-5/6"></div>
      <div className="h-3 bg-surface-container-highest rounded w-1/2"></div>
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
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('conversationFinished', handleSoftRefresh);
    };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const history = await DashboardService.getConversationHistory();
        setConversations(history);
        
        // Ensure the pinned ID is still valid, else fallback
        const validPinnedConv = DashboardService.getPinnedConversation(history);
        const activeTargetId = validPinnedConv ? validPinnedConv.id : null;
        
        const [statsResult, recsResult] = await Promise.all([
          DashboardService.getLearningStatistics(activeTargetId),
          DashboardService.getRecommendations()
        ]);

        setStats(statsResult);
        setRecommendations(recsResult);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token, pinnedId]);

  const handleRefreshRecommendations = async () => {
    setRefreshingRecs(true);
    try {
      const recsResult = await DashboardService.getRecommendations();
      setRecommendations(recsResult);
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

  const isNewUser = conversations.length === 0;
  const activeConversation = DashboardService.getPinnedConversation(conversations);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20"></div>
          <div className="h-4 w-32 bg-surface-container-high rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto px-margin-desktop py-margin-desktop gap-stack-lg">
      <div className="flex flex-col gap-unit">
        {isNewUser ? (
          <>
            <h1 className="font-display text-display text-on-surface">Welcome to PaathShala AI, {name} 👋</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Start your first conversation and your learning journey will appear here.</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-display text-on-surface">Good morning, {name}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Ready to continue your journey?</p>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-12 gap-gutter">
        {/* Progress / Current Focus Card */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-xl p-gutter shadow-sm relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>
          
          {isNewUser || !activeConversation ? (
            <div className="flex flex-col gap-stack-md relative z-10 py-8">
              <div>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-unit block">Get Started</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Start your learning journey</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Tell PaathShala AI what you want to learn and we will create a personalized roadmap for you.</p>
              </div>
              <div>
                <button onClick={() => navigate('/chat')} className="bg-primary text-on-primary px-6 py-3 rounded-full font-label-lg hover:bg-primary-fixed transition-colors shadow-md cursor-pointer">
                  Start Your First Conversation
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-stack-md relative z-10 py-4 h-full justify-center">
              <div>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-unit block">CURRENT FOCUS</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">{activeConversation.title}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Based on your recent learning conversations.</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats - Scoped to Active Conversation */}
        <div className="col-span-12 lg:col-span-4 flex flex-col">
          <div className="bg-surface-container rounded-xl p-stack-md shadow-sm flex flex-col justify-center items-center text-center hover:bg-surface-container-high transition-colors flex-1 py-10 relative group">
            {pinnedId && activeConversation?.id === pinnedId && (
               <span className="material-symbols-outlined text-primary absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">push_pin</span>
            )}
            <span className="material-symbols-outlined text-primary mb-stack-sm text-[32px]">chat</span>
            <div>
              <span className="font-display text-[64px] text-on-surface block leading-none mb-2">{stats?.totalMessages ?? 0}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block">Messages Exchanged</span>
              {!isNewUser && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 max-w-[200px] mx-auto truncate">
                  in "{activeConversation?.title ?? 'Unknown'}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container rounded-xl p-gutter shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-stack-md">
            <h3 className="font-title-lg text-title-lg text-on-surface">Continue Learning</h3>
            {!isNewUser && (
              <button 
                onClick={() => activeConversation ? navigate(`/ai-tutor?conversation_id=${activeConversation.id}`) : navigate('/chat')}
                className="font-label-sm text-label-sm text-primary hover:text-primary-fixed transition-colors cursor-pointer"
              >
                View Path →
              </button>
            )}
          </div>
          
          {isNewUser || !activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-outline-variant/30 rounded-lg">
               <span className="material-symbols-outlined text-[48px] text-primary/40 mb-4">school</span>
               <h4 className="font-title-md text-title-md text-on-surface mb-2">Ready to start learning?</h4>
               <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 max-w-[250px] mx-auto">
                 Your first conversation will create your personalized learning path.
               </p>
               <button onClick={() => navigate('/chat')} className="bg-primary/10 text-primary px-6 py-2 rounded-full font-label-md hover:bg-primary/20 transition-colors cursor-pointer">
                  Start First AI Tutor Session
               </button>
            </div>
          ) : (
            <div 
              onClick={() => navigate(`/ai-tutor?conversation_id=${activeConversation.id}`)}
              className="group relative rounded-lg overflow-hidden cursor-pointer flex-1 min-h-[200px]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 to-transparent z-10"></div>
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0" alt="Transformers visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIZxGGvnUDw2m6KR62maNywwLx1EqZiBma2Eu3pjJ3M-3M8FCXZPMly8AYjw-Xo_25g52jzsvbNHkX2i_YLsuCndSeSZswYg93JQ4zlJS0CyIXbGJGUr8R2PLb3qwqWgEURakr-IOsz7JiV5FLN8rL5-D4L6P0vxLJFIMLP-tJ2TQwBUTi5lHaRzqcviWjUL7mtgceu_LkEz5jfaly8Z9gxaN1TW3hku1LXJ6hgmoK2AFhSXzkljpsDMkwNqaqW3dVbidopEmHsA"/>
              <div className="absolute bottom-0 left-0 p-stack-md z-20 w-full">
                <span className="inline-block px-2 py-1 bg-primary/20 text-primary font-label-sm text-label-sm rounded mb-2 backdrop-blur-sm">Suggested Topic</span>
                <h4 className="font-headline-md text-headline-md text-on-surface mb-1">{activeConversation?.title ?? 'Unknown Conversation'}</h4>
              </div>
            </div>
          )}
        </div>

        {/* Recommended Next Steps */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container rounded-xl p-gutter shadow-sm relative">
          <div className="flex justify-between items-center mb-stack-md">
            <h3 className="font-title-lg text-title-lg text-on-surface">Recommended Actions</h3>
            {!isNewUser && (
              <button 
                onClick={handleRefreshRecommendations}
                disabled={refreshingRecs}
                className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant disabled:opacity-50 cursor-pointer"
              >
                <span className={`material-symbols-outlined ${refreshingRecs ? 'animate-spin' : ''}`}>refresh</span>
              </button>
            )}
          </div>
          
          {isNewUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-outline-variant/30 rounded-lg h-[200px]">
               <span className="material-symbols-outlined text-[32px] text-tertiary/40 mb-3">auto_awesome</span>
               <h4 className="font-title-sm text-title-sm text-on-surface mb-2">Recommendations will appear here</h4>
               <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[300px] mx-auto">
                 After a few conversations, PaathShala AI will analyze your learning style and suggest your next steps.
               </p>
            </div>
          ) : (
            <div className="flex flex-col gap-stack-sm relative">
              {refreshingRecs ? (
                <div className="flex flex-col gap-stack-sm w-full">
                  <RecommendationSkeleton />
                  <RecommendationSkeleton />
                  <RecommendationSkeleton />
                </div>
              ) : recommendations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-outline-variant/30 rounded-lg">
                   <span className="material-symbols-outlined text-[32px] text-tertiary/40 mb-3">auto_awesome</span>
                   <h4 className="font-title-sm text-title-sm text-on-surface mb-2">Generating personalized insights...</h4>
                   <p className="font-body-sm text-body-sm text-on-surface-variant">Check back later for new learning topics.</p>
                </div>
              ) : (
                recommendations.map((rec, idx) => {
                  const colors = [
                    { bg: "bg-secondary-container", text: "text-on-secondary-container", icon: "quiz" },
                    { bg: "bg-tertiary-container", text: "text-on-tertiary-container", icon: "trending_up" },
                    { bg: "bg-surface-container-highest", text: "text-on-surface", icon: "smart_toy" },
                  ];
                  const theme = colors[idx % colors.length];
                  return (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-lg hover:bg-surface-container-high transition-colors group">
                      <div className={`w-10 h-10 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <span className="material-symbols-outlined text-[20px]">{theme.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-body-md text-body-md text-on-surface font-medium">{rec.title}</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{rec.reason}</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/ai-tutor?initial_prompt=${encodeURIComponent(rec.title)}`)}
                        className="opacity-0 group-hover:opacity-100 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-full font-label-sm transition-all cursor-pointer"
                      >
                        Start Learning
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Recent AI Conversations */}
        <div className="col-span-12 bg-surface-container rounded-xl p-gutter shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-[100px] pointer-events-none"></div>
          <div className="flex justify-between items-center mb-stack-md pl-2">
            <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-primary">history</span>
              Recent Tutor Sessions
            </h3>
          </div>
          
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-surface rounded-lg border border-outline-variant/10 relative z-10">
               <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-3">forum</span>
               <h4 className="font-title-md text-title-md text-on-surface mb-2">No conversations yet</h4>
               <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                 Start your first conversation with your AI tutor.
               </p>
               <button onClick={() => navigate('/chat')} className="bg-surface-container-highest text-on-surface px-6 py-2 rounded-full font-label-md hover:bg-surface-container-high transition-colors cursor-pointer">
                  Start Chat
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md pl-2 relative z-10">
              {conversations.slice(0, 3).map((session) => (
                <HistoryItem 
                  key={session.id}
                  conversation={session}
                  isPinned={pinnedId === session.id}
                  onPin={handlePin}
                  onUnpin={handleUnpin}
                  onClick={(id) => navigate(`/ai-tutor?conversation_id=${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
