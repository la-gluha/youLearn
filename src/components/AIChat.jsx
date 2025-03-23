import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { TextField, IconButton, Paper, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { sendMessage, clearConversation } from '../services/aiChatService';
import { analyzeText } from '../services/aiService';

const AIChat = ({ blocks, handleBlockChange, onSuggestChanges }) => {
  // AI Chat 状态
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // 发送消息到AI助手
  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = input.trim();
      const newMessage = { text: userMessage, sender: 'user' };
      const newMessages = [...messages, newMessage];
      setMessages(newMessages);
      setInput('');

      // 显示正在输入的提示
      const loadingMessage = { 
        text: "Thinking...", 
        sender: 'ai' 
      };
      setMessages(prev => [...prev, loadingMessage]);

      try {
        // 调用AI API获取回复
        if (userMessage.toLowerCase().includes('professional') || 
            userMessage.toLowerCase().includes('improve') || 
            userMessage.toLowerCase().includes('analyze')) {
          // 分析文本并提供改进建议
          const aiResponse = await sendMessage("I'll analyze your current text and suggest more professional phrasing. Let me review it now.");
          
          // 更新AI消息
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { 
              text: aiResponse, 
              sender: 'ai' 
            };
            return newMessages;
          });
          
          // 获取文本分析结果
          const sampleText = "Our product is really good for your company. It has lots of cool features that will help you do things better and faster. Our team worked really hard on this solution and we think you'll like it. Please consider buying it soon.";
          const changes = await analyzeText(sampleText);
          
          // 通过props将修改建议传递给App组件，再由App组件传递给MarkdownEditor组件
          onSuggestChanges && onSuggestChanges(changes);
        } else {
          // 普通对话
          const aiResponse = await sendMessage(userMessage);
          
          // 更新AI消息
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { 
              text: aiResponse, 
              sender: 'ai' 
            };
            return newMessages;
          });
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        
        // 显示错误消息
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            text: "Sorry, I encountered an error while processing your request. Please try again later.", 
            sender: 'ai' 
          };
          return newMessages;
        });
      }
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
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
  );
};

export default AIChat;