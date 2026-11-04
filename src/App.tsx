import { useState } from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

function App() {
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const { features, waveform } = useAudioAnalyzer(audioEl, audioEl != null);

  return (
    <div className="relative h-screen w-full bg-ink-900">
      <Experience features={features} />
      <Overlay onAudioElement={setAudioEl} features={features} waveform={waveform} />
    </div>
  );
}

export default App;
