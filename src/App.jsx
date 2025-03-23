import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import WebViewer from './components/WebViewer';
import AIChat from './components/AIChat';
import MarkdownEditor from './components/MarkdownEditor';
import './App.css';

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

  // AI建议的修改状态
  const [suggestedChanges, setSuggestedChanges] = useState(null);

  // 处理AI建议的修改
  const handleSuggestedChanges = (changes) => {
    setSuggestedChanges(changes);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-container">
        {/* Web Viewer 组件 */}
        <WebViewer 
          blocks={blocks} 
          handleBlockChange={handleBlockChange} 
        />

        {/* AI Chat 组件 */}
        <AIChat 
          blocks={blocks} 
          handleBlockChange={handleBlockChange} 
          onSuggestChanges={handleSuggestedChanges}
        />

        {/* Text Editor 组件 */}
        <MarkdownEditor 
          blocks={blocks} 
          handleBlockChange={handleBlockChange} 
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          suggestedChanges={suggestedChanges}
          setSuggestedChanges={setSuggestedChanges}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;