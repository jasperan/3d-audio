import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioFeatures } from '../hooks/useAudioAnalyzer';

interface TimbreCloudProps {
    features: AudioFeatures | null;
}

const HISTORY_SIZE = 500; // number of particles in total (trail length)
// Normalization constants (Estimated, can be tuned)
const MAX_CENTROID = 8000; // Hz
const MAX_SPREAD = 200;
const MAX_FLUX = 100;

export const TimbreCloud = ({ features }: TimbreCloudProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const lineRef = useRef<THREE.LineSegments>(null);

    // Data history buffer: [x, y, z, ...repeat]
    const history = useMemo(() => new Float32Array(HISTORY_SIZE * 3), []);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Create geometry for lines
    // We'll use a fast update strategy: simpler logic
    const lineGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HISTORY_SIZE * 3), 3));
        return geo;
    }, []);

    useFrame(() => {
        if (!meshRef.current) return;

        // 1. Shift data
        // Move all points back one step in history
        // Since it's a flat array [x0, y0, z0, x1, y1, z1...]
        // copy within the array from 0 to N-1 into 1 to N
        history.copyWithin(3, 0, (HISTORY_SIZE - 1) * 3);

        // 2. Inject new data at index 0
        if (features) {
            // Normalize
            // Centroid (X): Map 0-MAX_CENTROID to -10 to 10
            const x = THREE.MathUtils.mapLinear(Math.min(features.spectralCentroid, MAX_CENTROID), 0, MAX_CENTROID, -10, 10);

            // Spread (Y): Map 0-MAX_SPREAD to -5 to 15 (Height)
            const y = THREE.MathUtils.mapLinear(Math.min(features.spectralSpread, MAX_SPREAD), 0, MAX_SPREAD, -5, 15);

            // Flux (Z): Map 0-MAX_FLUX to -10 to 10
            const z = THREE.MathUtils.mapLinear(Math.min(features.spectralFlux * 100, MAX_FLUX), 0, MAX_FLUX, -10, 10);

            history[0] = x;
            history[1] = y;
            history[2] = z;
        } else {
            // Decay
            history[0] *= 0.95;
            history[1] *= 0.95;
            history[2] *= 0.95;
        }

        // 3. Update Instances
        for (let i = 0; i < HISTORY_SIZE; i++) {
            const px = history[i * 3 + 0];
            const py = history[i * 3 + 1];
            const pz = history[i * 3 + 2];

            dummy.position.set(px, py, pz);

            // Scale based on age? Fade out tail?
            const age = i / HISTORY_SIZE;
            const scale = (1 - age) * 0.5 + 0.1;
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;

        // 4. Update Lines
        if (lineRef.current) {
            const pos = lineRef.current.geometry.attributes.position;
            // Copy entire history to line buffer
            (pos.array as Float32Array).set(history);
            pos.needsUpdate = true;
        }
    });


    return (
        <group>
            {/* Particles */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, HISTORY_SIZE]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial color="#00f3ff" toneMapped={false} />
            </instancedMesh>

            {/* Trail Lines */}
            {/* @ts-ignore */}
            <line ref={lineRef} geometry={lineGeo}>
                <lineBasicMaterial color="#ff00ff" transparent opacity={0.5} />
            </line>
        </group>
    );
};
