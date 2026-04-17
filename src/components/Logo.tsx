import React from 'react';
import { cn } from '../lib/utils';

export const Logo = ({ size = 'h-32', withTagline = true }: { size?: string, withTagline?: boolean }) => {
  return (
    <div className="flex flex-col items-center transition-all duration-700 hover:scale-105 group cursor-pointer">
      <div className="relative">
        {/* Intense Rainbow Glow Background */}
        <div className="absolute -inset-6 bg-gradient-to-r from-neon-red via-neon-yellow via-neon-green via-neon-cyan via-neon-purple to-neon-pink rounded-full blur-3xl opacity-20 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
        
        <div className="relative flex flex-col items-center p-4 bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 animate-rainbow">
          {/* Logo Image */}
          <img 
            src="/logo.png" 
            alt="OTD AI SURFER Logo" 
            className={cn("object-contain drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]", size)}
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback if image is missing
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-text');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />

          {/* Fallback Text (Visible if image fails to load) */}
          <div className="fallback-text hidden flex flex-col items-center py-4 px-8">
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter rainbow-text drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              OTD AI SURFER
            </h1>
          </div>
          
          {withTagline && (
            <div className="mt-4 text-[10px] tracking-[0.4em] text-white/90 uppercase font-black text-center drop-shadow-sm">
              <span className="text-neon-cyan">CHOOSE YOUR TOOLS</span> <br />
              <span className="rainbow-text">AS YOU DO.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
