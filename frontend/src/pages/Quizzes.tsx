import { useState, useRef } from 'react';
import clsx from 'clsx';

const OPTIONS = [
  { id: 'A', text: 'Random Forest Classifier', isCorrect: false },
  { id: 'B', text: 'Gradient Descent', isCorrect: true },
  { id: 'C', text: 'K-Means Clustering', isCorrect: false },
  { id: 'D', text: 'Principal Component Analysis', isCorrect: false }
];

export default function Quizzes() {
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const explanationRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (index: number) => {
    if (answered) return;
    setAnswered(true);
    setSelectedOption(index);
    
    setTimeout(() => {
      setShowExplanation(true);
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }, 300);
  };

  const handleNext = () => {
    setLoadingNext(true);
    // Simulate loading next question
    setTimeout(() => {
      // In a real app we'd load new data here.
      // For now, just reset the state to replay the interaction
      setAnswered(false);
      setSelectedOption(null);
      setShowExplanation(false);
      setLoadingNext(false);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full px-margin-mobile md:px-margin-desktop py-stack-lg min-h-screen">
      <div className="w-full max-w-container-max mx-auto flex flex-col flex-1 relative">
        
        {/* Top Bar: Progress & Score */}
        <div className="flex items-center justify-between mb-stack-lg sticky top-16 z-30 py-4 bg-surface/90 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <button aria-label="Exit Quiz" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden relative">
              <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: '65%' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>
            </div>
            <span className="text-label-md font-label-md text-on-surface-variant whitespace-nowrap">6 / 10</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full ml-auto shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="text-label-md font-label-md text-on-surface">Score: 450</span>
          </div>
        </div>

        {/* Main Quiz Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-gutter relative z-10 w-full">
          
          {/* Question Column */}
          <div className="flex-1 flex flex-col justify-center min-h-[512px] lg:min-h-[716px]">
            <div className="mb-stack-md flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm uppercase tracking-wider">Machine Learning Basics</span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Question 6</span>
            </div>
            <h1 className="text-headline-lg lg:text-display font-display text-on-surface mb-stack-lg leading-tight">
                Which optimization algorithm is primarily used to minimize the cost function in neural networks?
            </h1>
            
            {/* Code snippet */}
            <div className="bg-surface-container-low rounded-xl p-6 mb-stack-lg shadow-sm border border-outline-variant/10 font-mono text-body-sm text-on-surface-variant overflow-x-auto relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-tertiary rounded-l-xl"></div>
              <pre><code><span className="text-primary">def</span> <span className="text-tertiary">train_model</span>(X, y):
    <span className="text-outline"># Initialize weights</span>
    weights = random_init()
    
    <span className="text-primary">for</span> epoch <span className="text-primary">in</span> range(epochs):
        <span className="text-outline"># Forward pass</span>
        predictions = predict(X, weights)
        loss = compute_loss(predictions, y)
        
        <span className="text-outline"># ???</span>
        gradients = compute_gradients(loss)
        weights = weights - (learning_rate * gradients)</code></pre>
            </div>
          </div>

          {/* Answers Column */}
          <div className="w-full lg:w-[480px] flex flex-col justify-center gap-4 relative">
            {OPTIONS.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = opt.isCorrect;
              
              // Determine styles based on state
              let btnClass = "w-full text-left p-6 rounded-2xl transition-all duration-200 group shadow-sm flex items-start gap-4 border relative overflow-hidden answer-btn";
              let iconClass = "w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md flex-shrink-0 mt-0.5 transition-colors";
              let iconContent = opt.id;
              
              if (!answered) {
                btnClass = clsx(btnClass, "bg-surface-container hover:bg-surface-container-high border-outline-variant/5 hover:border-primary/30 cursor-pointer");
                iconClass = clsx(iconClass, "bg-surface-container-highest text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary");
              } else {
                if (isSelected) {
                  if (isCorrectOpt) {
                    btnClass = clsx(btnClass, "bg-tertiary/10 border-tertiary/50 opacity-100");
                    iconClass = clsx(iconClass, "bg-tertiary text-on-tertiary");
                    iconContent = "check"; // Use icon
                  } else {
                    btnClass = clsx(btnClass, "bg-error/10 border-error/50 opacity-100");
                    iconClass = clsx(iconClass, "bg-error text-on-error");
                    iconContent = "close"; // Use icon
                  }
                } else if (isCorrectOpt) {
                  // Show the correct answer if they picked wrong
                  btnClass = clsx(btnClass, "bg-surface-container border-tertiary/30 opacity-100");
                  iconClass = clsx(iconClass, "bg-tertiary/20 text-tertiary");
                } else {
                  btnClass = clsx(btnClass, "bg-surface-container border-outline-variant/5 opacity-50 cursor-default");
                  iconClass = clsx(iconClass, "bg-surface-container-highest text-on-surface-variant");
                }
              }

              return (
                <button 
                  key={opt.id}
                  onClick={() => handleOptionClick(idx)}
                  className={btnClass}
                  disabled={answered}
                >
                  <div className={iconClass}>
                    {iconContent === 'check' || iconContent === 'close' ? (
                       <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{iconContent}</span>
                    ) : (
                      iconContent
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-body-lg font-body-lg text-on-surface block">{opt.text}</span>
                  </div>
                  {!answered && <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>}
                </button>
              );
            })}

            {/* AI Explanation Panel */}
            <div 
              ref={explanationRef}
              className={clsx(
                "transition-all duration-500 ease-out mt-stack-md bg-secondary-container/10 rounded-2xl p-6 shadow-sm border border-secondary/20 relative overflow-hidden",
                showExplanation ? "opacity-100 translate-y-0 block" : "opacity-0 translate-y-4 hidden"
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[40px] rounded-full pointer-events-none -mt-10 -mr-10"></div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-secondary">auto_awesome</span>
                </div>
                <div>
                  <h4 className={clsx(
                    "text-title-lg font-title-lg mb-2 flex items-center gap-2",
                    selectedOption !== null && OPTIONS[selectedOption].isCorrect ? "text-tertiary" : "text-error"
                  )}>
                    <span>{selectedOption !== null && OPTIONS[selectedOption].isCorrect ? "Excellent!" : "Not quite."}</span>
                    {selectedOption !== null && OPTIONS[selectedOption].isCorrect && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-surface-container-high text-on-surface-variant border border-outline-variant/10 uppercase tracking-widest">+50 XP</span>
                    )}
                  </h4>
                  <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed mb-4">
                      Gradient Descent calculates the derivative (gradient) of the loss function with respect to the weights, pointing in the direction of steepest ascent. By subtracting a fraction of this gradient (learning rate), the algorithm steps towards the minimum loss.
                  </p>
                  <button 
                    onClick={handleNext}
                    className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                  >
                    {loadingNext ? (
                      <><span className="material-symbols-outlined animate-spin">progress_activity</span> Loading...</>
                    ) : (
                      <>
                        Continue to Next Question
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen z-0"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen z-0"></div>
      </div>
    </div>
  );
}
