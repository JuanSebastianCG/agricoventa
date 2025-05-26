module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  safelist: [
    'bg-green-1',
    'text-green-1',
    'border-green-1',
    'hover:bg-green-0-9',
    'focus:border-green-1',
    'btn-green'
  ],
  theme: {
    extend: {
      colors: {
        red: {
          1: '#EF4444',
        },
        gray: {
          '0-5': '#AAABAD',
          1: '#555658',
        },
        blue: {
          3: '#111827',
          '1-5': '#EFF6FF',
          2: '#DBEAFE',
        },
        green: {
          '0-1': '#E3E986',
          1: '#046B4D',    // Este color se usará en bg-green-1, text-green-1, etc.
          '0-9': '#2E7D32',
          '0-8': '#54965F',
          '0-7': '#85BE2B',
          '0-6': '#98C070',
          '0-5': '#D1FAE5',
          '0-4': '#ECFDF5',
        },
        yellow: {
          1: '#F1B303',
          '1-5': '#FFC107',
          2: '#FFE600',
        },
        black: '#000000',
        white: '#FFFFFF',
      },
      backgroundColor: {
        'green-primary': '#046B4D',
        'green-hover': '#2E7D32',
      },
      textColor: {
        'green-primary': '#046B4D',
      },
      borderColor: {
        'green-primary': '#046B4D',
      }
    },
  },
  plugins: [],
};
