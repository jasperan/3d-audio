import type { ChangeEvent, FC, RefObject } from 'react';
import type { AudioFeatures } from '../hooks/useAudioAnalyzer';

interface OverlayProps {
    onFileChange: (file: File) => void;
    audioRef: RefObject<HTMLAudioElement | null>;
    setAudioRef: (node: HTMLAudioElement | null) => void;
    features: AudioFeatures | null;
}

export const Overlay: FC<OverlayProps> = ({ onFileChange, audioRef, setAudioRef, features }) => {
    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileChange(file);
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-8 text-white">
            <div className="pointer-events-auto">
                <h1 className="text-4xl font-bold tracking-tighter mb-2 font-mono text-neon-blue">
                    TIMBRE_SPACE_VISUALIZER
                </h1>
                <div className="flex gap-4 items-center bg-gray-900/50 p-4 rounded backdrop-blur-sm border border-gray-700 w-fit">
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-blue file:text-black hover:file:bg-cyan-400"
                    />
                    <button
                        onClick={() => {
                            if (audioRef.current) {
                                audioRef.current.src = '/test.mp3';
                                audioRef.current.play();
                            }
                        }}
                        className="px-4 py-2 bg-neon-pink text-black font-bold rounded hover:bg-pink-400"
                    >
                        LOAD TEST
                    </button>
                    <audio ref={setAudioRef} controls className="w-64 accent-neon-blue" />
                </div>
            </div>

            <div className="pointer-events-auto bg-black/60 p-4 rounded border border-gray-800 font-mono text-xs w-64 backdrop-blur-md">
                <h3 className="text-neon-pink mb-2 border-b border-gray-700 pb-1">REAL-TIME DATA</h3>
                {features ? (
                    <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                        <span className="text-gray-400">Centroid:</span>
                        <span className="text-right text-cyan-300">{Math.round(features.spectralCentroid)} Hz</span>

                        <span className="text-gray-400">Spread:</span>
                        <span className="text-right text-pink-300">{Math.round(features.spectralSpread)}</span>

                        <span className="text-gray-400">Flux:</span>
                        <span className="text-right text-yellow-300">{features.spectralFlux.toFixed(4)}</span>

                        <span className="text-gray-400">RMS:</span>
                        <span className="text-right text-green-300">{features.rms.toFixed(4)}</span>
                    </div>
                ) : (
                    <div className="text-gray-500 italic">Waiting for audio...</div>
                )}
            </div>
        </div>
    );
};
