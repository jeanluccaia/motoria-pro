module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { system, messages } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        content: [{ type: "text", text: "Erro da API: " + JSON.stringify(data) }]
      });
    }

    return res.status(200).json({
      content: data.content || []
    });
  } catch (error) {
    return res.status(500).json({
      content: [{ type: "text", text: "Erro interno: " + error.message }]
    });
  }
};