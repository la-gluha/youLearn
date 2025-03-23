/**
 * AI聊天服务模块 - 负责处理与AI API的通信
 * 基于chatTest.js的实现方式
 */

// OpenRouter API密钥
const API_KEY = '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';

// 存储对话历史
let messages = [];

/**
 * 发送消息到AI并获取回复
 * @param {string} userMessage - 用户发送的消息
 * @returns {Promise<string>} - AI的回复内容
 */
export async function sendMessage(userMessage) {
  // 添加用户消息到历史记录
  messages.push({ role: "user", content: userMessage });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "qwen/qwq-32b:free",
        "messages": messages
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    // 添加AI回复到历史记录
    messages.push(aiMessage);
    return aiMessage.content;
  } catch (error) {
    console.error('Error sending message to AI:', error);
    return 'An error occurred while processing your request.';
  }
}

/**
 * 清空对话历史
 */
export function clearConversation() {
  messages = [];
}

/**
 * 获取当前对话历史
 * @returns {Array} - 对话历史数组
 */
export function getConversationHistory() {
  return [...messages];
}

/**
 * 获取最新的AI回复
 * @returns {Object|null} - 最新的AI消息对象，如果没有则返回null
 */
export function getLatestAIMessage() {
  const aiMessages = messages.filter(msg => msg.role === 'assistant');
  return aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;
}