import React from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Check,
  Brush,
  Eye,
  Settings as SettingsIcon
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { ThemeName, themes } from '../../../config/themes';

export const ThemeSettings: React.FC = () => {
  const { theme, themeName, setTheme, isDark, toggleDarkMode, availableThemes } = useTheme();

  // 主题预览色块
  const ThemePreview: React.FC<{ 
    name: ThemeName; 
    isSelected: boolean;
    onClick: () => void;
  }> = ({ name, isSelected, onClick }) => {
    const themeConfig = availableThemes[name];
    
    return (
      <button
        onClick={onClick}
        className={`relative group p-4 rounded-theme-lg border-2 transition-all duration-200 hover:scale-105 ${
          isSelected 
            ? 'border-primary-500 shadow-theme-md' 
            : 'border-border-primary hover:border-border-secondary'
        }`}
        style={{ backgroundColor: themeConfig.colors.background.paper }}
      >
        {/* 主题颜色预览 */}
        <div className="flex gap-2 mb-3">
          <div 
            className="w-6 h-6 rounded-full border border-gray-200"
            style={{ backgroundColor: themeConfig.colors.primary[500] }}
          />
          <div 
            className="w-6 h-6 rounded-full border border-gray-200"
            style={{ backgroundColor: themeConfig.colors.background.secondary }}
          />
          <div 
            className="w-6 h-6 rounded-full border border-gray-200"
            style={{ backgroundColor: themeConfig.colors.text.primary }}
          />
        </div>
        
        {/* 主题名称 */}
        <div className="text-sm font-medium" style={{ color: themeConfig.colors.text.primary }}>
          {themeConfig.label}
        </div>
        
        {/* 选中标识 */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        
        {/* 悬浮效果 */}
        <div className="absolute inset-0 rounded-theme-lg bg-gradient-to-r from-transparent to-transparent group-hover:from-primary-500/5 group-hover:to-primary-500/10 transition-all duration-200" />
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* 主题设置标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-theme-lg flex items-center justify-center">
          <Palette className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">主题设置</h2>
          <p className="text-sm text-text-secondary">个性化您的界面外观</p>
        </div>
      </div>

      {/* 暗色模式切换 */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-theme-md flex items-center justify-center">
              {isDark ? (
                <Moon className="w-4 h-4 text-text-secondary dark:text-gray-300" />
              ) : (
                <Sun className="w-4 h-4 text-text-secondary" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-text-primary">暗色模式</h3>
              <p className="text-sm text-text-secondary">
                {isDark ? '当前使用暗色主题' : '当前使用浅色主题'}
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              isDark ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-bg-paper transition-transform duration-200 ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 主题色选择 */}
      <div className="card">
        <div className="mb-6">
          <h3 className="font-medium text-text-primary mb-2 flex items-center gap-2">
            <Brush className="w-4 h-4" />
            主题色彩
          </h3>
          <p className="text-sm text-text-secondary">
            选择您喜欢的主题色彩风格
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(availableThemes)
            .filter(([name]) => name !== 'dark') // 排除暗色主题，因为它通过暗色模式切换
            .map(([name, themeConfig]) => (
              <ThemePreview
                key={name}
                name={name as ThemeName}
                isSelected={themeName === name && !isDark}
                onClick={() => setTheme(name as ThemeName)}
              />
            ))}
        </div>
      </div>

      {/* 当前主题信息 */}
      <div className="card">
        <div className="mb-4">
          <h3 className="font-medium text-text-primary mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            当前主题详情
          </h3>
        </div>
        
        <div className="space-y-4">
          {/* 主题名称 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">主题名称</span>
            <span className="text-sm font-medium text-text-primary">{theme.label}</span>
          </div>
          
          {/* 模式 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">显示模式</span>
            <span className="text-sm font-medium text-text-primary">
              {isDark ? '暗色模式' : '浅色模式'}
            </span>
          </div>
          
          {/* 主色调 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">主色调</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: theme.colors.primary[500] }}
              />
              <span className="text-sm font-medium text-text-primary font-mono">
                {theme.colors.primary[500]}
              </span>
            </div>
          </div>
          
          {/* 圆角风格 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">圆角风格</span>
            <span className="text-sm font-medium text-text-primary">{theme.borderRadius.lg}</span>
          </div>
        </div>
      </div>

      {/* 预设主题说明 */}
      <div className="bg-bg-tertiary border border-border-primary rounded-theme-lg p-4">
        <div className="flex items-start gap-3">
          <SettingsIcon className="w-5 h-5 text-text-tertiary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">主题说明</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              • <strong>浅色主题</strong>：适合白天使用，提供清晰明亮的界面体验
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              • <strong>暗色主题</strong>：适合夜间使用，减少眼睛疲劳
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              • <strong>彩色主题</strong>：不同的主色调提供个性化的视觉体验
            </p>
            <p className="text-xs text-text-secondary leading-relaxed mt-2">
              主题设置会自动保存到本地存储，下次打开时会恢复您的选择。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;