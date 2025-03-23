/**
 * AI服务模块 - 负责处理与AI API的通信
 */

// OpenRouter API密钥
const API_KEY = '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';

// 存储对话历史
let messagesHistory = [];

/**
 * 发送消息到AI并获取回复
 * @param {string} userMessage - 用户发送的消息
 * @returns {Promise<string>} - AI的回复内容
 */
export async function sendToAI(userMessage) {
  // 添加用户消息到历史记录
  messagesHistory.push({ role: "user", content: userMessage });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "qwen/qwq-32b:free",
        "messages": messagesHistory
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    // 添加AI回复到历史记录
    messagesHistory.push(aiMessage);
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
  messagesHistory = [];
}

/**
 * 获取当前对话历史
 * @returns {Array} - 对话历史数组
 */
export function getConversationHistory() {
  return [...messagesHistory];
}

/**
 * 分析文本并提供改进建议
 * @param {string} text - 需要分析的文本
 * @returns {Promise<Object>} - 包含改进建议的对象
 */
export async function analyzeText(text) {
  const prompt = `Please analyze the following text and suggest improvements to make it more professional and clear. Format your response as a JSON object with the following structure:
{
  "original": "[original text]",
  "suggested": {
    "prefix": "[text before the part to change]",
    "highlight": "[part to be replaced]",
    "replacement": "[suggested replacement]",
    "suffix": "[text after the part to change]",
    "fullText": "[complete improved text]"
  }
}

Here is the text to analyze: "${text}"`;

  const aiResponse = await sendToAI(prompt);
  
  try {
    // 尝试从AI响应中提取JSON
    const jsonStart = aiResponse.indexOf('{');
    const jsonEnd = aiResponse.lastIndexOf('}') + 1;
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonStr = aiResponse.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonStr);
    } else {
      // 如果无法提取JSON，返回一个基本的建议对象
      return {
        original: text,
        suggested: {
          prefix: "",
          highlight: text,
          replacement: text,
          suffix: "",
          fullText: text
        }
      };
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      original: text,
      suggested: {
        prefix: "",
        highlight: text,
        replacement: text,
        suffix: "",
        fullText: text
      }
    };
  }
}