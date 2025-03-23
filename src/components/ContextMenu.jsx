import React, { useEffect, useRef } from 'react';
import { Paper, Typography, TextField, Button, CircularProgress } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import '../ContextMenu.css';

/**
 * 上下文菜单组件 - 用于在Markdown编辑器中显示右键菜单
 * @param {Object} props - 组件属性
 * @param {boolean} props.show - 是否显示菜单
 * @param {number} props.x - 菜单x坐标
 * @param {number} props.y - 菜单y坐标
 * @param {function} props.onClose - 关闭菜单的回调函数
 * @param {function} props.onAIChatClick - 点击AI Chat选项的回调函数
 */
const ContextMenu = ({ show, x, y, onClose, onAIChatClick }) => {
  // 菜单引用，用于检测点击外部区域
  const menuRef = useRef(null);

  // 处理点击外部区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  // 如果不显示，则不渲染
  if (!show) return null;

  return (
    <div 
      className="context-menu" 
      ref={menuRef}
      style={{ top: y, left: x }} // 确保菜单在鼠标光标位置显示
    >
      <div 
        className="context-menu-item"
        onClick={onAIChatClick}
      >
        <ChatIcon fontSize="small" />
        <span>AI Chat</span>
      </div>
    </div>
  );
};

/**
 * AI聊天输入框组件 - 用于在选择文本后显示AI聊天输入框
 * @param {Object} props - 组件属性
 * @param {boolean} props.show - 是否显示输入框
 * @param {number} props.x - 输入框x坐标
 * @param {number} props.y - 输入框y坐标
 * @param {string} props.selectedText - 选中的文本
 * @param {string} props.fullText - 完整的文档文本
 * @param {function} props.onClose - 关闭输入框的回调函数
 * @param {function} props.onSendMessage - 发送消息的回调函数
 */
export const AIChatInput = ({ 
  show, 
  x, 
  y, 
  selectedText, 
  fullText, 
  onClose, 
  onSendMessage 
}) => {
  // 输入框引用，用于检测点击外部区域
  const inputRef = useRef(null);
  // 输入内容状态
  const [input, setInput] = React.useState('');
  // 加载状态
  const [loading, setLoading] = React.useState(false);
  // AI回复内容
  const [aiResponse, setAiResponse] = React.useState('');

  // 处理点击外部区域关闭输入框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (input.trim()) {
      setLoading(true);
      try {
        // 调用回调函数发送消息，并获取AI回复
        const response = await onSendMessage(input, selectedText, fullText);
        setAiResponse(response);
      } catch (error) {
        console.error('Error sending message to AI:', error);
        setAiResponse('发生错误，请稍后再试。');
      } finally {
        setLoading(false);
      }
    }
  };

  // 如果不显示，则不渲染
  if (!show) return null;

  return (
    <Paper 
      className="ai-chat-input-container ai-chat-input-highlight" 
      ref={inputRef}
      style={{ top: y, left: x }} // 确保输入框在鼠标光标位置显示
      elevation={3}
    >
      <Typography variant="subtitle1" gutterBottom>
        基于选中文本与AI对话
      </Typography>
      <Typography variant="caption" color="textSecondary" gutterBottom>
        已选择: {selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="输入您的问题..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        margin="normal"
        disabled={loading}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSendMessage}
        disabled={loading}
        fullWidth
        style={{ marginTop: '8px' }}
      >
        {loading ? <CircularProgress size={24} /> : '发送'}
      </Button>

      {aiResponse && (
        <div className="ai-chat-result">
          {aiResponse}
        </div>
      )}
    </Paper>
  );
};

export default ContextMenu;