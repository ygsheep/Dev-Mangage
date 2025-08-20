// 主题配置文件
export interface ThemeConfig {
  name: string;
  label: string;
  colors: {
    // 主色调
    primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    // 背景色
    background: {
      primary: string;      // 主背景
      secondary: string;    // 次要背景
      tertiary: string;     // 第三背景
      paper: string;        // 卡片背景
      elevated: string;     // 悬浮背景
      code: string;         // 代码背景
    };
    // 文字颜色
    text: {
      primary: string;      // 主文本
      secondary: string;    // 次要文本
      tertiary: string;     // 第三文本
      inverse: string;      // 反色文本
      link: string;         // 链接文本
    };
    // 边框色
    border: {
      primary: string;      // 主边框
      secondary: string;    // 次要边框
      focus: string;        // 焦点边框
      error: string;        // 错误边框
      success: string;      // 成功边框
    };
    // 状态色
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    // 阴影色
    shadow: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    // 渐变色
    gradient: {
      header: string;       // 顶部渐变
      headerFrom: string;   // 渐变起始色
      headerTo: string;     // 渐变结束色
      card: string;         // 卡片渐变
      cardFrom: string;     // 卡片渐变起始色
      cardTo: string;       // 卡片渐变结束色
    };
  };
  // 圆角配置
  borderRadius: {
    sm: string;   // 4px
    md: string;   // 6px
    lg: string;   // 8px
    xl: string;   // 12px
    '2xl': string; // 16px
    full: string; // 9999px
  };
  // 其他样式
  style: {
    cardShadow: string;
    hoverTransition: string;
    focusRing: string;
  };
}

// 浅色主题
export const lightTheme: ThemeConfig = {
  name: 'light',
  label: '浅色主题',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      paper: '#ffffff',
      elevated: '#ffffff',
      code: '#f8f9fa',
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
      tertiary: '#6b7280',
      inverse: '#ffffff',
      link: '#2563eb',
    },
    border: {
      primary: '#e5e7eb',
      secondary: '#d1d5db',
      focus: '#2563eb',
      error: '#ef4444',
      success: '#10b981',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    shadow: {
      sm: 'rgba(0, 0, 0, 0.05)',
      md: 'rgba(0, 0, 0, 0.1)',
      lg: 'rgba(0, 0, 0, 0.15)',
      xl: 'rgba(0, 0, 0, 0.2)',
    },
    gradient: {
      header: 'bg-gradient-to-r from-blue-50 to-purple-50',
      headerFrom: '#eff6ff',
      headerTo: '#faf5ff',
      card: 'bg-gradient-to-br from-white to-gray-50',
      cardFrom: '#ffffff',
      cardTo: '#f9fafb',
    },
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },
  style: {
    cardShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    hoverTransition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    focusRing: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  },
};

// 暗色主题
export const darkTheme: ThemeConfig = {
  name: 'dark',
  label: '暗色主题',
  colors: {
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#ff6b35',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    background: {
      primary: '#1a1a1a',        // 最深的背景色 (Claude Desktop 真实颜色)
      secondary: '#2a2a2a',      // 次要背景色 (侧边栏)
      tertiary: '#3a3a3a',       // 第三背景色 (卡片)
      paper: '#3a3a3a',          // 卡片背景
      elevated: '#404040',       // 悬浮背景 (输入框等)
      code: '#434343',           // 代码背景
    },
    text: {
      primary: '#eeeeee',        // 主文本 (Claude Desktop 白色文字)
      secondary: '#bbbbbb',      // 次要文本 (中等灰色)
      tertiary: '#999999',       // 第三文本 (较暗灰色)
      inverse: '#1a1a1a',        // 反色文本
      link: '#ff6b35',           // 链接文本 (Claude 橙色)
    },
    border: {
      primary: '#404040',        // 主边框
      secondary: '#4a4a4a',      // 次要边框
      focus: '#ff6b35',          // 焦点边框 (Claude 橙色)
      error: '#ff4d4d',          // 错误边框
      success: '#4caf50',        // 成功边框
    },
    status: {
      success: '#4caf50',        // 成功状态
      warning: '#ff9800',        // 警告状态
      error: '#ff4d4d',          // 错误状态
      info: '#ff6b35',           // 信息状态 (Claude 橙色)
    },
    shadow: {
      sm: 'rgba(0, 0, 0, 0.2)',
      md: 'rgba(0, 0, 0, 0.3)',
      lg: 'rgba(0, 0, 0, 0.4)',
      xl: 'rgba(0, 0, 0, 0.5)',
    },
    gradient: {
      header: 'bg-gradient-to-r from-gray-800 to-gray-700',
      headerFrom: '#2a2a2a',
      headerTo: '#3a3a3a',
      card: 'bg-gradient-to-br from-gray-800 to-gray-700',
      cardFrom: '#2a2a2a',
      cardTo: '#3a3a3a',
    },
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },
  style: {
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    hoverTransition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    focusRing: '0 0 0 3px rgba(147, 197, 253, 0.2)',
  },
};

// 蓝色主题（当前）
export const blueTheme: ThemeConfig = lightTheme;

// 绿色主题
export const greenTheme: ThemeConfig = {
  ...lightTheme,
  name: 'green',
  label: '绿色主题',
  colors: {
    ...lightTheme.colors,
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    text: {
      ...lightTheme.colors.text,
      link: '#059669',
    },
    border: {
      ...lightTheme.colors.border,
      focus: '#059669',
    },
    gradient: {
      header: 'bg-gradient-to-r from-emerald-50 to-green-50',
      headerFrom: '#ecfdf5',
      headerTo: '#f0fdf4',
      card: 'bg-gradient-to-br from-white to-emerald-50',
      cardFrom: '#ffffff',
      cardTo: '#ecfdf5',
    },
  },
};

// 紫色主题
export const purpleTheme: ThemeConfig = {
  ...lightTheme,
  name: 'purple',
  label: '紫色主题',
  colors: {
    ...lightTheme.colors,
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    text: {
      ...lightTheme.colors.text,
      link: '#9333ea',
    },
    border: {
      ...lightTheme.colors.border,
      focus: '#9333ea',
    },
    gradient: {
      header: 'bg-gradient-to-r from-purple-50 to-fuchsia-50',
      headerFrom: '#faf5ff',
      headerTo: '#fdf4ff',
      card: 'bg-gradient-to-br from-white to-purple-50',
      cardFrom: '#ffffff',
      cardTo: '#faf5ff',
    },
  },
};

// 橙色主题
export const orangeTheme: ThemeConfig = {
  ...lightTheme,
  name: 'orange',
  label: '橙色主题',
  colors: {
    ...lightTheme.colors,
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    text: {
      ...lightTheme.colors.text,
      link: '#ea580c',
    },
    border: {
      ...lightTheme.colors.border,
      focus: '#ea580c',
    },
    gradient: {
      header: 'bg-gradient-to-r from-orange-50 to-amber-50',
      headerFrom: '#fff7ed',
      headerTo: '#fffbeb',
      card: 'bg-gradient-to-br from-white to-orange-50',
      cardFrom: '#ffffff',
      cardTo: '#fff7ed',
    },
  },
};

// 所有可用主题
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  blue: blueTheme,
  green: greenTheme,
  purple: purpleTheme,
  orange: orangeTheme,
};

export type ThemeName = keyof typeof themes;

// 默认主题
export const defaultTheme: ThemeName = 'light';