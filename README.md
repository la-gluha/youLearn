# YouLearn - 智能学习助手

## 项目介绍

YouLearn是一个集成了Web内容查看、AI辅助和Markdown编辑功能的智能学习工具。它允许用户在一个界面中同时浏览网页内容、编辑笔记并获取AI辅助，提高学习和工作效率。

## 主要功能

### 可拖拽自定义布局
- 三个主要区块（Web查看器、AI助手、文本编辑器）可自由拖拽和调整大小
- 布局状态自动保存，下次打开时恢复

### Web查看器
- 支持加载任意网页内容
- 内置YouTube视频播放器，自动记忆播放进度
- 安全的iframe沙箱环境

### Markdown编辑器
- 完整的Markdown语法支持
- 实时预览功能
- 丰富的Markdown工具栏，快速插入常用元素
- 支持导入/导出Markdown文件

### AI助手
- 智能文本分析和建议
- 提供专业化文本修改建议
- 简单的聊天界面

### 其他特性
- 深色/浅色主题切换
- 本地存储，保存用户数据和偏好设置
- 响应式设计，适应不同屏幕尺寸

## 技术栈

- **前端框架**: React 18
- **UI组件库**: Material-UI (MUI)
- **构建工具**: Vite
- **拖拽功能**: react-rnd
- **Markdown处理**: react-markdown, rehype-raw, rehype-sanitize
- **视频播放**: react-youtube
- **文件处理**: file-saver

## 安装指南

### 前提条件
- Node.js (推荐v16或更高版本)
- npm或yarn包管理器

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/youLearn.git
cd youLearn
```

2. 安装依赖
```bash
npm install
# 或使用yarn
yarn
```

3. 启动开发服务器
```bash
npm run dev
# 或使用yarn
yarn dev
```

4. 构建生产版本
```bash
npm run build
# 或使用yarn
yarn build
```

## 使用指南

### Web查看器
1. 在顶部输入框中输入网址
2. 点击"Load"按钮或按Enter键加载内容
3. 对于YouTube链接，将自动识别并使用内置播放器

### Markdown编辑器
1. 使用工具栏按钮快速插入Markdown元素
2. 在左侧编辑区输入Markdown文本
3. 在右侧实时查看渲染效果
4. 使用"Import"按钮导入本地Markdown文件
5. 使用"Export"按钮将当前内容导出为Markdown文件

### AI助手
1. 在输入框中输入问题或请求
2. 点击发送按钮或按Enter键提交
3. 查看AI回复内容
4. 使用"Analyze Text"按钮分析当前编辑器中的文本并获取改进建议

## 项目结构

```
├── src/                  # 源代码目录
│   ├── App.jsx           # 主应用组件
│   ├── App.css           # 主应用样式
│   ├── MarkdownEditor.css # Markdown编辑器样式
│   ├── index.css         # 全局样式
│   └── main.jsx          # 应用入口点
├── public/               # 静态资源目录
├── index.html            # HTML模板
├── package.json          # 项目依赖和脚本
├── vite.config.js        # Vite配置文件
└── README.md             # 项目文档
```

## 贡献指南

我们欢迎所有形式的贡献，无论是新功能、bug修复还是文档改进。

### 贡献步骤

1. Fork本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

### 开发规范

- 遵循React最佳实践
- 保持代码简洁清晰
- 添加必要的注释
- 确保新功能有适当的测试

## 常见问题解答

### Q: 如何更改默认主题？
A: 您可以通过点击界面右上角的主题切换按钮在深色和浅色主题之间切换。

### Q: 我的布局设置会保存吗？
A: 是的，所有布局设置都会保存在浏览器的本地存储中，下次打开应用时会自动恢复。

### Q: 如何重置布局？
A: 目前需要清除浏览器的本地存储来重置布局。在未来的版本中，我们计划添加一个重置按钮。

## 未来计划

- [ ] 添加更多Markdown扩展功能
- [ ] 改进AI助手的响应质量
- [ ] 添加多语言支持
- [ ] 实现云端同步功能
- [ ] 添加更多自定义主题选项

## 许可证

本项目采用MIT许可证 - 详情请参阅 [LICENSE](LICENSE) 文件