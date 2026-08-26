import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mlApi, type QuizMasteryDetailed } from '../api/ml.api';
import { DashboardService } from '../api/dashboard.service';
import type { ConversationItem } from '../api/chat.api';

export default function QuizMastery() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<QuizMasteryDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [completedTopic, setCompletedTopic] = useState<string | null>(null);

  useEffect(() => {
    DashboardService.getConversationHistory().then(setConversations);
    if (quizId) {
      mlApi.getQuizMasteryDetailed(quizId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [quizId]);

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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-title-lg font-title-lg text-on-surface mb-2">Quiz not found</h2>
        <button onClick={() => navigate('/dashboard')} className="text-primary font-label-md">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto px-margin-desktop py-16 gap-12 relative min-h-[calc(100vh-80px)]">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate('/progress')} className="w-12 h-12 flex items-center justify-center border-4 border-surface-border bg-surface hover:bg-secondary-container hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#111827] transition-all text-on-surface">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="relative">
          <h1 className="font-display-lg text-[48px] font-black text-ink-black uppercase leading-none">{data.quiz_title}</h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mt-2 border-l-4 border-primary pl-3">Detailed topic mastery for this quiz</p>
        </div>
      </div>

      <div className="bg-surface-container-low border-4 border-surface-border p-8 shadow-[8px_8px_0_0_#111827] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="grid gap-6 md:grid-cols-2 relative z-10">
          {data.topics.map((item) => {
            const isCompleted = item.mastery >= 0.95;
            
            return (
              <div key={item.topic} className="bg-surface border-4 border-surface-border p-6 flex flex-col gap-4 shadow-[4px_4px_0_0_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#111827] transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-headline-lg text-[24px] font-black text-ink-black leading-tight uppercase">{item.topic}</h4>
                  <div className={`px-3 py-1 border-2 border-surface-border font-label-caps text-label-caps uppercase tracking-wider ${isCompleted ? 'bg-primary text-on-primary' : item.status === 'weak' ? 'bg-error-container text-on-error-container' : item.status === 'improving' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-primary-container text-on-primary-container'}`}>
                    {isCompleted ? 'MASTERED' : item.status} · {Math.round(item.mastery * 100)}%
                  </div>
                </div>
                <p className="font-body-md text-on-surface-variant flex-1 bg-surface-container p-4 border-l-4 border-surface-border">
                  {isCompleted ? "You've fully mastered this topic! Great job." : item.suggested_action}
                </p>
                {isCompleted ? (
                  <button
                    onClick={() => setCompletedTopic(item.topic)}
                    className="w-full bg-primary text-on-primary font-button-text py-3 border-2 border-surface-border shadow-[2px_2px_0_0_#002117] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#002117] transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                    Completed
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartLearning(item.topic)}
                    className="w-full bg-ink-black text-on-primary font-button-text py-3 border-2 border-surface-border shadow-[2px_2px_0_0_#003527] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#003527] transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                    {getExistingConversationForTopic(item.topic) ? 'Continue Learning' : 'Start Learning'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {data.topics.length === 0 && (
          <div className="p-12 text-center border-4 border-dashed border-surface-border bg-surface relative z-10">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">search_off</span>
            <h2 className="font-headline-lg text-[24px] font-black uppercase text-ink-black">No Topics Tracked</h2>
            <p className="font-body-md text-on-surface-variant mt-2">Try taking this quiz first to generate tracking data.</p>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {completedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border-4 border-surface-border p-8 max-w-lg w-full shadow-[12px_12px_0_0_#111827] relative">
            <button 
              onClick={() => setCompletedTopic(null)}
              className="absolute top-4 right-4 w-10 h-10 border-2 border-surface-border flex items-center justify-center hover:bg-error-container hover:text-on-error-container transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-primary mb-6 flex justify-center">
              <span className="material-symbols-outlined text-[72px]">workspace_premium</span>
            </div>
            <h2 className="font-display-md text-center uppercase font-black text-ink-black mb-2">Topic Mastered!</h2>
            <p className="font-body-lg text-center text-on-surface-variant mb-8 bg-primary-container text-on-primary-container p-4 border-2 border-surface-border">
              You have successfully completed <strong>{completedTopic}</strong>.
            </p>
            
            <h3 className="font-headline-sm uppercase font-bold text-ink-black border-b-2 border-surface-border pb-2 mb-4">Recommended Next Steps</h3>
            <div className="flex flex-col gap-3">
              {data.topics.filter(t => t.topic !== completedTopic && t.mastery < 0.95).slice(0, 2).map(rec => (
                <button
                  key={rec.topic}
                  onClick={() => {
                    setCompletedTopic(null);
                    handleStartLearning(rec.topic);
                  }}
                  className="flex items-center justify-between p-4 border-2 border-surface-border hover:bg-secondary-container transition-colors text-left group"
                >
                  <div>
                    <div className="font-label-lg font-bold text-ink-black">{rec.topic}</div>
                    <div className="font-body-sm text-on-surface-variant">{Math.round(rec.mastery * 100)}% Mastery</div>
                  </div>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              ))}
              {data.topics.filter(t => t.topic !== completedTopic && t.mastery < 0.95).length === 0 && (
                <div className="p-4 bg-surface-container border-2 border-surface-border text-center text-on-surface-variant">
                  You've mastered all topics in this quiz! Check your dashboard for more.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
