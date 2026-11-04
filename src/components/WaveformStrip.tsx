import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface WaveformStripProps {
    analyser: RefObject<AnalyserNode | null>;
}

/**
 * The last two seconds of level, drawn as a mirrored envelope. Peaks are sampled
 * once per animation frame into a ring buffer, so the strip is a real timeline
 * of the audio rather than a snapshot, and its right edge sits on the trail head.
 */
const COLUMNS = 120;

export const WaveformStrip = ({ analyser }: WaveformStripProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const peaks = useRef(new Float32Array(COLUMNS));
    const buffer = useRef<Float32Array<ArrayBuffer> | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        let cursor = 0;

        const draw = () => {
            frame = requestAnimationFrame(draw);

            const node = analyser.current;
            if (node && !buffer.current) buffer.current = new Float32Array(node.fftSize);
            if (node && buffer.current) {
                node.getFloatTimeDomainData(buffer.current);
                let peak = 0;
                for (let i = 0; i < buffer.current.length; i++) {
                    const v = Math.abs(buffer.current[i]);
                    if (v > peak) peak = v;
                }
                peaks.current[cursor] = Math.min(1, peak);
            } else {
                peaks.current[cursor] = 0;
            }
            cursor = (cursor + 1) % COLUMNS;

            const dpr = window.devicePixelRatio || 1;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
                canvas.width = Math.round(width * dpr);
                canvas.height = Math.round(height * dpr);
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);

            const columnWidth = width / COLUMNS;
            const middle = height / 2;

            for (let i = 0; i < COLUMNS; i++) {
                const value = peaks.current[(cursor + i) % COLUMNS];
                const barHeight = Math.max(1, value * (height - 2));
                // The newest samples carry the signal colour; the rest stays engraved.
                const recency = i / COLUMNS;
                ctx.fillStyle = recency > 0.9
                    ? 'rgba(232, 163, 61, 0.9)'
                    : `rgba(141, 132, 120, ${0.18 + recency * 0.25})`;
                ctx.fillRect(i * columnWidth, middle - barHeight / 2, Math.max(1, columnWidth - 1), barHeight);
            }
        };

        frame = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frame);
    }, [analyser]);

    return <canvas ref={canvasRef} className="block h-10 w-full" aria-hidden="true" />;
};
