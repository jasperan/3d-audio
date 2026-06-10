import { useState } from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const features = useAudioAnalyzer(audioEl, !!audioFile);

  return (
    <div className="w-full h-screen relative bg-sci-fi-bg">
      <Experience features={features} />
      <Overlay
        onUpload={setAudioFile}
        onAudioElement={setAudioEl}
        features={features}
      />
    </div>
  );
}

export default App;
