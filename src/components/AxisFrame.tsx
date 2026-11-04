import { useMemo } from 'react';
import * as THREE from 'three';

// Volume the trail lives in, shared with TimbreCloud's mapping.
const X = { min: -10, max: 10, label: 'centroid · Hz' };
const Y = { min: -5, max: 15, label: 'spread' };
const Z = { min: -10, max: 10, label: 'flux' };

const TICK = 0.5;

const textureCache = new Map<string, THREE.CanvasTexture>();

/** Labels as canvas textures: no font fetch, crisp at any zoom. */
function labelTexture(text: string, color: string, px: number) {
    const key = `${text}|${color}|${px}`;
    const cached = textureCache.get(key);
    if (cached) return cached;

    const measure = document.createElement('canvas').getContext('2d');
    const font = `500 ${px}px "IBM Plex Mono", ui-monospace, monospace`;
    if (measure) measure.font = font;

    const pad = px * 0.4;
    const width = Math.ceil(measure ? measure.measureText(text).width : text.length * px * 0.6) + pad * 2;
    const height = Math.ceil(px * 1.4);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, pad, height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.userData.aspect = width / height;
    textureCache.set(key, texture);
    return texture;
}

function Label({ text, position, height = 0.7, color = '#9d937f', px = 34 }: {
    text: string;
    position: [number, number, number];
    height?: number;
    color?: string;
    px?: number;
}) {
    const texture = useMemo(() => labelTexture(text, color, px), [text, color, px]);
    const aspect = (texture.userData.aspect as number) ?? 4;
    return (
        <sprite position={position} scale={[height * aspect, height, 1]}>
            <spriteMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
        </sprite>
    );
}

/**
 * Engraved instrument frame: the volume as a faint box, ticks and unit labels
 * along its three back edges, so the trail reads against real axes.
 */
export const AxisFrame = () => {
    const { ticks, box } = useMemo(() => {
        const points: number[] = [];
        for (let x = X.min; x <= X.max; x += 2) points.push(x, Y.min, Z.min, x, Y.min, Z.min + TICK);
        for (let z = Z.min; z <= Z.max; z += 2) points.push(X.min, Y.min, z, X.min + TICK, Y.min, z);
        for (let y = Y.min; y <= Y.max; y += 2) points.push(X.min, y, Z.min, X.min + TICK, y, Z.min);

        const tickGeometry = new THREE.BufferGeometry();
        tickGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

        const boxGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(X.min, Y.min, Z.min), new THREE.Vector3(X.max, Y.min, Z.min),
            new THREE.Vector3(X.max, Y.min, Z.min), new THREE.Vector3(X.max, Y.max, Z.min),
            new THREE.Vector3(X.max, Y.max, Z.min), new THREE.Vector3(X.min, Y.max, Z.min),
            new THREE.Vector3(X.min, Y.max, Z.min), new THREE.Vector3(X.min, Y.min, Z.min),
            new THREE.Vector3(X.min, Y.min, Z.max), new THREE.Vector3(X.max, Y.min, Z.max),
            new THREE.Vector3(X.max, Y.min, Z.max), new THREE.Vector3(X.max, Y.max, Z.max),
            new THREE.Vector3(X.max, Y.max, Z.max), new THREE.Vector3(X.min, Y.max, Z.max),
            new THREE.Vector3(X.min, Y.max, Z.max), new THREE.Vector3(X.min, Y.min, Z.max),
            new THREE.Vector3(X.min, Y.min, Z.max), new THREE.Vector3(X.min, Y.min, Z.min),
            new THREE.Vector3(X.max, Y.min, Z.max), new THREE.Vector3(X.max, Y.min, Z.min),
            new THREE.Vector3(X.max, Y.max, Z.max), new THREE.Vector3(X.max, Y.max, Z.min),
            new THREE.Vector3(X.min, Y.max, Z.max), new THREE.Vector3(X.min, Y.max, Z.min),
        ]);

        return { ticks: tickGeometry, box: boxGeometry };
    }, []);

    return (
        <group>
            <lineSegments geometry={box}>
                <lineBasicMaterial color="#241f1b" toneMapped={false} />
            </lineSegments>

            <lineSegments geometry={ticks}>
                <lineBasicMaterial color="#4a4238" toneMapped={false} />
            </lineSegments>

            <Label text={X.label} position={[X.max + 1.2, Y.min - 1.1, Z.min]} />

            <Label text={Y.label} position={[X.min, Y.max + 1.2, Z.min]} />
            <Label text={Z.label} position={[X.min, Y.min - 1.2, Z.max + 1.2]} />
        </group>
    );
};
