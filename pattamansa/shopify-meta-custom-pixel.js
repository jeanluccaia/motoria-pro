/*
  PattaMansa Meta Pixel purchase pixel.
  Install in Shopify Admin > Settings > Customer events > Custom pixel.
  Purchase is sent only from Shopify's checkout_completed event.
*/

const META_PIXEL_ID = '27064727209858805';
const DEFAULT_CURRENCY = 'BRL';

!function(f,b,e,v,n,t,s) {
  if (f.fbq) return;
  n = f.fbq = function() {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  t = b.createElement(e);
  t.async = true;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

window.fbq('init', META_PIXEL_ID);

function moneyAmount(money) {
  if (money == null) return 0;
  // Plain number or numeric string (some Shopify pixel versions skip MoneyV2 wrapper)
  if (typeof money === 'number' || typeof money === 'string') {
    var n = parseFloat(money);
    return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
  }
  // MoneyV2 object: { amount: string|number, currencyCode: string }
  var amount = parseFloat(money.amount);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0;
}

function gidToId(gid) {
  var raw = String(gid || '');
  return raw.indexOf('/') >= 0 ? raw.split('/').pop() : raw;
}

function clean(obj) {
  var out = {};
  Object.keys(obj).forEach(function(key) {
    var value = obj[key];
    if (value !== undefined && value !== null && value !== '') {
      out[key] = value;
    }
  });
  return out;
}

function metaContentFromLine(line) {
  var variant = line.variant || {};
  var product = variant.product || {};
  var quantity = Number(line.quantity || 1);
  var unitPrice = moneyAmount(variant.price);
  var finalLinePrice = moneyAmount(line.finalLinePrice);

  if (!unitPrice && finalLinePrice && quantity) {
    unitPrice = finalLinePrice / quantity;
  }

  return clean({
    id: variant.sku || gidToId(variant.id) || gidToId(product.id) || gidToId(line.id) || line.title,
    quantity: quantity,
    item_price: Number(unitPrice.toFixed(2))
  });
}

function totalQuantity(contents) {
  return contents.reduce(function(total, item) {
    return total + Number(item.quantity || 0);
  }, 0);
}

function checkoutValue(checkout) {
  var value = moneyAmount(checkout.totalPrice);
  if (value > 0) return value;

  // Fallback: sum finalLinePrice of all line items
  var items = checkout.lineItems || [];
  var total = items.reduce(function(sum, line) {
    return sum + moneyAmount(line.finalLinePrice);
  }, 0);
  return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
}

analytics.subscribe('checkout_completed', function(event) {
  var checkout = event && event.data && event.data.checkout;
  if (!checkout) return;

  var transactionId = checkout.token || event.id;
  var contents = (checkout.lineItems || []).map(metaContentFromLine);
  var contentIds = contents.map(function(item) { return item.id; }).filter(Boolean);
  var value = checkoutValue(checkout);

  if (!value) {
    console.warn('[MetaPixel] Purchase disparado sem valor — checkout.totalPrice:', checkout.totalPrice);
  }

  var payload = clean({
    content_ids: contentIds,
    contents: contents,
    content_type: 'product',
    num_items: totalQuantity(contents),
    value: value,
    currency: (checkout.totalPrice && checkout.totalPrice.currencyCode) || checkout.currencyCode || DEFAULT_CURRENCY,
    transaction_id: transactionId
  });

  window.fbq('track', 'Purchase', payload, { eventID: transactionId });
});
