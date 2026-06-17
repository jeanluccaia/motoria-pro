module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://pattamansa.com.br', 'https://www.pattamansa.com.br'];
  const corsOrigin = allowed.includes(origin) ? origin
    : (origin.endsWith('.vercel.app') ? origin : 'https://pattamansa.com.br');

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    options: [
      {
        title: 'Entrega padrão · 5-12 dias úteis',
        handle: 'standard',
        estimatedCost: { amount: '12.00', currencyCode: 'BRL' }
      }
    ]
  });
};
