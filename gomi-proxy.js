// /netlify/functions/gomi-proxy.js

// この関数は、ユーザーのブラウザからのリクエストを受け取り、
// サーバー側で安全に保管されたAPIキーを使って、Gemini APIにリクエストを転送します。

exports.handler = async function(event, context) {
  // POSTリクエスト以外のアクセスは拒否
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  // Netlifyの環境変数からAPIキーを安全に取得
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'APIキーがサーバーに設定されていません。' }),
    };
  }

  try {
    // ブラウザから送られてきたリクエストの本文（payload）を取得
    const payload = JSON.parse(event.body);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // Node.jsのfetchを使ってGoogleのAPIにリクエスト
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        return {
            statusCode: response.status,
            body: JSON.stringify(errorData),
        };
    }

    const data = await response.json();

    // 成功したレスポンスをブラウザに返す
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Proxy function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'リクエストの処理中にエラーが発生しました。' }),
    };
  }
};
