import { HAND_DATA } from '../utils/handData';
import { GameState } from './GameCanvas';

interface UIOverlayProps {
  gameState: GameState;
  onDownload: () => void;
}

export const UIOverlay = ({ gameState, onDownload }: UIOverlayProps) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center overflow-hidden pointer-events-none" style={{ fontFamily: "'GameFont', sans-serif" }}>
      
      {/* End Card Overlay */}
      {gameState === 'EndCard' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-evenly py-12 z-50 pointer-events-auto animate-[fadeIn_0.5s_ease-out]">
          
          {/* Victory Banner */}
          <div className="relative animate-[slideDown_0.8s_cubic-bezier(0.175,0.885,0.32,1.275)]">
            <svg width="340" height="170" viewBox="0 0 300 150" className="drop-shadow-[0_8px_0_rgba(0,0,0,0.8)]">
              <path d="M20,20 L280,10 L260,90 L180,100 L160,130 L150,100 L30,110 Z" fill="#ffeb3b" stroke="#000" strokeWidth="8" strokeLinejoin="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pb-6 pr-4">
              <h1 className="text-5xl text-[#1a1a2e] italic" 
                  style={{ 
                    WebkitTextStroke: '1.5px #1a1a2e',
                    transform: 'rotate(-2deg)'
                  }}>
                VICTORY!
              </h1>
            </div>
          </div>

          {/* Gift Box */}
          <div className="relative w-64 h-64 animate-[pulseScale_2s_infinite_ease-in-out]">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_15px_10px_rgba(0,0,0,0.4)]">
              {/* Box Bottom */}
              <path d="M40,90 L160,90 L150,170 L50,170 Z" fill="#1e88e5" />
              <path d="M40,90 L100,90 L100,170 L50,170 Z" fill="#1565c0" />
              
              {/* Stars on Box */}
              <path d="M60,120 L65,135 L80,135 L68,145 L72,160 L60,150 L48,160 L52,145 L40,135 L55,135 Z" fill="#64b5f6" opacity="0.8" />
              <path d="M130,110 L133,120 L143,120 L135,127 L138,137 L130,130 L122,137 L125,127 L117,120 L127,120 Z" fill="#64b5f6" opacity="0.8" />
              <path d="M140,150 L142,156 L148,156 L143,160 L145,166 L140,162 L135,166 L137,160 L132,156 L138,156 Z" fill="#64b5f6" opacity="0.8" />

              {/* Box Lid */}
              <path d="M30,70 L170,70 L165,95 L35,95 Z" fill="#42a5f5" />
              <path d="M30,70 L100,70 L100,95 L35,95 Z" fill="#2196f3" />
              
              {/* Vertical Ribbon */}
              <path d="M90,70 L110,70 L110,170 L90,170 Z" fill="#ffffff" />
              <path d="M90,70 L100,70 L100,170 L90,170 Z" fill="#f5f5f5" />
              
              {/* Horizontal Ribbon on Lid */}
              <path d="M32,78 L168,78 L166,88 L34,88 Z" fill="#ffffff" />
              <path d="M32,78 L100,78 L100,88 L34,88 Z" fill="#f5f5f5" />

              {/* Bow Left */}
              <path d="M100,70 C100,70 60,30 50,50 C40,70 90,70 90,70 Z" fill="#ffffff" />
              <path d="M100,70 C100,70 70,40 60,55 C50,70 90,70 90,70 Z" fill="#e0e0e0" />
              
              {/* Bow Right */}
              <path d="M100,70 C100,70 140,30 150,50 C160,70 110,70 110,70 Z" fill="#ffffff" />
              <path d="M100,70 C100,70 130,40 140,55 C150,70 110,70 110,70 Z" fill="#e0e0e0" />
              
              {/* Bow Center */}
              <circle cx="100" cy="70" r="8" fill="#ffffff" />
            </svg>
          </div>

          {/* Download Button */}
          <div className="pointer-events-auto">
            <button 
              onClick={onDownload}
              className="relative group animate-[pulseScale_1.5s_infinite_ease-in-out]"
            >
              <div className="absolute inset-0 bg-[#000000] rounded-3xl translate-y-2"></div>
              <div className="relative bg-gradient-to-b from-[#a8ff78] to-[#2ecc71] border-4 border-black rounded-3xl px-10 py-4 transform transition-transform active:translate-y-2">
                <div className="absolute inset-0 bg-white/30 rounded-2xl h-1/3 mx-2 mt-1"></div>
                <span className="relative text-4xl text-white leading-none block text-center" 
                      style={{ 
                        WebkitTextStroke: '1.5px black',
                        textShadow: '0 3px 0 #000'
                      }}>
                  DOWNLOAD<br/>NOW
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Instruction & Hand */}
      {gameState === 'Idle' && (
        <div className="absolute top-[18%] left-0 w-full flex flex-col items-center pointer-events-none z-20 px-8">
          <div className="bg-black/60 backdrop-blur-md border-4 border-white/30 rounded-[2.5rem] px-10 py-8 flex flex-col items-center shadow-2xl animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-4xl sm:text-5xl text-white mb-8 text-center leading-tight whitespace-nowrap" 
                style={{ 
                  WebkitTextStroke: '1.5px black',
                  textShadow: '0 4px 0 #000'
                }}>
              DRAG AND<br/>RELEASE
            </h2>
            <div className="relative w-full h-20">
              <img 
                src={HAND_DATA} 
                alt="Drag Hand" 
                className="w-20 h-20 absolute top-0 left-1/2 -translate-x-1/2 animate-[dragDown_1.5s_infinite]"
                style={{ filter: 'drop-shadow(0 8px 4px rgba(0,0,0,0.6)) grayscale(0.2)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom CTA - Hidden during EndCard */}
      {gameState !== 'EndCard' && (
        <div className="absolute bottom-8 w-full flex items-center justify-center pointer-events-auto z-40">
          <button 
            onClick={onDownload}
            className="relative group animate-[pulseScale_1.5s_infinite_ease-in-out]"
          >
            <div className="absolute inset-0 bg-black rounded-2xl translate-y-1.5"></div>
            <div className="relative bg-gradient-to-b from-[#a8ff78] to-[#16a085] border-4 border-black rounded-2xl px-6 py-3 transform transition-transform active:translate-y-1.5">
              <div className="absolute inset-0 bg-white/20 rounded-xl h-1/2"></div>
              <span className="relative text-2xl text-white leading-none block text-center" 
                    style={{ 
                      WebkitTextStroke: '1px black',
                      textShadow: '0 2px 0 #000'
                    }}>
                DOWNLOAD<br/>NOW
              </span>
            </div>
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dragDown {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          70% { transform: translate(-50%, 120px) scale(0.9); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 0; }
        }
        @keyframes pulseScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes slideDown {
          0% { transform: translateY(-200%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}} />
    </div>
  );
};
