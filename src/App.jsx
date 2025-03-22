import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Button, TextField, IconButton, Paper, Typography, Box, Switch, FormControlLabel } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import YouTube from 'react-youtube';
import './App.css';
import './MarkdownEditor.css';
import rehypeSanitize from "rehype-sanitize";
import rehypeRaw from "rehype-raw";


// 创建主题函数
const App = () => {
  // 主题模式状态
  const [themeMode, setThemeMode] = useState(() => {
    // 从localStorage获取保存的主题模式，如果没有则默认为dark
    return localStorage.getItem('youLearn_themeMode') || 'dark';
  });
  
  // 动态创建主题
  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: themeMode === 'dark' ? '#121212' : '#f5f5f5',
        paper: themeMode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
  });
  
  // 切换主题函数
  const toggleTheme = () => {
    setThemeMode(prevMode => {
      const newMode = prevMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('youLearn_themeMode', newMode);
      return newMode;
    });
  };

  // 区块的初始位置和大小
  const [blocks, setBlocks] = useState(() => {
    // 尝试从localStorage获取保存的区块布局
    const savedBlocks = localStorage.getItem('youLearn_blocks');
    if (savedBlocks) {
      try {
        return JSON.parse(savedBlocks);
      } catch (e) {
        console.error('Failed to parse saved blocks:', e);
      }
    }
    // 如果没有保存的布局或解析失败，使用默认布局
    return {
      webViewer: {
        width: window.innerWidth * 0.4,
        height: window.innerHeight * 0.45,
        x: 0,
        y: 0,
      },
      aiChat: {
        width: window.innerWidth * 0.4,
        height: window.innerHeight * 0.45,
        x: 0,
        y: window.innerHeight * 0.5,
      },
      textEditor: {
        width: window.innerWidth * 0.55,
        height: window.innerHeight * 0.95,
        x: window.innerWidth * 0.42,
        y: 0,
      },
    };
  });

  // Web Viewer 状态
  const [url, setUrl] = useState(() => localStorage.getItem('youLearn_url') || '');
  const [loadedUrl, setLoadedUrl] = useState(() => localStorage.getItem('youLearn_loadedUrl') || '');
  const [youtubeVideoId, setYoutubeVideoId] = useState(() => {
    const savedVideoId = localStorage.getItem('youLearn_youtubeVideoId');
    return savedVideoId ? savedVideoId : null;
  });
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState(() => {
    const savedTime = localStorage.getItem(`youLearn_videoTime_${youtubeVideoId}`);
    return savedTime ? parseFloat(savedTime) : 0;
  });

  // AI Chat 状态
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // Text Editor 状态
  const [text, setText] = useState(() => {
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
  const [suggestedChanges, setSuggestedChanges] = useState(null);
  const mdEditorRef = useRef(null); // 使用useRef而不是useState来存储编辑器实例
  const fileInputRef = useRef(null);
  
  // Markdown工具栏配置
  const markdownTools = [
    { name: 'h1', content: '# ', description: '一级标题', icon: '# ' },
    { name: 'h2', content: '## ', description: '二级标题', icon: '## ' },
    { name: 'h3', content: '### ', description: '三级标题', icon: '### ' },
    { name: 'bold', content: '**粗体文本**', description: '粗体', icon: 'B' },
    { name: 'italic', content: '*斜体文本*', description: '斜体', icon: 'I' },
    { name: 'link', content: '[链接文本](https://example.com)', description: '链接', icon: '🔗' },
    { name: 'image', content: '![图片描述](https://example.com/image.jpg)', description: '图片', icon: '🖼️' },
    { name: 'code', content: '```\n代码块\n```', description: '代码块', icon: '</>' },
    { name: 'quote', content: '> 引用文本', description: '引用', icon: '"' },
    { name: 'list', content: '- 列表项\n- 列表项\n- 列表项', description: '无序列表', icon: '• ' },
    { name: 'olist', content: '1. 列表项\n2. 列表项\n3. 列表项', description: '有序列表', icon: '1. ' },
    { name: 'table', content: '| 表头 | 表头 |\n| --- | --- |\n| 内容 | 内容 |', description: '表格', icon: '▦' },
    { name: 'hr', content: '---', description: '分隔线', icon: '—' },
  ];
  
  // 处理Markdown工具栏按钮点击
  const handleToolClick = (tool) => {
    // 获取当前选中的文本
    const textArea = document.getElementById('markdown-textarea');
    if (!textArea) return;
    
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);
    
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
    
    setText(newText);
    
    // 设置光标位置
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 处理区块大小或位置变化
  const handleBlockChange = (blockId, position, size) => {
    const newBlocks = { ...blocks };
    newBlocks[blockId] = {
      ...newBlocks[blockId],
      ...position,
      ...size,
    };

    // 根据当前区块的变化调整其他区块
    adjustOtherBlocks(newBlocks, blockId);
    setBlocks(newBlocks);
    
    // 保存区块布局到localStorage
    localStorage.setItem('youLearn_blocks', JSON.stringify(newBlocks));
  };
  
  // 保存编辑器内容到localStorage
  useEffect(() => {
    localStorage.setItem('youLearn_editorContent', text);
  }, [text]);
  
  // 保存Web Viewer状态到localStorage
  useEffect(() => {
    localStorage.setItem('youLearn_url', url);
  }, [url]);
  
  useEffect(() => {
    localStorage.setItem('youLearn_loadedUrl', loadedUrl);
  }, [loadedUrl]);
  
  useEffect(() => {
    if (youtubeVideoId) {
      localStorage.setItem('youLearn_youtubeVideoId', youtubeVideoId);
    } else {
      localStorage.removeItem('youLearn_youtubeVideoId');
    }
  }, [youtubeVideoId]);

  // 调整其他区块的位置和大小
  const adjustOtherBlocks = (newBlocks, changedBlockId) => {
    // 定义最小高度，确保区块不会太小而导致内容无法显示
    const minAiChatHeight = 150; // AI聊天区块的最小高度，确保输入框可见
    const minWebViewerHeight = 100; // Web查看器的最小高度
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    
    // 这里实现区块联动逻辑
    if (changedBlockId === 'webViewer') {
      // 确保Web查看器不会太小
      newBlocks.webViewer.height = Math.max(newBlocks.webViewer.height, minWebViewerHeight);
      
      // 计算剩余空间，确保AI聊天区块有足够空间
      const remainingHeight = screenHeight - newBlocks.webViewer.height - 20; // 20是两个区块之间的间距
      
      // 如果剩余空间不足以显示AI聊天区块的最小高度，则调整Web查看器的高度
      if (remainingHeight < minAiChatHeight) {
        newBlocks.webViewer.height = screenHeight - minAiChatHeight - 20;
      }
      
      // 调整AI聊天区块的位置和宽度
      newBlocks.aiChat.y = newBlocks.webViewer.y + newBlocks.webViewer.height + 10;
      newBlocks.aiChat.width = newBlocks.webViewer.width; // 确保左侧两个区块宽度相同
      newBlocks.aiChat.height = Math.max(minAiChatHeight, screenHeight - newBlocks.aiChat.y - 10);
      
      // 调整文本编辑器的位置和宽度
      newBlocks.textEditor.x = Math.max(newBlocks.webViewer.width + 10, newBlocks.textEditor.x);
      // 当左侧区块缩小时，右侧区块自动放大
      newBlocks.textEditor.width = screenWidth - newBlocks.textEditor.x - 10;
    } else if (changedBlockId === 'aiChat') {
      // 确保AI聊天区块不会太小
      newBlocks.aiChat.height = Math.max(newBlocks.aiChat.height, minAiChatHeight);
      
      // 如果AI聊天区块向上移动，可能需要调整Web查看器的高度
      if (newBlocks.aiChat.y < newBlocks.webViewer.y + newBlocks.webViewer.height) {
        // 计算Web查看器可用的最大高度
        const maxWebViewerHeight = newBlocks.aiChat.y - newBlocks.webViewer.y - 10;
        
        // 如果最大高度小于最小高度，则调整AI聊天区块的位置
        if (maxWebViewerHeight < minWebViewerHeight) {
          newBlocks.aiChat.y = newBlocks.webViewer.y + minWebViewerHeight + 10;
        } else {
          newBlocks.webViewer.height = maxWebViewerHeight;
        }
      }
      
      // 确保左侧两个区块宽度相同
      newBlocks.webViewer.width = newBlocks.aiChat.width;
      
      // 调整文本编辑器的位置和宽度
      newBlocks.textEditor.x = Math.max(newBlocks.aiChat.width + 10, newBlocks.textEditor.x);
      // 当左侧区块缩小时，右侧区块自动放大
      newBlocks.textEditor.width = screenWidth - newBlocks.textEditor.x - 10;
    } else if (changedBlockId === 'textEditor') {
      // 调整左侧两个区块的宽度
      const leftWidth = newBlocks.textEditor.x - 10;
      newBlocks.webViewer.width = leftWidth;
      newBlocks.aiChat.width = leftWidth;
      
      // 确保AI聊天区块的高度不小于最小高度
      newBlocks.aiChat.height = Math.max(newBlocks.aiChat.height, minAiChatHeight);
      
      // 确保Web查看器的高度不小于最小高度
      newBlocks.webViewer.height = Math.max(newBlocks.webViewer.height, minWebViewerHeight);
      
      // 如果两个区块的总高度超过屏幕高度，则按比例缩小
      const totalHeight = newBlocks.webViewer.height + newBlocks.aiChat.height + 10;
      if (totalHeight > screenHeight - 10) {
        const ratio = (screenHeight - 20) / totalHeight;
        newBlocks.webViewer.height = Math.max(minWebViewerHeight, Math.floor(newBlocks.webViewer.height * ratio));
        newBlocks.aiChat.height = Math.max(minAiChatHeight, screenHeight - newBlocks.webViewer.height - 20);
        newBlocks.aiChat.y = newBlocks.webViewer.y + newBlocks.webViewer.height + 10;
      }
    }
  };

  // 检查是否为YouTube链接并提取视频ID
  const extractYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 加载URL
  const handleLoadUrl = () => {
    if (url.trim()) {
      const videoId = extractYoutubeVideoId(url.trim());
      if (videoId) {
        // 如果视频ID变化，重置播放时间
        if (videoId !== youtubeVideoId) {
          setVideoCurrentTime(0);
        }
        setYoutubeVideoId(videoId);
        setLoadedUrl(''); // 清空普通URL，使用YouTube组件
      } else {
        setYoutubeVideoId(null);
        setLoadedUrl(url);
      }
    }
  };
  
  // YouTube播放器就绪时的回调
  const onYoutubePlayerReady = (event) => {
    setYoutubePlayer(event.target);
    // 只在首次加载或刷新页面时恢复播放位置
    if (videoCurrentTime > 0) {
      event.target.seekTo(videoCurrentTime);
    }
  };
  
  // 保存YouTube播放进度
  const saveVideoProgress = () => {
    if (youtubePlayer && youtubeVideoId) {
      const currentTime = youtubePlayer.getCurrentTime();
      setVideoCurrentTime(currentTime);
      localStorage.setItem(`youLearn_videoTime_${youtubeVideoId}`, currentTime.toString());
    }
  };
  
  // 在页面刷新或关闭时保存播放进度
  useEffect(() => {
    if (youtubePlayer && youtubeVideoId) {
      // 添加页面卸载事件监听器
      const handleBeforeUnload = () => {
        saveVideoProgress();
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // 组件卸载时移除事件监听器
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [youtubePlayer, youtubeVideoId]);
  
  // 组件卸载前保存播放进度
  useEffect(() => {
    return () => {
      saveVideoProgress();
    };
  }, [youtubePlayer, youtubeVideoId]);

  // 发送消息到AI助手
  const handleSendMessage = () => {
    if (input.trim()) {
      const newMessage = { text: input, sender: 'user' };
      const newMessages = [...messages, newMessage];
      setMessages(newMessages);
      setInput('');

      // 模拟AI回复
      setTimeout(() => {
        // 这里是模拟AI的回复，实际项目中应该调用AI API
        if (input.toLowerCase().includes('professional')) {
          const aiMessage = { 
            text: "I'll analyze your current text and suggest more professional phrasing. Let me review it now.", 
            sender: 'ai' 
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // 模拟AI提出的文本修改建议
          setTimeout(() => {
            const changes = {
              original: text,
              suggested: {
                prefix: "We believe that our product will ",
                highlight: "be really good for",
                replacement: "significantly benefit",
                suffix: " your company. It ",
                // 更多修改...
                fullText: "We believe that our product will significantly benefit your company. It has lots of cool features that will help you do things better and faster. Our team worked really hard on this solution and we think you'll like it. Please consider buying it soon."
              }
            };
            setSuggestedChanges(changes);
          }, 1000);
        } else {
          const aiMessage = { 
            text: "Hello! I can help you modify your text. Just let me know what you'd like to change.", 
            sender: 'ai' 
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      }, 500);
    }
  };

  // 应用AI建议的修改
  const applyChanges = () => {
    if (suggestedChanges && suggestedChanges.suggested.fullText) {
      setText(suggestedChanges.suggested.fullText);
      setSuggestedChanges(null);
    }
  };

  // 取消修改
  const cancelChanges = () => {
    setSuggestedChanges(null);
  };
  
  // 处理文件导入功能
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setText(e.target.result);
      };
      reader.readAsText(file);
    }
    // 重置文件输入，允许再次选择相同文件
    event.target.value = null;
  };

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      // 获取当前窗口尺寸
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // 调整区块大小和位置以适应新的窗口尺寸
      const newBlocks = { ...blocks };
      
      // 确保区块不会超出窗口边界
      // 调整Web Viewer
      if (newBlocks.webViewer.x + newBlocks.webViewer.width > screenWidth) {
        newBlocks.webViewer.width = Math.max(300, screenWidth - newBlocks.webViewer.x - 10);
      }
      if (newBlocks.webViewer.y + newBlocks.webViewer.height > screenHeight) {
        newBlocks.webViewer.height = Math.max(100, screenHeight - newBlocks.webViewer.y - 10);
      }
      
      // 调整AI Chat
      if (newBlocks.aiChat.x + newBlocks.aiChat.width > screenWidth) {
        newBlocks.aiChat.width = Math.max(300, screenWidth - newBlocks.aiChat.x - 10);
      }
      if (newBlocks.aiChat.y + newBlocks.aiChat.height > screenHeight) {
        newBlocks.aiChat.height = Math.max(150, screenHeight - newBlocks.aiChat.y - 10);
      }
      
      // 调整Text Editor
      if (newBlocks.textEditor.x + newBlocks.textEditor.width > screenWidth) {
        newBlocks.textEditor.width = Math.max(400, screenWidth - newBlocks.textEditor.x - 10);
      }
      if (newBlocks.textEditor.y + newBlocks.textEditor.height > screenHeight) {
        newBlocks.textEditor.height = Math.max(300, screenHeight - newBlocks.textEditor.y - 10);
      }
      
      // 更新区块状态
      setBlocks(newBlocks);
      localStorage.setItem('youLearn_blocks', JSON.stringify(newBlocks));
    };
    
    // 添加窗口大小变化事件监听器
    window.addEventListener('resize', handleResize);
    
    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [blocks]); // 依赖于blocks状态

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-container">

        {/* Web Viewer 区块 */}
        <Rnd
          className="block web-viewer"
          size={{ width: blocks.webViewer.width, height: blocks.webViewer.height }}
          position={{ x: blocks.webViewer.x, y: blocks.webViewer.y }}
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
            handleBlockChange('webViewer', position, {
              width: ref.offsetWidth,
              height: ref.offsetHeight,
            });
          }}
        >
          <Paper elevation={3} className="block-content">
            <Typography variant="h6" className="block-title">Web Viewer</Typography>
            <div className="url-input-container">
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLoadUrl()}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleLoadUrl}
                className="load-button"
              >
                Load
              </Button>
            </div>
            <div className="iframe-container">
              {youtubeVideoId ? (
                <YouTube 
                  videoId={youtubeVideoId} 
                  className="web-iframe"
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      autoplay: 0,
                      // 只在首次加载时设置开始时间，而不是在每次重新渲染时
                      // 移除start参数，改为在onReady回调中使用seekTo方法
                    },
                  }}
                  onReady={onYoutubePlayerReady}
                  onPause={saveVideoProgress}
                  onEnd={saveVideoProgress}
                />
              ) : loadedUrl !== '' && (
                <iframe
                  src={loadedUrl}
                  title="Web Viewer"
                  className="web-iframe"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) } (
                <div className="empty-iframe">
                  <div className="iframe-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <path fill="currentColor" d="M11 7h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    <p>Enter a URL above to load content</p>
                  </div>
                </div>
              )
            </div>
          </Paper>
        </Rnd>

        {/* AI Chat 区块 */}
        <Rnd
          className="block ai-chat"
          size={{ width: blocks.aiChat.width, height: blocks.aiChat.height }}
          position={{ x: blocks.aiChat.x, y: blocks.aiChat.y }}
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
            handleBlockChange('aiChat', position, {
              width: ref.offsetWidth,
              height: ref.offsetHeight,
            });
          }}
        >
          <Paper elevation={3} className="block-content">
            <Typography variant="h6" className="block-title">AI Assistant</Typography>
            <div className="chat-container">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-chat">
                    <Typography variant="body2" color="textSecondary">
                      Hello! I can help you modify your text. Just let me know what you'd like to change.
                    </Typography>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                      <Paper elevation={1} className="message-bubble">
                        <Typography variant="body2">{msg.text}</Typography>
                      </Paper>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="input-container">
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <IconButton color="primary" onClick={handleSendMessage}>
                  <SendIcon />
                </IconButton>
              </div>
            </div>
          </Paper>
        </Rnd>

        {/* Text Editor 区块 */}
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
            <Typography variant="h6" className="block-title">Text Editor</Typography>
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
                  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
                  saveAs(blob, 'document.md');
                }}
              >
                Export
              </Button>
              <IconButton
                color="primary"
                onClick={toggleTheme}
                title={themeMode === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
              >
                {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </div>
            <div className="editor-container" data-color-mode={themeMode}>
              {/* Markdown工具栏 */}
              <div className="markdown-toolbar">
                {markdownTools.map((tool) => (
                  <Button
                    key={tool.name}
                    variant="outlined"
                    size="small"
                    title={tool.description}
                    onClick={() => handleToolClick(tool)}
                  >
                    {tool.icon}
                  </Button>
                ))}
              </div>
              
              {/* Markdown编辑器和预览区 */}
              <div className="markdown-editor-container">
                {/* 编辑区 */}
                <div className="markdown-editor-pane">
                  <textarea
                    id="markdown-textarea"
                    className="markdown-textarea"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck="false"
                  />
                </div>
                
                {/* 预览区 */}
                <div className="markdown-preview-pane">
                  <ReactMarkdown
                    rehypePlugins={[
                      rehypeRaw,
                      [rehypeSanitize, {
                        // 允许iframe标签和相关属性
                        tagNames: ['iframe', 'ul', 'ol', 'li'],
                        attributes: {
                          iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen']
                        }
                      }]
                    ]}
                  >
                    {text}
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
      </div>
    </ThemeProvider>
  );
};

export default App;