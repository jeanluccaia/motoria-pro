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

  const lineItems = items.map(function (i) {
    return {
      variantId: 'gid://shopify/ProductVariant/' + i.variantId,
      quantity: Number(i.quantity)
    };
  });

  const query = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          invoiceUrl
        }
        userErrors { field message }
      }
    }
  `;

  try {
    const r = await fetch(
      'https://' + SHOPIFY_DOMAIN + '/admin/api/' + SHOPIFY_API_VERSION + '/graphql.json',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN
        },
        body: JSON.stringify({ query: query, variables: { input: { lineItems: lineItems } } })
      }
    );

    const data = await r.json();
    const draftOrder = data && data.data && data.data.draftOrderCreate && data.data.draftOrderCreate.draftOrder;
    const userErrors = data && data.data && data.data.draftOrderCreate && data.data.draftOrderCreate.userErrors;
    const graphqlErrors = data && data.errors;

    if (draftOrder && draftOrder.invoiceUrl) {
      return res.status(200).json({ checkoutUrl: draftOrder.invoiceUrl });
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
