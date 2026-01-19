/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // srcを使わない場合用(念のため)
  ],
  theme: {
    extend: {
      fontFamily: {
        // layout.tsxで定義した変数をここで紐付けます
        sans: ['var(--font-jakarta)', 'var(--font-noto)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}