import React from 'react';
import { X, Minus, Square } from 'lucide-react';

interface TitleBarProps {
  title?: string;
  subtitle?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ 
  title = "DevAPI Manager", 
  subtitle = "Control+Alt+Space" 
}) => {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="title-bar">
      {/* 可拖拽区域 */}
      <div className="title-bar-draggable">
        {/* 左侧：应用标题 */}
        <div className="title-bar-left">
          <div className="title-bar-title">
            {title}
            {subtitle && (
              <>
                <span className="title-bar-separator"> — </span>
                <span className="title-bar-subtitle">{subtitle}</span>
              </>
            )}
          </div>
        </div>

        {/* 右侧：窗口控制按钮 */}
        <div className="title-bar-right">
          <button 
            className="title-bar-button minimize" 
            onClick={handleMinimize}
            title="最小化"
          >
            <Minus size={14} />
          </button>
          <button 
            className="title-bar-button maximize" 
            onClick={handleMaximize}
            title="最大化"
          >
            <Square size={12} />
          </button>
          <button 
            className="title-bar-button close" 
            onClick={handleClose}
            title="关闭"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;