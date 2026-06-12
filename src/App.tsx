import { useState } from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

function App() {
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const features = useAudioAnalyzer(audioEl, audioEl != null);

  return (
    <div className="w-full h-screen relative bg-sci-fi-bg">
      <Experience features={features} />
      <Overlay onAudioElement={setAudioEl} features={features} />
    </div>
  );
}

export default App;
