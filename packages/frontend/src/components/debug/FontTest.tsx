/**
 * 字体测试组件
 * 用于检测和验证自定义字体的加载情况
 */

import React, { useEffect, useState } from 'react';

interface FontTestResult {
  name: string;
  loaded: boolean;
  error?: string;
}

export const FontTest: React.FC = () => {
  const [fontResults, setFontResults] = useState<FontTestResult[]>([]);

  useEffect(() => {
    const testFonts = async () => {
      const fonts = [
        'OPPO Sans',
        'JetBrains Mono Nerd Font',
        'Inter',
        'system-ui'
      ];

      const results: FontTestResult[] = [];

      for (const fontName of fonts) {
        try {
          // 使用document.fonts.check API检查字体是否加载
          const isLoaded = document.fonts.check(`12px "${fontName}"`);
          results.push({
            name: fontName,
            loaded: isLoaded
          });
        } catch (error) {
          results.push({
            name: fontName,
            loaded: false,
            error: (error as Error).message
          });
        }
      }

      setFontResults(results);
    };

    // 等待字体加载完成
    if (document.fonts.ready) {
      document.fonts.ready.then(testFonts);
    } else {
      testFonts();
    }
  }, []);

  return (
    <div className="p-6 bg-bg-paper rounded-lg border border-border-primary">
      <h2 className="text-xl font-semibold text-text-primary mb-4">字体加载测试</h2>
      
      {/* 字体加载状态 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-text-secondary mb-3">字体加载状态</h3>
        <div className="space-y-2">
          {fontResults.map((result) => (
            <div key={result.name} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
              <span className="font-medium">{result.name}</span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.loaded 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.loaded ? '已加载' : '未加载'}
                </span>
                {result.error && (
                  <span className="text-xs text-red-600" title={result.error}>
                    ⚠️
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 字体样式预览 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-text-secondary mb-3">字体样式预览</h3>
        
        <div className="space-y-3">
          <div className="p-4 bg-bg-tertiary rounded-lg">
            <p className="text-sm text-text-tertiary mb-2">OPPO Sans (主要字体)</p>
            <p style={{ fontFamily: "'OPPO Sans', sans-serif" }} className="text-lg">
              这是 OPPO Sans 字体的测试文本 - The quick brown fox jumps over the lazy dog.
            </p>
          </div>

          <div className="p-4 bg-bg-tertiary rounded-lg">
            <p className="text-sm text-text-tertiary mb-2">JetBrains Mono Nerd Font (代码字体)</p>
            <code style={{ fontFamily: "'JetBrains Mono Nerd Font', monospace" }} className="text-sm block">
              const message = "Hello, World!";<br/>
              console.log(message);<br/>
              // 这是代码字体测试
            </code>
          </div>

          <div className="p-4 bg-bg-tertiary rounded-lg">
            <p className="text-sm text-text-tertiary mb-2">Inter (后备字体)</p>
            <p style={{ fontFamily: "Inter, sans-serif" }} className="text-lg">
              这是 Inter 字体的测试文本 - The quick brown fox jumps over the lazy dog.
            </p>
          </div>

          <div className="p-4 bg-bg-tertiary rounded-lg">
            <p className="text-sm text-text-tertiary mb-2">System-UI (系统字体)</p>
            <p style={{ fontFamily: "system-ui, sans-serif" }} className="text-lg">
              这是系统字体的测试文本 - The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </div>
      </div>

      {/* 字体文件路径测试 */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">字体路径信息</h4>
        <div className="text-xs text-yellow-700 space-y-1">
          <p>OPPO Sans: /fonts/OPPOSans.ttf</p>
          <p>JetBrains Mono: /fonts/JetBrainsMono.ttf</p>
          <p>如果看到404错误，请检查字体文件是否存在于static/fonts/目录中</p>
        </div>
      </div>
    </div>
  );
};

export default FontTest;