import { useEffect, useRef, useState } from 'react';
import Meyda from 'meyda';

export interface AudioFeatures {
    spectralCentroid: number;
    spectralSpread: number;
    spectralFlux: number;
    rms: number;
    mfcc: number[];
}

export const useAudioAnalyzer = (
    audioElement: HTMLMediaElement | null,
    enabled: boolean
) => {
    const [features, setFeatures] = useState<AudioFeatures | null>(null);
    const analyzerRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const requestRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!audioElement || !enabled) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        if (!sourceRef.current) {
            // Double check not to create multiple sources for same element to avoid error
            try {
                sourceRef.current = ctx.createMediaElementSource(audioElement);
                sourceRef.current.connect(ctx.destination);
            } catch (e) {
                console.warn("Source already connected", e);
            }
        }
        const source = sourceRef.current;

        if (source && !analyzerRef.current) {
            analyzerRef.current = Meyda.createMeydaAnalyzer({
                audioContext: ctx,
                source: source,
                bufferSize: 512,
                featureExtractors: [
                    'spectralCentroid',
                    'spectralSpread',
                    'spectralFlux',
                    'rms',
                    'mfcc'
                ],
                callback: () => {
                    // We'll pull data in the loop instead of callback to sync with frame
                }
            });
            analyzerRef.current.start();
        }

        const tick = () => {
            if (analyzerRef.current) {
                const rawFeatures = analyzerRef.current.get(['spectralCentroid', 'spectralSpread', 'spectralFlux', 'rms', 'mfcc']);
                if (rawFeatures) {
                    setFeatures(rawFeatures as AudioFeatures);
                }
            }
            requestRef.current = requestAnimationFrame(tick);
        };

        requestRef.current = requestAnimationFrame(tick);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (analyzerRef.current) analyzerRef.current.stop();
        }
    }, [audioElement, enabled]);

    return features;
};
