import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { TimbreCloud } from './TimbreCloud';
import { AxisFrame } from './AxisFrame';
import type { AudioFeatures } from '../hooks/useAudioAnalyzer';

interface ExperienceProps {
    features: AudioFeatures | null;
}

export const Experience = ({ features }: ExperienceProps) => {
    return (
        <Canvas
            camera={{ position: [36, 26, 36], fov: 45 }}
            dpr={[1, 2]}
            style={{ width: '100%', height: '100%', background: '#12100e' }}
        >
            {/* Orbit only on drag: nothing moves on its own. */}
            <OrbitControls
                makeDefault
                target={[0, 4, 0]}
                enablePan={false}
                minDistance={28}
                maxDistance={70}
            />

            <TimbreCloud features={features} />
            <AxisFrame />
        </Canvas>
    );
};
