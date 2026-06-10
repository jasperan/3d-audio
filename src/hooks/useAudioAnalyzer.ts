import { useEffect, useRef, useState } from 'react';
import Meyda from 'meyda';
import type { MeydaAnalyzer } from 'meyda/dist/esm/meyda-wa';

export interface AudioFeatures {
    spectralCentroid: number;
    spectralSpread: number;
    spectralFlux: number;
    rms: number;
}

type AudioContextConstructor = typeof AudioContext;
interface WindowWithWebkitAudio extends Window {
    webkitAudioContext?: AudioContextConstructor;
}

const FEATURES = ['spectralCentroid', 'spectralSpread', 'spectralFlux', 'rms'] as const;

export const useAudioAnalyzer = (
    audioElement: HTMLMediaElement | null,
    enabled: boolean
) => {
    const [features, setFeatures] = useState<AudioFeatures | null>(null);
    const analyzerRef = useRef<MeydaAnalyzer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const requestRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!audioElement || !enabled) return;

        if (!audioContextRef.current) {
            const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
            if (!Ctor) return;
            audioContextRef.current = new Ctor();
        }
        const ctx = audioContextRef.current;

        // Browser autoplay policy: resume the context on user gesture.
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        if (!sourceRef.current) {
            // createMediaElementSource throws InvalidStateError if the element already has a source.
            try {
                sourceRef.current = ctx.createMediaElementSource(audioElement);
                sourceRef.current.connect(ctx.destination);
            } catch (e) {
                console.warn('Source already connected', e);
            }
        }
        const source = sourceRef.current;

        if (source && !analyzerRef.current) {
            analyzerRef.current = Meyda.createMeydaAnalyzer({
                audioContext: ctx,
                source,
                bufferSize: 512,
                featureExtractors: [...FEATURES],
                callback: () => {
                    // Values are pulled in the rAF tick below to sync with the render frame.
                },
            });
            analyzerRef.current.start();
        }

        const tick = () => {
            const analyzer = analyzerRef.current;
            if (analyzer) {
                // Meyda's typed result omits `spectralFlux`, so read through a
                // loose numeric view and verify presence before publishing.
                const raw = analyzer.get([...FEATURES]) as Partial<Record<(typeof FEATURES)[number], number>> | null;
                if (
                    raw &&
                    raw.spectralCentroid != null &&
                    raw.spectralSpread != null &&
                    raw.spectralFlux != null &&
                    raw.rms != null
                ) {
                    setFeatures({
                        spectralCentroid: raw.spectralCentroid,
                        spectralSpread: raw.spectralSpread,
                        spectralFlux: raw.spectralFlux,
                        rms: raw.rms,
                    });
                }
            }
            requestRef.current = requestAnimationFrame(tick);
        };

        requestRef.current = requestAnimationFrame(tick);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (analyzerRef.current) analyzerRef.current.stop();
        };
    }, [audioElement, enabled]);

    return features;
};
