import { OrbitControls, Box, Grid } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { TimbreCloud } from './TimbreCloud';
import type { AudioFeatures } from '../hooks/useAudioAnalyzer';

interface ExperienceProps {
    features: AudioFeatures | null;
}

export const Experience = ({ features }: ExperienceProps) => {
    return (
        <Canvas
            camera={{ position: [15, 10, 15], fov: 45 }}
            style={{ width: '100%', height: '100%', background: '#050505' }}
        >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />

            <TimbreCloud features={features} />

            <Grid
                args={[20, 20]}
                sectionColor="#202020"
                cellColor="#101010"
                position={[0, -5, 0]}
            />

            <Box args={[1, 1, 1]} position={[0, 0, 0]}>
                <meshStandardMaterial color={features ? 'hotpink' : 'gray'} wireframe />
            </Box>

            <EffectComposer>
                <Bloom luminanceThreshold={0.5} intensity={1.5} radius={0.8} />
            </EffectComposer>
        </Canvas>
    );
};
