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

// Middle of the plotted volume: where the head rests when nothing is playing.
const CENTER = new THREE.Vector3(0, 5, 0);

const HEAD_COLOR = new THREE.Color('#e8a33d');
const TAIL_COLOR = new THREE.Color('#2a2420');

function glowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(232, 163, 61, 0.55)');
        gradient.addColorStop(0.4, 'rgba(232, 163, 61, 0.14)');
        gradient.addColorStop(1, 'rgba(232, 163, 61, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
}

export const TimbreCloud = ({ features }: TimbreCloudProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const glowRef = useRef<THREE.Sprite>(null);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const scratch = useMemo(() => new THREE.Color(), []);
    const glowScale = useRef(0.6);

    // Build the trail line imperatively so its geometry buffer can be mutated
    // in place each frame. (`<line>` is valid at runtime but absent from R3F's
    // JSX intrinsic types, so a primitive avoids a type suppression.)
    // Its position attribute, laid out as [x0, y0, z0, x1, y1, z1, ...], is the
    // single source of truth for the trail; the instanced dots read from it too.
    const line = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(HISTORY_SIZE * 3);
        for (let i = 0; i < HISTORY_SIZE; i++) {
            positions[i * 3] = CENTER.x;
            positions[i * 3 + 1] = CENTER.y;
            positions[i * 3 + 2] = CENTER.z;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({
            color: '#e8a33d',
            transparent: true,
            opacity: 0.35,
            toneMapped: false,
        });
        return new THREE.Line(geo, material);
    }, []);

    const glow = useMemo(() => glowTexture(), []);

    // The geometry's position array is a pre-allocated shift buffer mutated each frame.
    /* eslint-disable react-hooks/immutability */
    useFrame((_, delta) => {
        if (!meshRef.current) return;

        const pos = line.geometry.attributes.position;
        const history = pos.array as Float32Array;

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
            history[0] = CENTER.x + (history[0] - CENTER.x) * DECAY;
            history[1] = CENTER.y + (history[1] - CENTER.y) * DECAY;
            history[2] = CENTER.z + (history[2] - CENTER.z) * DECAY;
        }

        for (let i = 0; i < HISTORY_SIZE; i++) {
            const base = i * 3;
            dummy.position.set(history[base], history[base + 1], history[base + 2]);

            const age = i / HISTORY_SIZE;
            const scale = (1 - age) * 0.34 + 0.06;
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);

            // Colour carries the age, so the trail fades into the bench.
            scratch.copy(HEAD_COLOR).lerp(TAIL_COLOR, Math.min(1, age * 1.4));
            meshRef.current.setColorAt(i, scratch);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

        pos.needsUpdate = true;

        // Head glow follows the trail head, eased toward the current level.
        const target = 0.55 + Math.min(features?.rms ?? 0, 0.6) * 14;
        const ease = 1 - Math.exp(-delta * 6);
        glowScale.current += (target - glowScale.current) * ease;
        if (glowRef.current) {
            glowRef.current.position.set(history[0], history[1], history[2]);
            glowRef.current.scale.setScalar(glowScale.current);
        }
    });
    /* eslint-enable react-hooks/immutability */

    return (
        <group>
            <instancedMesh ref={meshRef} args={[undefined, undefined, HISTORY_SIZE]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>

            <primitive object={line} />

            <sprite ref={glowRef} scale={0.6}>
                <spriteMaterial map={glow} transparent depthWrite={false} toneMapped={false} />
            </sprite>
        </group>
    );
};
