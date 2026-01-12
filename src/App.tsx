import { useState, useRef } from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const features = useAudioAnalyzer(audioRef.current, !!audioFile);

  const handleFileChange = (file: File) => {
    setAudioFile(file);
    if (audioRef.current) {
      audioRef.current.src = URL.createObjectURL(file);
      audioRef.current.play();
    }
  };

  return (
    <div className="w-full h-screen relative bg-sci-fi-bg">
      <Experience features={features} />
      <Overlay
        onFileChange={handleFileChange}
        audioRef={audioRef}
        features={features}
      />
    </div>
  );
}

export default App;
