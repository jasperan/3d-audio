import { useRef, useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, DragEvent, FC, RefObject } from 'react';
import type { AudioFeatures } from '../hooks/useAudioAnalyzer';
import { Icon } from './Icon';
import { WaveformStrip } from './WaveformStrip';

interface OverlayProps {
    onAudioElement: (el: HTMLAudioElement | null) => void;
    features: AudioFeatures | null;
    waveform: RefObject<AnalyserNode | null>;
}

type FeatureKey = keyof Pick<AudioFeatures, 'spectralCentroid' | 'spectralSpread' | 'spectralFlux' | 'rms'>;

const ROWS: { key: FeatureKey; label: string }[] = [
    { key: 'spectralCentroid', label: 'Centroid' },
    { key: 'spectralSpread', label: 'Spread' },
    { key: 'spectralFlux', label: 'Flux' },
    { key: 'rms', label: 'Level' },
];

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const formatFeature = (key: FeatureKey, features: AudioFeatures) => {
    switch (key) {
        case 'spectralCentroid':
            return `${Math.round(features.spectralCentroid)} Hz`;
        case 'spectralSpread':
            return Math.round(features.spectralSpread).toString();
        case 'spectralFlux':
            return features.spectralFlux.toFixed(3);
        case 'rms':
            return features.rms.toFixed(3);
    }
};

export const Overlay: FC<OverlayProps> = ({ onAudioElement, features, waveform }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objectUrlRef = useRef<string | null>(null);

    const [playing, setPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dropping, setDropping] = useState(false);
    const [hot, setHot] = useState<FeatureKey>('spectralFlux');

    const setAudioRef = useCallback(
        (node: HTMLAudioElement | null) => {
            audioRef.current = node;
            onAudioElement(node);
        },
        [onAudioElement]
    );

    const loadSource = useCallback((src: string, name: string) => {
        const el = audioRef.current;
        if (!el) return;
        // Release any blob URL from a previous upload before swapping the source.
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
        if (src.startsWith('blob:')) objectUrlRef.current = src;
        setFileName(name);
        setPosition(0);
        setDuration(0);
        el.src = src;
        // Autoplay-policy rejections are expected; swallow them to avoid unhandled-rejection noise.
        el.play().catch(() => {});
    }, []);

    const acceptFile = useCallback(
        (file: File | undefined) => {
            if (!file || !file.type.startsWith('audio/')) return;
            loadSource(URL.createObjectURL(file), file.name);
        },
        [loadSource]
    );

    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        acceptFile(e.target.files?.[0]);
        e.target.value = '';
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDropping(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDropping(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDropping(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };

    const togglePlay = () => {
        const el = audioRef.current;
        if (!el || !el.src) return;
        if (el.paused) el.play().catch(() => {});
        else el.pause();
    };

    // Revoke any outstanding blob URL when the overlay unmounts.
    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, []);

    // The row that moved most since the last check carries the accent, so the
    // panel shows which part of the spectrum is alive. Throttled to stay readable.
    const previous = useRef<AudioFeatures | null>(null);
    const lastSwitch = useRef(0);
    useEffect(() => {
        if (!features) return;
        const prev = previous.current;
        previous.current = features;
        if (!prev) return;
        const now = performance.now();
        if (now - lastSwitch.current < 300) return;
        lastSwitch.current = now;

        const deltas: Record<FeatureKey, number> = {
            spectralCentroid: Math.abs(features.spectralCentroid - prev.spectralCentroid) / 8000,
            spectralSpread: Math.abs(features.spectralSpread - prev.spectralSpread) / 200,
            spectralFlux: Math.abs(features.spectralFlux - prev.spectralFlux),
            rms: Math.abs(features.rms - prev.rms),
        };
        const next = (Object.keys(deltas) as FeatureKey[]).reduce((a, b) => (deltas[b] > deltas[a] ? b : a));
        setHot(next);
    }, [features]);

    return (
        <div
            className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none md:p-8"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <header className="panel-in">
                <h1 className="text-[20px] font-medium leading-6 tracking-[-0.01em] text-text-primary">Timbre</h1>
                <p className="mt-2 max-w-[34ch] text-[13px] leading-5 text-text-secondary">
                    Centroid, spread and flux of a file, plotted as one path through the space.
                </p>
            </header>

            <section
                className={`panel-in w-[280px] rounded-[10px] border bg-ink-800 p-5 pointer-events-auto transition-colors duration-150 ${
                    dropping ? 'border-signal/60' : 'border-white/[0.08]'
                }`}
            >
                <audio
                    ref={setAudioRef}
                    className="hidden"
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                    onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                />

                <div className="flex items-center gap-2">
                    <label className="flex h-9 flex-1 cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 text-[13px] text-text-primary transition-colors duration-150 hover:bg-white/[0.04]">
                        <span className="text-text-muted">
                            <Icon name="upload" />
                        </span>
                        Choose file
                        <input type="file" accept="audio/*" onChange={handleUpload} className="sr-only" />
                    </label>
                    <button
                        type="button"
                        onClick={() => loadSource('/test.mp3', 'test.mp3')}
                        className="h-9 rounded-md px-2 text-[13px] text-text-secondary transition-colors duration-150 hover:text-text-primary"
                    >
                        Load sample
                    </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={togglePlay}
                        disabled={!fileName}
                        aria-label={playing ? 'Pause' : 'Play'}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-text-primary transition-colors duration-150 hover:bg-white/[0.04] disabled:opacity-40"
                    >
                        <Icon name={playing ? 'pause' : 'play'} />
                    </button>
                    <span className="font-mono text-[12px] tabular-nums text-text-secondary">
                        {formatTime(position)} / {formatTime(duration)}
                    </span>
                    <span className="ml-auto max-w-[96px] truncate font-mono text-[12px] text-text-muted">
                        {fileName ?? 'no file'}
                    </span>
                </div>

                <div className="mt-3 rounded-md border border-white/[0.06] bg-ink-900/60 px-2 py-1">
                    <WaveformStrip analyser={waveform} />
                </div>

                <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                    {ROWS.map(({ key, label }) => (
                        <div key={key} className="col-span-2 grid grid-cols-subgrid">
                            <dt className="text-[12px] leading-5 text-text-muted">{label}</dt>
                            <dd
                                className={`text-right font-mono text-[13px] leading-5 tabular-nums ${
                                    hot === key && features ? 'text-signal' : 'text-text-primary'
                                }`}
                            >
                                {features ? formatFeature(key, features) : '—'}
                            </dd>
                        </div>
                    ))}
                </dl>

                {!fileName && (
                    <p className="mt-4 text-[12px] leading-4 text-text-muted">Drop an audio file to start</p>
                )}
            </section>
        </div>
    );
};
