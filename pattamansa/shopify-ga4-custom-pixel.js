/*
  PattaMansa GA4 ecommerce purchase pixel.
  Install in Shopify Admin > Settings > Customer events > Custom pixel.
  This must run in Shopify because purchase happens after the hosted checkout.
*/

const GA4_MEASUREMENT_ID = 'G-WCKKTLPXYP';
const DEFAULT_CURRENCY = 'BRL';

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

(function(w,d,s,id){
  var f = d.getElementsByTagName(s)[0];
  var j = d.createElement(s);
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', GA4_MEASUREMENT_ID);

gtag('js', new Date());
gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false });

function moneyAmount(money) {
  var amount = Number(money && money.amount);
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
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  });
  return out;
}

function lineDiscount(line) {
  return (line.discountAllocations || []).reduce(function(total, allocation) {
    return total + moneyAmount(allocation && allocation.amount);
  }, 0);
}

function gaItemFromLine(line, index) {
  var variant = line.variant || {};
  var product = variant.product || {};
  var quantity = Number(line.quantity || 1);
  var unitPrice = moneyAmount(variant.price);
  var finalLinePrice = moneyAmount(line.finalLinePrice);

  if (!unitPrice && finalLinePrice && quantity) {
    unitPrice = finalLinePrice / quantity;
  }

  return clean({
    item_id: variant.sku || gidToId(variant.id) || gidToId(product.id) || gidToId(line.id) || line.title,
    item_name: product.title || line.title,
    affiliation: 'PattaMansa Shopify',
    item_brand: product.vendor || 'PattaMansa',
    item_category: product.type || 'Vestuario',
    item_variant: variant.title,
    price: Number(unitPrice.toFixed(2)),
    quantity: quantity,
    discount: lineDiscount(line) || undefined,
    index: index
  });
}

function discountCodes(checkout) {
  return (checkout.discountApplications || [])
    .filter(function(discount) { return discount && discount.type === 'DISCOUNT_CODE' && discount.title; })
    .map(function(discount) { return discount.title; });
}

analytics.subscribe('checkout_completed', function(event) {
  var checkout = event && event.data && event.data.checkout;
  if (!checkout) return;

  var orderId = checkout.order && checkout.order.id
    ? gidToId(checkout.order.id)
    : (checkout.token || event.id);
  var coupons = discountCodes(checkout);
  var payload = clean({
    transaction_id: orderId,
    value: moneyAmount(checkout.totalPrice),
    tax: moneyAmount(checkout.totalTax),
    shipping: moneyAmount(checkout.shippingLine && checkout.shippingLine.price),
    currency: checkout.currencyCode || DEFAULT_CURRENCY,
    coupon: coupons.length ? coupons.join(',') : undefined,
    items: (checkout.lineItems || []).map(gaItemFromLine)
  });

  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: payload,
    shopify_event_id: event.id,
    checkout_token: checkout.token
  });

  gtag('event', 'purchase', payload);
});
