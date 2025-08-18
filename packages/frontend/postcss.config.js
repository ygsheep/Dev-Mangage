/**
 * PostCSS 配置文件
 * 配置CSS后处理器插件，用于构建时的样式处理和优化
 * 
 * 插件说明：
 * - tailwindcss: TailwindCSS框架的PostCSS插件，用于生成原子化CSS类
 * - autoprefixer: 自动添加浏览器厂商前缀，确保CSS在不同浏览器中的兼容性
 */

export default {
  plugins: {
    /** TailwindCSS插件 - 启用原子化CSS框架 */
    tailwindcss: {},
    /** Autoprefixer插件 - 自动添加浏览器兼容性前缀 */
    autoprefixer: {},
  },
}