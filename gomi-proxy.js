// netlify/functions/gomi-proxy.js
const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'サーバーに API キーが設定されていません。' }),
    };
  }

  try {
    const { userMessage, systemPrompt } = JSON.parse(event.body);

    // デバッグ用ログ（必要に応じてコメントアウト）
    console.log('> userMessage:', userMessage);
    console.log('> systemPrompt:', systemPrompt);

    const requestPayload = {
      prompt: {
        messages: [
          { author: 'system', content: systemPrompt },
          { author: 'user',   content: userMessage }
        ]
      },
      temperature: 0.2,
      maxOutputTokens: 1024
    };

    console.log('> requestPayload:', JSON.stringify(requestPayload));

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateMessage?key=${apiKey}`;

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });
    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error('Gemini API Error:', data);
      return {
        statusCode: apiRes.status,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Proxy function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'リクエスト処理中にエラーが発生しました。' }),
    };
  }
};
