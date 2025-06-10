/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify the files that Tailwind should scan for class names
  content: [
      "./src/**/*.{js,ts,jsx,tsx}" // Include all JavaScript and TypeScript files in the src directory
  ],
  // Theme configuration
  theme: {
    extend: {}, // Extend the default Tailwind theme
  },
  // Additional plugins
  plugins: [], // No additional plugins currently installed
}

