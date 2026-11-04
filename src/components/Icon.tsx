import type { FC, ReactElement } from 'react';

export type IconName = 'play' | 'pause' | 'upload';

interface IconProps {
    name: IconName;
    size?: number;
}

const PATHS: Record<IconName, ReactElement> = {
    play: <polygon points="6 3 20 12 6 21" />,
    pause: (
        <>
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
        </>
    ),
    upload: (
        <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </>
    ),
};

/** One line icon set, 16px, stroke 1.5, colour inherited from the text role. */
export const Icon: FC<IconProps> = ({ name, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {PATHS[name]}
    </svg>
);
