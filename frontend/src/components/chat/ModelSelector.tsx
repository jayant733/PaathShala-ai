import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/user.api';
import type { UserAIPreference } from '../../api/user.api';
import { Cloud, Cpu, ChevronDown, Check, Loader2, Zap } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';

interface ModelSelectorProps {
  onModelChange: (provider: string | null, model: string | null, mode: 'auto' | 'manual') => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange, disabled }) => {
  const health = useAIStore(state => state.health);
  const fetchHealth = useAIStore(state => state.fetchHealth);
  const [prefs, setPrefs] = useState<UserAIPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchHealth();
        const prefsData = await userApi.getAiPreferences();
        
        // Only set default if mode is empty or invalid
        if (prefsData) {
            setPrefs(prefsData);
            useAIStore.getState().setMode(prefsData.mode as any || 'auto');
            useAIStore.getState().setProviderAndModel(prefsData.provider || 'gemini', prefsData.model || 'gemini-2.5-flash');
            onModelChange(prefsData.provider, prefsData.model, prefsData.mode as any);
        }
      } catch (err) {
        console.error("Failed to load AI preferences", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []); // Remove onModelChange from dependency array to break infinite loop

  const handleSelect = async (mode: 'auto' | 'manual', provider: string | null = null, model: string | null = null) => {
    // If auto, defaults
    const actualProvider = provider || 'gemini';
    const actualModel = model || 'llama3:latest'; // Default fallback
    
    const newPrefs = { mode, provider: actualProvider, model: actualModel };
    setPrefs(newPrefs as UserAIPreference);
    
    useAIStore.getState().setMode(mode as any);
    useAIStore.getState().setProviderAndModel(actualProvider, actualModel);
    
    onModelChange(actualProvider, actualModel, mode);
    setIsOpen(false);
    
    try {
      await userApi.updateAiPreferences(newPrefs);
    } catch (e) {
      console.error("Failed to save AI preferences", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center text-sm text-gray-500 gap-2 mb-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading models...
      </div>
    );
  }

  // Current display state
  const isAuto = prefs?.mode === 'auto';
  const currentProvider = prefs?.provider;
  const currentModel = prefs?.model;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-gray-300 disabled:opacity-50"
      >
        {isAuto ? (
          <><Zap className="w-4 h-4 text-yellow-400" /> Auto Routing</>
        ) : currentProvider === 'gemini' ? (
          <><Cloud className="w-4 h-4 text-blue-400" /> Gemini (Cloud)</>
        ) : (
          <><Cpu className="w-4 h-4 text-green-400" /> {currentModel || 'Local Model'} (Local)</>
        )}
        <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-[#1e293b] border border-white/10 shadow-xl overflow-hidden z-50">
          
          {/* Auto Mode */}
          <div className="p-2 border-b border-white/5">
            <button
              onClick={() => handleSelect('auto')}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm text-left transition-colors ${isAuto ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-300 hover:bg-white/5'}`}
            >
              <div className="flex flex-col">
                <span className="flex items-center gap-2 font-medium"><Zap className="w-4 h-4" /> Auto Routing</span>
                <span className="text-[10px] text-gray-500 ml-6">Smart fallback (Gemini → Local)</span>
              </div>
              {isAuto && <Check className="w-4 h-4" />}
            </button>
          </div>

          {/* Cloud AI */}
          <div className="p-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-2">
              <span>Cloud AI</span>
              {health?.gemini?.status === 'healthy' ? (
                <span className="text-green-400 normal-case font-normal text-[10px] flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div> {health.gemini.latency}ms
                </span>
              ) : (
                <span className="text-red-400 normal-case font-normal text-[10px]">Offline</span>
              )}
            </div>
            <button
              onClick={() => handleSelect('manual', 'gemini')}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm text-left transition-colors ${!isAuto && currentProvider === 'gemini' ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300 hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-2"><Cloud className="w-4 h-4" /> Gemini Fast</span>
              {!isAuto && currentProvider === 'gemini' && <Check className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Local AI */}
          <div className="p-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-2">
              <span>Local Models (Ollama)</span>
              {health?.ollama?.status === 'healthy' ? (
                <span className="text-green-400 normal-case font-normal text-[10px] flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div> {health.ollama.models?.length} models
                </span>
              ) : (
                <span className="text-red-400 normal-case font-normal text-[10px]">Offline</span>
              )}
            </div>
            
            {health?.ollama?.status === 'healthy' && health.ollama.models?.length ? (
              health.ollama.models.map(model => (
                <button
                  key={model}
                  onClick={() => handleSelect('manual', 'ollama', model)}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm text-left transition-colors ${!isAuto && currentProvider === 'ollama' && currentModel === model ? 'bg-green-500/10 text-green-400' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /> {model}</span>
                  {!isAuto && currentProvider === 'ollama' && currentModel === model && <Check className="w-4 h-4" />}
                </button>
              ))
            ) : (
              <div className="px-2 py-2 text-xs text-gray-500 italic">
                {health?.ollama?.status === 'healthy' ? 'No models downloaded.' : 'Ollama is not running locally.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
