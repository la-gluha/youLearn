import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Button, IconButton, Paper, Typography, Tooltip, Divider } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import rehypeSanitize from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import MarkdownGuide from './MarkdownGuide';
import ContextMenu, { AIChatInput } from './ContextMenu';
import { sendMessage } from '../services/aiChatService';
import '../MarkdownEditor.css';
import '../ContextMenu.css';

const MarkdownEditor = ({ blocks, handleBlockChange, themeMode, toggleTheme, suggestedChanges, setSuggestedChanges }) => {
  // 上下文菜单状态
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });
  // AI聊天输入框状态
  const [aiChatInput, setAiChatInput] = useState({ show: false, x: 0, y: 0, selectedText: '', fullText: '' });
  
  // 编辑器内容状态
  const [markdown, setMarkdown] = useState(() => {
    // 从localStorage获取保存的编辑器内容，如果没有则使用默认内容
    return localStorage.getItem('youLearn_editorContent') || 
    `# Welcome to YouLearn

We believe that our product will significantly benefit your company. It offers numerous advanced features that will enhance your operational efficiency. Our team has meticulously developed this solution and we are confident it will meet your requirements. Please contact us to schedule a demonstration at your earliest convenience.

## Features

- Markdown support
- Import and export functionality
- Drag and resize panels
- AI assistance`;
  });
  
  // 文件导入引用
  const fileInputRef = useRef(null);
  
  // 编辑器引用，用于操作光标位置
  const editorRef = useRef(null);
  
  // Markdown工具栏配置
  const markdownTools = [
    { name: 'h1', content: '# ', description: '一级标题', icon: 'H1' },
    { name: 'h2', content: '## ', description: '二级标题', icon: 'H2' },
    { name: 'h3', content: '### ', description: '三级标题', icon: 'H3' },
    { name: 'bold', content: '**粗体文本**', description: '粗体', icon: 'B' },
    { name: 'italic', content: '*斜体文本*', description: '斜体', icon: 'I' },
    { name: 'link', content: '[链接文本](https://example.com)', description: '链接', icon: '🔗' },
    { name: 'image', content: '![图片描述](https://example.com/image.jpg)', description: '图片', icon: '🖼️' },
    { name: 'code', content: '```\n代码块\n```', description: '代码块', icon: '</>' },
    { name: 'quote', content: '> 引用文本', description: '引用', icon: '"' },
    { name: 'list', content: '- 列表项\n- 列表项\n- 列表项', description: '无序列表', icon: '•' },
    { name: 'olist', content: '1. 列表项\n2. 列表项\n3. 列表项', description: '有序列表', icon: '1.' },
    { name: 'table', content: '| 表头 | 表头 |\n| --- | --- |\n| 内容 | 内容 |', description: '表格', icon: '▦' },
    { name: 'hr', content: '---', description: '分隔线', icon: '—' },
  ];
  
  // 处理Markdown工具栏按钮点击
  const handleToolClick = (tool) => {
    if (!editorRef.current) return;
    
    const textArea = editorRef.current;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const beforeText = markdown.substring(0, start);
    const afterText = markdown.substring(end);
    
    let newText = '';
    let newCursorPos = start;
    
    // 根据工具类型处理不同的插入逻辑
    switch (tool.name) {
      case 'bold':
        newText = beforeText + '**' + (selectedText || '粗体文本') + '**' + afterText;
        newCursorPos = start + 2 + (selectedText ? selectedText.length : 8);
        break;
      case 'italic':
        newText = beforeText + '*' + (selectedText || '斜体文本') + '*' + afterText;
        newCursorPos = start + 1 + (selectedText ? selectedText.length : 8);
        break;
      case 'h1':
      case 'h2':
      case 'h3':
        // 检查前面是否已经有换行
        const prefix = beforeText.endsWith('\n') || start === 0 ? '' : '\n';
        newText = beforeText + prefix + tool.content + (selectedText || '标题') + afterText;
        newCursorPos = start + prefix.length + tool.content.length + (selectedText ? selectedText.length : 2);
        break;
      case 'link':
        newText = beforeText + '[' + (selectedText || '链接文本') + '](https://example.com)' + afterText;
        newCursorPos = start + 1 + (selectedText ? selectedText.length : 8);
        break;
      case 'image':
        newText = beforeText + '![' + (selectedText || '图片描述') + '](https://example.com/image.jpg)' + afterText;
        newCursorPos = start + 2 + (selectedText ? selectedText.length : 8);
        break;
      case 'code':
        newText = beforeText + '```\n' + (selectedText || '代码块') + '\n```' + afterText;
        newCursorPos = start + 4 + (selectedText ? selectedText.length : 6);
        break;
      case 'quote':
        newText = beforeText + '> ' + (selectedText || '引用文本') + afterText;
        newCursorPos = start + 2 + (selectedText ? selectedText.length : 8);
        break;
      case 'list':
      case 'olist':
      case 'table':
      case 'hr':
        // 对于这些元素，直接插入模板
        const needsNewLine = beforeText.length > 0 && !beforeText.endsWith('\n');
        newText = beforeText + (needsNewLine ? '\n' : '') + tool.content + afterText;
        newCursorPos = start + (needsNewLine ? 1 : 0) + tool.content.length;
        break;
      default:
        newText = beforeText + tool.content + afterText;
        newCursorPos = start + tool.content.length;
    }
    
    setMarkdown(newText);
    
    // 设置光标位置
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 处理文件导入功能
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdown(e.target.result);
      };
      reader.readAsText(file);
    }
    // 重置文件输入，允许再次选择相同文件
    event.target.value = null;
  };

  // 应用AI建议的修改
  const applyChanges = () => {
    if (suggestedChanges && suggestedChanges.suggested.fullText) {
      setMarkdown(suggestedChanges.suggested.fullText);
      setSuggestedChanges(null);
    }
  };

  // 取消修改
  const cancelChanges = () => {
    setSuggestedChanges(null);
  };
  
  // 处理右键点击事件
  const handleContextMenu = (event) => {
    event.preventDefault();
    
    // 获取选中的文本
    const selectedText = window.getSelection().toString().trim();
    
    // 只有在有选中文本的情况下才显示上下文菜单
    if (selectedText) {
      setContextMenu({
        show: true,
        x: event.clientX,
        y: event.clientY
      });
    }
  };
  
  // 处理关闭上下文菜单
  const handleCloseContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0 });
  };
  
  // 处理点击AI Chat选项
  const handleAIChatClick = () => {
    // 关闭上下文菜单
    handleCloseContextMenu();
    
    // 获取选中的文本
    const selectedText = window.getSelection().toString().trim();
    
    // 显示AI聊天输入框
    if (selectedText) {
      setAiChatInput({
        show: true,
        x: contextMenu.x,
        y: contextMenu.y,
        selectedText,
        fullText: markdown
      });
    }
  };
  
  // 处理关闭AI聊天输入框
  const handleCloseAIChatInput = () => {
    setAiChatInput({ show: false, x: 0, y: 0, selectedText: '', fullText: '' });
  };
  
  // 处理发送消息到AI
  const handleSendMessageToAI = async (message, selectedText, fullText) => {
    // 构建发送给AI的消息
    const aiMessage = `我正在编写一篇文档，文档内容是：\n\n${fullText}\n\n我选择了以下文本：\n\n${selectedText}\n\n我的问题是：${message}`;
    
    // 调用AI服务发送消息
    try {
      const response = await sendMessage(aiMessage);
      return response;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      return '发生错误，请稍后再试。';
    }
  };
  
  // 保存编辑器内容到localStorage
  useEffect(() => {
    localStorage.setItem('youLearn_editorContent', markdown);
  }, [markdown]);

  return (
    <Rnd
      className="block text-editor"
      size={{ width: blocks.textEditor.width, height: blocks.textEditor.height }}
      position={{ x: blocks.textEditor.x, y: blocks.textEditor.y }}
      disableDragging={false}
      dragHandleClassName="block-title"
      enableResizing={{
        bottom: false,
        bottomLeft: false,
        bottomRight: true,
        left: false,
        right: false,
        top: false,
        topLeft: false,
        topRight: false
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        handleBlockChange('textEditor', position, {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
      }}
    >
      <Paper elevation={3} className="block-content">
        <Typography variant="h6" className="block-title">Markdown Editor</Typography>
        
        {/* 编辑器工具栏 */}
        <div className="editor-actions">
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current.click()}
          >
            Import
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".md,.txt"
            onChange={handleFileImport}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
              saveAs(blob, 'document.md');
            }}
          >
            Export
          </Button>
          <Tooltip title={themeMode === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}>
            <IconButton
              color="primary"
              onClick={toggleTheme}
            >
              {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </div>
        
        {/* Markdown编辑器容器 */}
        <div className="editor-container" data-color-mode={themeMode}>
          {/* Markdown工具栏 */}
          <div className="markdown-toolbar">
            {markdownTools.map((tool) => (
              <Tooltip key={tool.name} title={tool.description}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleToolClick(tool)}
                >
                  {tool.icon}
                </Button>
              </Tooltip>
            ))}
          </div>
          
          {/* Markdown编辑器和预览区 */}
          <div className="markdown-editor-container">
            {/* 编辑区 */}
            <div className="markdown-editor-pane">
              <MarkdownGuide />
              <textarea
                id="markdown-textarea"
                ref={editorRef}
                className="markdown-textarea"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onContextMenu={handleContextMenu}
                spellCheck="false"
              />
              
              {/* 上下文菜单 */}
              <ContextMenu
                show={contextMenu.show}
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={handleCloseContextMenu}
                onAIChatClick={handleAIChatClick}
              />
              
              {/* AI聊天输入框 */}
              <AIChatInput
                show={aiChatInput.show}
                x={aiChatInput.x}
                y={aiChatInput.y}
                selectedText={aiChatInput.selectedText}
                fullText={aiChatInput.fullText}
                onClose={handleCloseAIChatInput}
                onSendMessage={handleSendMessageToAI}
              />
            </div>
            
            {/* 预览区 */}
            <div className="markdown-preview-pane">
              <ReactMarkdown
                remarkPlugins={[remarkBreaks]}
                rehypePlugins={[
                  rehypeRaw,
                  [rehypeSanitize, {
                    // 允许iframe标签和相关属性以及表格、分割线和标题相关标签
                    tagNames: [
                      'iframe', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 
                      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'blockquote', 
                      'code', 'pre', 'a', 'img', 'span'
                    ],
                    attributes: {
                      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
                      a: ['href', 'target', 'rel'],
                      img: ['src', 'alt', 'title']
                    }
                  }]
                ]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* 显示AI建议的修改 */}
        {suggestedChanges && (
          <div className="suggested-changes">
            <Typography variant="subtitle1" className="changes-title">
              Suggested Changes
            </Typography>
            <div className="changes-preview">
              <pre className="changes-text">
                {suggestedChanges.suggested.fullText}
              </pre>
            </div>
            <div className="changes-actions">
              <Button
                variant="outlined"
                color="secondary"
                onClick={cancelChanges}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={applyChanges}
              >
                Apply Changes
              </Button>
            </div>
          </div>
        )}
      </Paper>
    </Rnd>
  );
};

export default MarkdownEditor;