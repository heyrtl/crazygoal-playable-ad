import { useState, useEffect, useRef } from 'preact/hooks';
import { GameCanvas, GameState } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { initAudio, playSound } from './utils/audio';

// MRAID declaration
declare var mraid: any;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('Idle');
  const [isViewable, setIsViewable] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Audio on first interaction
    const init = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = initAudio();
      }
    };
    window.addEventListener('pointerdown', init, { once: true });

    // MRAID setup
    if (typeof mraid !== 'undefined') {
      if (mraid.getState() === 'loading') {
        mraid.addEventListener('ready', onSdkReady);
      } else {
        onSdkReady();
      }
    }

    function onSdkReady() {
      setIsViewable(mraid.isViewable());
      mraid.addEventListener('viewableChange', (viewable: boolean) => {
        setIsViewable(viewable);
        if (audioCtxRef.current) {
          if (viewable) {
            audioCtxRef.current.resume();
          } else {
            audioCtxRef.current.suspend();
          }
        }
      });
    }

    return () => {
      window.removeEventListener('pointerdown', init);
    };
  }, []);

  const handleGoal = () => {
    setTimeout(() => {
      setGameState('EndCard');
    }, 1500);
  };

  const handleDownload = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS ? 'https://apps.apple.com/in/app/crazy-goal-fun-soccer-game/id6754873804' : 'https://play.google.com/store/apps/details?id=com.games.wonder.football.strikes';
    
    if (typeof mraid !== 'undefined') {
      mraid.open(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handlePlayAudio = (type: 'kick' | 'goal' | 'bounce') => {
    if (audioCtxRef.current && isViewable) {
      playSound(audioCtxRef.current, type);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#1a1a2e]">
      <div className="absolute inset-0">
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState} 
          onGoal={handleGoal}
          playAudio={handlePlayAudio}
          isViewable={isViewable}
        />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay 
          gameState={gameState} 
          onDownload={handleDownload} 
        />
      </div>
    </div>
  );
}
