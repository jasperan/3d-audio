import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioFeatures } from '../hooks/useAudioAnalyzer';

interface TimbreCloudProps {
    features: AudioFeatures | null;
}

const HISTORY_SIZE = 500;
// Normalization constants (tunable per-audio).
const MAX_CENTROID = 8000; // Hz
const MAX_SPREAD = 200;
const MAX_FLUX = 100;
const DECAY = 0.95;

export const TimbreCloud = ({ features }: TimbreCloudProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const lineRef = useRef<THREE.LineSegments>(null);

    // History buffer laid out as [x0, y0, z0, x1, y1, z1, ...].
    const history = useMemo(() => new Float32Array(HISTORY_SIZE * 3), []);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const lineGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HISTORY_SIZE * 3), 3));
        return geo;
    }, []);

    // history is a pre-allocated ring buffer intentionally mutated each frame.
    /* eslint-disable react-hooks/immutability */
    useFrame(() => {
        if (!meshRef.current) return;

        // Shift every sample one slot toward the tail.
        history.copyWithin(3, 0, (HISTORY_SIZE - 1) * 3);

        if (features) {
            const x = THREE.MathUtils.mapLinear(Math.min(features.spectralCentroid, MAX_CENTROID), 0, MAX_CENTROID, -10, 10);
            const y = THREE.MathUtils.mapLinear(Math.min(features.spectralSpread, MAX_SPREAD), 0, MAX_SPREAD, -5, 15);
            const z = THREE.MathUtils.mapLinear(Math.min(features.spectralFlux * 100, MAX_FLUX), 0, MAX_FLUX, -10, 10);

            history[0] = x;
            history[1] = y;
            history[2] = z;
        } else {
            history[0] *= DECAY;
            history[1] *= DECAY;
            history[2] *= DECAY;
        }

        for (let i = 0; i < HISTORY_SIZE; i++) {
            const base = i * 3;
            dummy.position.set(history[base], history[base + 1], history[base + 2]);

            const age = i / HISTORY_SIZE;
            const scale = (1 - age) * 0.5 + 0.1;
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;

        if (lineRef.current) {
            const pos = lineRef.current.geometry.attributes.position;
            (pos.array as Float32Array).set(history);
            pos.needsUpdate = true;
        }
    });
    /* eslint-enable react-hooks/immutability */


    return (
        <group>
            <instancedMesh ref={meshRef} args={[undefined, undefined, HISTORY_SIZE]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial color="#00f3ff" toneMapped={false} />
            </instancedMesh>

            {/* @ts-expect-error R3F lowercase `line` element is valid at runtime but not in the JSX intrinsic types. */}
            <line ref={lineRef} geometry={lineGeo}>
                <lineBasicMaterial color="#ff00ff" transparent opacity={0.5} />
            </line>
        </group>
    );
};
