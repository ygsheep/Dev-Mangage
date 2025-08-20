/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 使用CSS变量的主题色
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        // 主题背景色
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-paper': 'var(--color-bg-paper)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-code': 'var(--color-bg-code)',
        // 主题文字色
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-inverse': 'var(--color-text-inverse)',
        'text-link': 'var(--color-text-link)',
        // 主题边框色
        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'border-focus': 'var(--color-border-focus)',
        'border-error': 'var(--color-border-error)',
        'border-success': 'var(--color-border-success)',
        // 状态色
        'status-success': 'var(--color-status-success)',
        'status-warning': 'var(--color-status-warning)',
        'status-error': 'var(--color-status-error)',
        'status-info': 'var(--color-status-info)',
        // Gray colors with dark mode support using CSS variables
        gray: {
          50: 'var(--bg-gray-50)',
          100: 'var(--bg-gray-100)',
          200: 'var(--bg-gray-200)',
          300: 'var(--bg-gray-300)',
          400: 'var(--bg-gray-400)',
          500: 'var(--bg-gray-500)',
          600: 'var(--bg-gray-600)',
          700: 'var(--bg-gray-700)',
          800: 'var(--bg-gray-800)',
          900: 'var(--bg-gray-900)',
        },
      },
      // 确保背景色正确映射
      backgroundColor: {
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-paper': 'var(--color-bg-paper)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-code': 'var(--color-bg-code)',
      },
      // 添加主题圆角
      borderRadius: {
        'theme-sm': 'var(--radius-sm)',
        'theme-md': 'var(--radius-md)',
        'theme-lg': 'var(--radius-lg)',
        'theme-xl': 'var(--radius-xl)',
        'theme-2xl': 'var(--radius-2xl)',
        'theme-full': 'var(--radius-full)',
      },
      // 添加主题阴影
      boxShadow: {
        'theme-sm': '0 1px 2px 0 var(--color-shadow-sm)',
        'theme-md': '0 4px 6px -1px var(--color-shadow-md), 0 2px 4px -2px var(--color-shadow-md)',
        'theme-lg': '0 10px 15px -3px var(--color-shadow-lg), 0 4px 6px -4px var(--color-shadow-lg)',
        'theme-xl': '0 20px 25px -5px var(--color-shadow-xl), 0 8px 10px -6px var(--color-shadow-xl)',
        'theme-card': 'var(--card-shadow)',
      },
      backgroundImage: {
        'gradient-header': 'linear-gradient(to right, var(--gradient-header-from), var(--gradient-header-to))',
        'gradient-card': 'linear-gradient(to bottom right, var(--gradient-card-from), var(--gradient-card-to))',
      },
      fontFamily: {
        sans: ['OPPO Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Nerd Font', 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        'ui': ['OPPO Sans', 'Inter', 'system-ui', 'sans-serif'],
        'mono-nerd': ['JetBrains Mono Nerd Font', 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}