const SHOPIFY_DOMAIN = 'unmtvj-cr.myshopify.com';
const SHOPIFY_API_VERSION = '2024-10';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://pattamansa.com.br');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const items = body && body.items;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'items required' });
  }

  const lines = items.map(function (i) {
    return {
      merchandiseId: 'gid://shopify/ProductVariant/' + i.variantId,
      quantity: Number(i.quantity)
    };
  });

  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { field message }
      }
    }
  `;

  try {
    const r = await fetch(
      'https://' + SHOPIFY_DOMAIN + '/api/' + SHOPIFY_API_VERSION + '/graphql.json',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_TOKEN
        },
        body: JSON.stringify({ query: query, variables: { input: { lines: lines } } })
      }
    );

    const data = await r.json();
    const cart = data && data.data && data.data.cartCreate && data.data.cartCreate.cart;
    const userErrors = data && data.data && data.data.cartCreate && data.data.cartCreate.userErrors;
    const graphqlErrors = data && data.errors;

    if (cart && cart.checkoutUrl) {
      return res.status(200).json({ checkoutUrl: cart.checkoutUrl });
    }

    return res.status(500).json({
      error: 'Checkout creation failed',
      userErrors: userErrors || [],
      graphqlErrors: graphqlErrors || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
