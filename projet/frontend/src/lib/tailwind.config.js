/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './src/**/*.{html,js,svelte,ts}'
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#007bff',
            dark: '#0056b3',
            light: '#66b0ff'
          },
          secondary: {
            DEFAULT: '#6c757d',
            dark: '#545b62',
            light: '#868e96'
          },
          dark: '#343a40',
          muted: '#6c757d'
        }
      },
    },
    plugins: [],
  }