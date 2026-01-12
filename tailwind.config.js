/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sci-fi-bg': '#050505',
                'neon-blue': '#00f3ff',
                'neon-pink': '#ff00ff',
                'neon-green': '#00ff00',
            }
        },
    },
    plugins: [],
}
