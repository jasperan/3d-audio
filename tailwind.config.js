/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Warm near-black ramp, tinted toward the phosphor bench.
                ink: {
                    900: '#12100e',
                    800: '#1a1714',
                    700: '#2a2420',
                    600: '#3a332c',
                },
                text: {
                    primary: '#e8e2d8',
                    secondary: '#b3ab9e',
                    muted: '#8d8478',
                },
                // The one accent: the signal itself.
                signal: '#e8a33d',
            },
            fontFamily: {
                sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
        },
    },
    plugins: [],
}
