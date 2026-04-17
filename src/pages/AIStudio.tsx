import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Film, Sparkles, Download, Loader2, Wand2, Video, Key, Brain, Zap } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { useAuth } from '../components/AuthProvider';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const AIStudio = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [thinkingLevel, setThinkingLevel] = useState<'standard' | 'high'>('standard');
  const [neuralRefinement, setNeuralRefinement] = useState(false);
  const [refinedPromptLength, setRefinedPromptLength] = useState<number | null>(null);

  const MAX_PROMPT_LENGTH = 1000;

  useEffect(() => {
    checkApiKey();
  }, []);

  useEffect(() => {
    setRefinedPromptLength(null);
  }, [prompt]);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const refinePrompt = async (originalPrompt: string) => {
    if (!neuralRefinement || !hasApiKey) return originalPrompt;
    
    setStatus('Neural reasoning in progress...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const config: any = {};
      if (thinkingLevel === 'high') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const result = await ai.models.generateContent({ 
        model: "gemini-3.1-pro-preview",
        contents: [{ role: 'user', parts: [{ text: `As a Digital Architect, refine and expand this prompt for ${activeTab} generation. Make it more descriptive, cinematic, and high-fidelity. Original prompt: ${originalPrompt}` }] }],
        config
      });
      const expanded = result.text;
      setRefinedPromptLength(expanded.length);
      return expanded;
    } catch (error) {
      console.error('Neural refinement failed:', error);
      return originalPrompt;
    }
  };

  const generateImage = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setResultUrl(null);
    setStatus('Initializing neural link...');

    try {
      const refinedPrompt = await refinePrompt(prompt);
      setStatus('Synthesizing pixels...');
      
      const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: key || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: refinedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
          }
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setResultUrl(`data:image/png;base64,${base64EncodeString}`);
          break;
        }
      }
      setStatus('Image materialized.');
    } catch (error) {
      console.error('Image generation failed:', error);
      setStatus('Materialization failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!prompt) return;
    if (!hasApiKey) {
      await handleSelectKey();
    }
    
    setIsGenerating(true);
    setResultUrl(null);
    setStatus('Initializing neural link...');

    try {
      const refinedPrompt = await refinePrompt(prompt);
      setStatus('Rendering temporal sequences...');

      const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: key || '' });
      let operation: any = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: refinedPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        setStatus('Rendering in progress...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Fetch video with API key header
        const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': key || '',
          },
        });
        const blob = await response.blob();
        setResultUrl(URL.createObjectURL(blob));
        setStatus('Video sequence complete.');
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      setStatus('Sequence failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-neon-cyan/10 rounded-2xl border border-neon-cyan/20">
            <Sparkles className="text-neon-cyan animate-pulse" size={32} />
          </div>
        </div>
        <h1 className="text-5xl font-black italic tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-neon-cyan to-white">
          CREATIVE STUDIO
        </h1>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          Harness the power of Veo and Gemini to manifest your digital visions.
        </p>
      </motion.div>

      <div className="flex justify-center mb-8">
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === 'image' ? 'bg-neon-cyan text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon size={18} /> Image
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === 'video' ? 'bg-neon-pink text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film size={18} /> Video
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          {/* API Key Management Section */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${hasApiKey ? 'from-neon-green' : 'from-neon-red'} opacity-5 blur-3xl`} />
            
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Key className={hasApiKey ? "text-neon-green" : "text-neon-red"} size={20} /> 
              Neural Access Control
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${hasApiKey ? 'bg-neon-green animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'bg-neon-red'}`} />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Status: {hasApiKey ? 'Access Granted' : 'Access Restricted'}
                </span>
              </div>
              {hasApiKey && (
                <span className="text-[10px] font-bold text-neon-green uppercase tracking-tighter">Key Active</span>
              )}
            </div>

            <p className="text-slate-500 text-sm font-light mb-6 leading-relaxed">
              To utilize advanced temporal rendering (Veo) and high-thinking models, a valid Gemini API key must be selected. Keys are managed securely via the platform interface.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleSelectKey}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 transition-all ${
                  hasApiKey 
                    ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' 
                    : 'bg-neon-cyan text-black hover:bg-white shadow-[0_0_20px_rgba(0,255,255,0.2)]'
                }`}
              >
                <Key size={18} />
                {hasApiKey ? 'Update Access Key' : 'Configure Neural Key'}
              </button>
              
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-neon-cyan transition-colors"
              >
                View Billing Documentation
              </a>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-neon-purple opacity-5 blur-3xl`} />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Brain className="text-neon-purple" size={20} /> 
                Neural Reasoning
              </h3>
              <button
                onClick={() => setNeuralRefinement(!neuralRefinement)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  neuralRefinement 
                    ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' 
                    : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                }`}
              >
                <Zap size={14} className={neuralRefinement ? "animate-pulse" : ""} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {neuralRefinement ? 'Refinement Active' : 'Enable Refinement'}
                </span>
              </button>
            </div>

            <p className="text-slate-500 text-sm font-light mb-6 leading-relaxed">
              Enable neural refinement to have the AI "think through" and expand your prompt before generation. Requires a Pro model connection.
            </p>

            <div className="flex p-1 bg-black/30 rounded-xl border border-white/5">
              <button
                onClick={() => setThinkingLevel('standard')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  thinkingLevel === 'standard' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Standard Thinking
              </button>
              <button
                onClick={() => setThinkingLevel('high')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  thinkingLevel === 'high' ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(123,47,247,0.3)]' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                High Thinking
              </button>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Wand2 className="text-neon-cyan" size={20} /> Manifestation Prompt
            </h3>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={MAX_PROMPT_LENGTH}
                placeholder={activeTab === 'image' ? "Describe the image you want to materialize..." : "Describe the cinematic sequence you want to render..."}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:border-neon-cyan outline-none transition-colors h-40 resize-none text-slate-200"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <div className={`text-[10px] font-black tracking-widest uppercase ${prompt.length >= MAX_PROMPT_LENGTH ? 'text-neon-red' : 'text-slate-500'}`}>
                  {prompt.length} / {MAX_PROMPT_LENGTH}
                </div>
              </div>
            </div>
            {neuralRefinement && refinedPromptLength && (
              <div className="mt-4 p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-neon-purple" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Expansion:</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-500">{prompt.length} chars</span>
                  <Zap size={10} className="text-neon-purple" />
                  <span className="text-[10px] font-mono text-neon-purple font-bold">{refinedPromptLength} chars</span>
                  <span className="text-[8px] font-black bg-neon-purple/20 text-neon-purple px-1.5 py-0.5 rounded">
                    +{Math.round(((refinedPromptLength - prompt.length) / prompt.length) * 100)}%
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={activeTab === 'image' ? generateImage : generateVideo}
              disabled={isGenerating || !prompt}
              className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 transition-all ${
                activeTab === 'image' 
                  ? 'bg-neon-cyan text-black hover:bg-white' 
                  : 'bg-neon-pink text-white hover:bg-white hover:text-black'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> {status}
                </>
              ) : (
                <>
                  {activeTab === 'image' ? <Sparkles size={20} /> : <Video size={20} />}
                  Generate {activeTab === 'image' ? 'Image' : 'Video'}
                </>
              )}
            </button>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/5 text-xs text-slate-500 space-y-2">
            <p className="font-bold uppercase tracking-widest text-slate-400">System Parameters:</p>
            <p>• Model: {activeTab === 'image' ? 'gemini-3.1-flash-image-preview' : 'veo-3.1-lite-generate-preview'}</p>
            <p>• Resolution: {activeTab === 'image' ? '1024x576 (1K)' : '1280x720 (720p)'}</p>
            <p>• Aspect Ratio: 16:9</p>
            {neuralRefinement && (
              <p className="text-neon-purple">• Neural Refinement: ACTIVE ({thinkingLevel.toUpperCase()} THINKING)</p>
            )}
          </div>
        </div>

        <div className="relative aspect-video glass-card rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center bg-black/40">
          <AnimatePresence mode="wait">
            {resultUrl ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full relative group"
              >
                {activeTab === 'image' ? (
                  <img src={resultUrl} alt="Generated" className="w-full h-full object-cover" />
                ) : (
                  <video src={resultUrl} controls autoPlay loop className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <a
                    href={resultUrl}
                    download={`generated-${activeTab}.png`}
                    className="p-4 bg-neon-cyan text-black rounded-full hover:scale-110 transition-transform"
                  >
                    <Download size={24} />
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-12"
              >
                <div className="mb-4 flex justify-center">
                  {activeTab === 'image' ? <ImageIcon size={64} className="text-slate-800" /> : <Film size={64} className="text-slate-800" />}
                </div>
                <p className="text-slate-600 font-light tracking-widest uppercase">Awaiting Manifestation</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isGenerating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-neon-cyan/20 rounded-full animate-ping" />
                <Loader2 className="absolute inset-0 m-auto text-neon-cyan animate-spin" size={32} />
              </div>
              <p className="text-neon-cyan font-black uppercase tracking-widest text-sm animate-pulse">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
