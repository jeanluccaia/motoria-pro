
  /* ── URGÊNCIA COPA — próximo jogo do Brasil ────────────────────
   * Atualizar DATA_PROXIMO_JOGO a cada rodada (formato "dd/mm").
   * Deixar vazio ('') para não exibir data específica.
   * ─────────────────────────────────────────────────────────────── */
  var DATA_PROXIMO_JOGO = ''; /* deixar vazio para não exibir data específica */
  (function () {
    var el = document.getElementById('js-hero-jogo-date');
    if (el && DATA_PROXIMO_JOGO && DATA_PROXIMO_JOGO !== '[DATA_PROXIMO_JOGO]') {
      el.textContent = ' (' + DATA_PROXIMO_JOGO + ')';
    }
  })();

  /* ── TEMA COPA 2026 ─────────────────────────────────────────────
   * Para remover o tema Copa após 19/07/2026:
   *   1. Mude  copa: true  →  copa: false
   *   2. Ajuste os textos _off abaixo se quiser mensagem diferente
   *   3. Republique — não precisa reescrever a página.
   * ─────────────────────────────────────────────────────────────── */
  var SITE_THEME = {
    copa: true,
    eyebrow:        'Copa 2026 · Edição Especial',
    tagline:        'Edição Copa 2026.',
    taglineSub:     'Edição limitada — disponível só durante a Copa.',
    eyebrow_off:    'Coleção Especial',
    tagline_off:    '',
    taglineSub_off: 'Disponível enquanto durar o estoque.',
  };
  (function () {
    var t = SITE_THEME;
    if (t.copa) return;
    var eyebrow = document.getElementById('js-theme-eyebrow');
    var taglinePara = document.getElementById('js-theme-tagline');
    if (eyebrow) eyebrow.textContent = t.eyebrow_off;
    if (taglinePara) {
      var body = (t.tagline_off ? t.tagline_off + '<br>' : '') + (t.taglineSub_off || '');
      taglinePara.innerHTML = body;
      if (!body) taglinePara.style.display = 'none';
    }
  })();


  /* Parcelamento discreto alinhado ao checkout */
  (function () {
    document.querySelectorAll('[data-product-card]').forEach(function (card) {
      var price = card.querySelector('.vcard-price');
      if (!price) return;

      var stack = price.closest('.vcard-price-stack');
      if (!stack) {
        stack = document.createElement('span');
        stack.className = 'vcard-price-stack';
        price.parentNode.insertBefore(stack, price);
        stack.appendChild(price);
      }

      var installments = stack.querySelector('.vcard-installments');
      if (!installments) {
        installments = document.createElement('span');
        installments.className = 'vcard-installments';
        stack.appendChild(installments);
      }
    });
  })();

  /* ─── GA4 ECOMMERCE — dataLayer + gtag ─── */
  var PattaAnalytics = (function () {
    var MEASUREMENT_ID = 'G-WCKKTLPXYP';
    var CURRENCY = 'BRL';

    function toNumber(value) {
      var number = Number(value);
      return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
    }

    function clean(obj) {
      var out = {};
      Object.keys(obj).forEach(function (key) {
        var value = obj[key];
        if (value !== undefined && value !== null && value !== '') out[key] = value;
      });
      return out;
    }

    function itemVariant(color, size) {
      return [color, size].filter(Boolean).join(' / ');
    }

    function productToGaItem(cfg, index) {
      return clean({
        item_id: String(cfg.productId || cfg.variantId || cfg.name || ''),
        item_name: cfg.name || cfg.productName || '',
        affiliation: 'PattaMansa',
        item_brand: 'PattaMansa',
        item_category: 'Vestuario',
        price: toNumber(cfg.price),
        quantity: Number(cfg.quantity || 1),
        index: index || 0
      });
    }

    function cartToGaItem(item, index) {
      return clean({
        item_id: String(item.variantId || item.productId || item.productName || ''),
        item_name: item.productName || item.name || '',
        affiliation: 'PattaMansa',
        item_brand: 'PattaMansa',
        item_category: 'Vestuario',
        item_variant: itemVariant(item.color, item.size),
        price: toNumber(item.price),
        quantity: Number(item.quantity || 1),
        index: index || 0
      });
    }

    function push(eventName, ecommerce) {
      var payload = Object.assign({ currency: CURRENCY }, ecommerce || {});
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: eventName,
        ecommerce: payload
      });
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload);
      }
    }

    function trackViewItem(cfg) {
      if (!cfg) return;
      push('view_item', {
        value: toNumber(cfg.price),
        items: [productToGaItem(cfg, 0)]
      });
    }

    function trackAddToCart(item) {
      if (!item) return;
      push('add_to_cart', {
        value: toNumber((item.price || 0) * (item.quantity || 1)),
        items: [cartToGaItem(item, 0)]
      });
    }

    function trackBeginCheckout(items, total) {
      if (!items || !items.length) return;
      push('begin_checkout', {
        value: toNumber(total),
        items: items.map(cartToGaItem)
      });
    }

    function appendQuery(url, query) {
      if (!query) return url;
      return url + (url.indexOf('?') === -1 ? '?' : '&') + query;
    }

    function decorateCheckoutUrl(url, callback) {
      var finished = false;
      function done(nextUrl) {
        if (finished) return;
        finished = true;
        callback(nextUrl || url);
      }

      if (typeof window.gtag !== 'function') {
        done(url);
        return;
      }

      try {
        window.gtag('get', MEASUREMENT_ID, 'linker_param', function (linkerParam) {
          done(appendQuery(url, linkerParam));
        });
        setTimeout(function () { done(url); }, 500);
      } catch (e) {
        done(url);
      }
    }

    return {
      trackViewItem: trackViewItem,
      trackAddToCart: trackAddToCart,
      trackBeginCheckout: trackBeginCheckout,
      decorateCheckoutUrl: decorateCheckoutUrl
    };
  })();

  /* ─── PATTA CART — gerenciador de carrinho local ─── */
  var PattaCart = (function () {
    var KEY = 'patta_cart_v2';
    var items = [];

    function load() {
      try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { items = []; }
    }

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    }

    function add(item) {
      var idx = items.findIndex(function (i) {
        return i.productId === item.productId && i.variantId === item.variantId;
      });
      if (idx >= 0) {
        items[idx].quantity += (item.quantity || 1);
      } else {
        items.push(Object.assign({}, item, { quantity: item.quantity || 1 }));
      }
      save();
      if (window.PattaCartUI) PattaCartUI.update();
    }

    function remove(idx) {
      items.splice(idx, 1);
      save();
      if (window.PattaCartUI) PattaCartUI.update();
    }

    function increment(idx) {
      if (items[idx]) { items[idx].quantity++; save(); if (window.PattaCartUI) PattaCartUI.update(); }
    }

    function decrement(idx) {
      if (!items[idx]) return;
      items[idx].quantity--;
      if (items[idx].quantity <= 0) items.splice(idx, 1);
      save();
      if (window.PattaCartUI) PattaCartUI.update();
    }

    function clear() {
      items = [];
      save();
      if (window.PattaCartUI) PattaCartUI.update();
    }

    function count() {
      return items.reduce(function (acc, i) { return acc + i.quantity; }, 0);
    }

    function total() {
      return items.reduce(function (acc, i) { return acc + (i.price * i.quantity); }, 0);
    }

    function getItems() { return items.slice(); }

    load();
    return { add: add, remove: remove, increment: increment, decrement: decrement, clear: clear, count: count, total: total, getItems: getItems };
  })();

  /* ─── PATTA CART UI ─── */
  var PattaCartUI = (function () {
    var fab         = document.getElementById('cartFab');
    var badge       = document.getElementById('cartBadge');
    var overlay         = document.getElementById('cartOverlay');
    var drawer          = document.getElementById('cartDrawer');
    var closeBtn        = document.getElementById('cartDrawerClose');
    var wrap            = document.getElementById('cartItemsWrap');
    var emptyEl         = document.getElementById('cartEmptyState');
    var footer          = document.getElementById('cartDrawerFooter');
    var subtotalEl      = document.getElementById('cartSubtotal');
    var installmentsEl  = document.getElementById('cartInstallmentsHint');
    var checkoutBtn     = document.getElementById('cartBtnCheckout');
    var checkoutErrEl   = document.getElementById('cartCheckoutErr');
    var continueBtn     = document.getElementById('cartBtnContinue');
    var toastEl         = document.getElementById('cartToast');
    var toastMsg        = document.getElementById('cartToastMsg');
    var toastTimer      = null;

    var CHECKOUT_API_URL = '/api/checkout';
    var SHIPPING_API_URL = '/api/shipping';

    var shippingZip     = document.getElementById('cartShippingZip');
    var shippingBtn     = document.getElementById('cartShippingBtn');
    var shippingResults = document.getElementById('cartShippingResults');

    function resetShipping() {
      if (shippingResults) { shippingResults.innerHTML = ''; shippingResults.classList.remove('visible'); }
    }

    function renderShippingOptions(options) {
      if (!shippingResults) return;
      shippingResults.innerHTML = '';
      if (!options || !options.length) {
        shippingResults.innerHTML = '<span class="cart-shipping-err">Nenhuma opção de frete disponível para este CEP.</span>';
      } else {
        options.forEach(function (opt) {
          var el = document.createElement('div');
          el.className = 'cart-shipping-option';
          var cost = opt.estimatedCost && parseFloat(opt.estimatedCost.amount);
          var priceHtml = (cost === 0)
            ? '<span class="cart-shipping-free">Grátis</span>'
            : '<span class="cart-shipping-price">R$ ' + cost.toFixed(2).replace('.', ',') + '</span>';
          el.innerHTML = '<span>' + opt.title + '</span>' + priceHtml;
          shippingResults.appendChild(el);
        });
      }
      shippingResults.classList.add('visible');
    }

    if (shippingZip) {
      shippingZip.addEventListener('input', function () {
        var raw = shippingZip.value.replace(/\D/g, '').slice(0, 8);
        shippingZip.value = raw.length > 5 ? raw.slice(0, 5) + '-' + raw.slice(5) : raw;
        resetShipping();
      });
    }

    if (shippingBtn) {
      shippingBtn.addEventListener('click', function () {
        var zip = shippingZip ? shippingZip.value.replace(/\D/g, '') : '';
        if (zip.length !== 8) {
          shippingResults.innerHTML = '<span class="cart-shipping-err">Digite um CEP válido com 8 dígitos.</span>';
          shippingResults.classList.add('visible');
          return;
        }
        var items = PattaCart.getItems();
        if (!items.length) return;

        shippingBtn.disabled = true;
        shippingBtn.textContent = '…';
        resetShipping();

        fetch(SHIPPING_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: items, zip: zip })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          shippingBtn.disabled = false;
          shippingBtn.textContent = 'Calcular frete';
          if (data.options) {
            renderShippingOptions(data.options);
          } else {
            shippingResults.innerHTML = '<span class="cart-shipping-err">' + (data.error || 'Não foi possível calcular o frete.') + '</span>';
            shippingResults.classList.add('visible');
          }
        })
        .catch(function () {
          shippingBtn.disabled = false;
          shippingBtn.textContent = 'Calcular frete';
          shippingResults.innerHTML = '<span class="cart-shipping-err">Erro ao calcular frete. Tente novamente.</span>';
          shippingResults.classList.add('visible');
        });
      });
    }

    function open() {
      overlay.removeAttribute('aria-hidden');
      overlay.classList.add('open');
      drawer.removeAttribute('aria-hidden');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (checkoutErrEl) checkoutErrEl.hidden = true;
    }

    function showToast(msg) {
      if (!toastEl) return;
      toastMsg.textContent = msg || 'Produto adicionado ao carrinho.';
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3000);
    }

    function fmtBRL(v) {
      return 'R$ ' + v.toFixed(2).replace('.', ',');
    }

    function renderItems() {
      var items = PattaCart.getItems();

      wrap.querySelectorAll('.cart-item').forEach(function (el) { el.remove(); });

      if (items.length === 0) {
        emptyEl.style.display = '';
        footer.hidden = true;
        resetShipping();
        return;
      }

      emptyEl.style.display = 'none';
      footer.hidden = false;
      var total = PattaCart.total();
      subtotalEl.textContent = fmtBRL(total);
      if (installmentsEl) {
        installmentsEl.textContent = 'ou 10x de ' + fmtBRL(total / 10);
      }

      items.forEach(function (item, idx) {
        var row = document.createElement('div');
        row.className = 'cart-item';

        var imgHtml = item.image
          ? '<img src="' + item.image + '" alt="' + item.productName + '" loading="lazy">'
          : '';

        row.innerHTML =
          '<div class="cart-item-img">' + imgHtml + '</div>' +
          '<div class="cart-item-body">' +
            '<div class="cart-item-name">' + item.productName + '</div>' +
            '<div class="cart-item-meta">' + item.color + ' · ' + item.size + '</div>' +
            '<div class="cart-item-controls">' +
              '<button class="cart-qty-btn" data-action="decrement" data-idx="' + idx + '" aria-label="Diminuir quantidade">−</button>' +
              '<span class="cart-qty-val">' + item.quantity + '</span>' +
              '<button class="cart-qty-btn" data-action="increment" data-idx="' + idx + '" aria-label="Aumentar quantidade">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="cart-item-side">' +
            '<button class="cart-item-remove" data-action="remove" data-idx="' + idx + '" aria-label="Remover item">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
                '<polyline points="3 6 5 6 21 6"/>' +
                '<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>' +
                '<path d="M10 11v6M14 11v6"/>' +
                '<path d="M9 6V4h6v2"/>' +
              '</svg>' +
            '</button>' +
            '<span class="cart-item-price">' + fmtBRL(item.price * item.quantity) + '</span>' +
          '</div>';

        wrap.appendChild(row);
      });
    }

    function update() {
      var n = PattaCart.count();
      badge.textContent = n;
      badge.classList.toggle('visible', n > 0);
      fab.setAttribute('aria-label', 'Abrir carrinho (' + n + ' ' + (n === 1 ? 'item' : 'itens') + ')');
      renderItems();
    }

    /* delegação de eventos nos controles de item */
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var idx = parseInt(btn.dataset.idx, 10);
      if (action === 'increment') PattaCart.increment(idx);
      else if (action === 'decrement') PattaCart.decrement(idx);
      else if (action === 'remove') PattaCart.remove(idx);
    });

    if (fab)         fab.addEventListener('click', open);
    if (closeBtn)    closeBtn.addEventListener('click', close);
    if (overlay)     overlay.addEventListener('click', close);
    if (continueBtn) continueBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) close();
    });

    /* ── Finalizar Compra — proxy /api/checkout → Shopify cartCreate ── */
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        var items = PattaCart.getItems();
        if (!items.length) return;

        if (window.PattaAnalytics) {
          PattaAnalytics.trackBeginCheckout(items, PattaCart.total());
        }

        if (window.fbq) {
          fbq('track', 'InitiateCheckout', {
            content_ids: items.map(function (i) { return i.variantId; }),
            num_items: PattaCart.count(),
            value: PattaCart.total(),
            currency: 'BRL'
          });
        }
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('loading');
        checkoutBtn.textContent = 'Redirecionando…';

        fetch(CHECKOUT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: items })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.checkoutUrl) {
            PattaCart.clear();
            if (window.PattaAnalytics) {
              PattaAnalytics.decorateCheckoutUrl(data.checkoutUrl, function (checkoutUrl) {
                window.location.href = checkoutUrl;
              });
            } else {
              window.location.href = data.checkoutUrl;
            }
          } else {
            console.error('[PattaCart] checkout error:', data);
            throw new Error('checkout URL ausente');
          }
        })
        .catch(function (err) {
          console.error('[PattaCart] checkout error:', err);
          checkoutBtn.disabled = false;
          checkoutBtn.classList.remove('loading');
          checkoutBtn.textContent = 'Finalizar compra';
          if (checkoutErrEl) checkoutErrEl.hidden = false;
        });
      });
    }

    function pulseBadge() {
      if (!badge) return;
      badge.classList.remove('pulse');
      void badge.offsetWidth;
      badge.classList.add('pulse');
      badge.addEventListener('animationend', function () {
        badge.classList.remove('pulse');
      }, { once: true });
    }

    update();

    return { update: update, showToast: showToast, open: open, close: close, pulseBadge: pulseBadge };
  })();

  /* ─── PRODUCT DRAWER ─── */
  var ProductDrawer = (function () {
    var overlay   = document.getElementById('pdvOverlay');
    var drawer    = document.getElementById('pdvDrawer');
    var closeBtn  = document.getElementById('pdvCloseBtn');
    var thumbEl   = document.getElementById('pdvThumb');
    var nameEl    = document.getElementById('pdvName');
    var priceEl   = document.getElementById('pdvPriceMain');
    var installEl = document.getElementById('pdvInstallments');
    var colorSec  = document.getElementById('pdvColorSection');
    var colorName = document.getElementById('pdvColorName');
    var swatches  = document.getElementById('pdvSwatches');
    var sizeSec   = document.getElementById('pdvSizeSection');
    var sizeBtns  = document.getElementById('pdvSizeBtns');
    var qtyMinus  = document.getElementById('pdvQtyMinus');
    var qtyPlus   = document.getElementById('pdvQtyPlus');
    var qtyNum    = document.getElementById('pdvQtyNum');
    var summDesc  = document.getElementById('pdvSummaryDesc');
    var summTotal = document.getElementById('pdvSummaryTotal');
    var errEl     = document.getElementById('pdvErr');
    var ctaBtn    = document.getElementById('pdvCtaBtn');
    var guideLink = document.getElementById('pdvGuideLink');
    var _cfg = null, _cor = 0, _sz = null, _qty = 1;

    function fmt(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }

    function open(cfg) {
      _cfg = cfg; _cor = 0; _sz = null; _qty = 1;
      if (guideLink) {
        if (cfg.guide) {
          guideLink.dataset.guide = cfg.guide;
          guideLink.style.display = '';
        } else {
          guideLink.removeAttribute('data-guide');
          guideLink.style.display = 'none';
        }
      }
      render();
      overlay.removeAttribute('aria-hidden'); overlay.classList.add('open');
      drawer.removeAttribute('aria-hidden');  drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
      if (window.PattaAnalytics) {
        PattaAnalytics.trackViewItem(cfg);
      }
      if (window.fbq) {
        fbq('track', 'ViewContent', {
          content_ids: [cfg.productId],
          content_name: cfg.name,
          content_type: 'product',
          value: cfg.price,
          currency: 'BRL'
        });
      }
    }

    function close() {
      overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true');
      drawer.classList.remove('open');  drawer.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
      if (ctaBtn) { ctaBtn.disabled = false; ctaBtn.textContent = 'Adicionar ao carrinho'; }
    }

    function render() {
      var c = _cfg.colors ? _cfg.colors[_cor] : null;
      thumbEl.src = c ? c.img : (_cfg.defaultImage || '');
      thumbEl.alt = _cfg.name;
      nameEl.textContent = _cfg.name;
      priceEl.textContent = fmt(_cfg.price);
      installEl.textContent = _cfg.installmentText || 'ou 10x de R$ 13,70';

      if (_cfg.colors && _cfg.colors.length > 1) {
        colorSec.style.display = '';
        colorName.textContent = _cfg.colors[_cor].name;
        swatches.innerHTML = '';
        _cfg.colors.forEach(function (v, i) {
          var btn = document.createElement('button');
          btn.className = 'pdv-swatch' + (i === _cor ? ' active' : '');
          btn.style.backgroundColor = v.hex;
          btn.setAttribute('aria-label', v.name);
          btn.setAttribute('aria-pressed', i === _cor ? 'true' : 'false');
          btn.setAttribute('title', v.name);
          if (v.light) btn.dataset.light = '';
          btn.addEventListener('click', function () { setCor(i); });
          swatches.appendChild(btn);
        });
      } else { colorSec.style.display = 'none'; }

      if (_cfg.sizes && _cfg.sizes.length) {
        sizeSec.style.display = '';
        sizeBtns.innerHTML = '';
        _cfg.sizes.forEach(function (sz) {
          var btn = document.createElement('button');
          btn.className = 'pdv-sz-btn';
          btn.textContent = sz;
          btn.addEventListener('click', function () { setSz(sz); });
          sizeBtns.appendChild(btn);
        });
      } else { sizeSec.style.display = 'none'; }

      errEl.classList.remove('visible');
      syncSummary();
    }

    function setCor(i) {
      _cor = i;
      var v = _cfg.colors[i];
      thumbEl.style.opacity = '0';
      setTimeout(function () { thumbEl.src = v.img; thumbEl.style.opacity = '1'; }, 150);
      colorName.textContent = v.name;
      swatches.querySelectorAll('.pdv-swatch').forEach(function (s, j) {
        s.classList.toggle('active', j === i);
        s.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      });
    }

    function setSz(sz) {
      _sz = sz;
      sizeBtns.querySelectorAll('.pdv-sz-btn').forEach(function (b) { b.classList.toggle('active', b.textContent === sz); });
      errEl.classList.remove('visible');
      syncSummary();
    }

    function syncSummary() {
      if (!_cfg) return;
      qtyNum.textContent = _qty;
      summDesc.textContent = _qty + ' ' + (_qty === 1 ? 'item' : 'itens');
      summTotal.textContent = fmt(_cfg.price * _qty);
    }

    function addToCart() {
      if (_cfg.sizes && _cfg.sizes.length && !_sz) {
        errEl.classList.add('visible');
        sizeSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      var cor = _cfg.colors ? _cfg.colors[_cor] : null;
      var variantId = (_cfg.variantIds && cor && _sz)
        ? (_cfg.variantIds[cor.cartValue + '|' + _sz] || null)
        : null;

      if (!variantId) {
        errEl.textContent = 'Combinação indisponível. Escolha outra opção.';
        errEl.classList.add('visible');
        console.error('[PattaMansa] Variante Shopify não mapeada:', {
          product: _cfg.name, cor: cor && cor.cartValue, tamanho: _sz
        });
        return;
      }

      ctaBtn.disabled = true;
      ctaBtn.textContent = 'Adicionando…';

      var cartItem = {
        productId: _cfg.productId,
        variantId: variantId,
        productName: _cfg.name,
        color: cor ? cor.name : '',
        size: _sz,
        quantity: _qty,
        price: _cfg.price,
        image: cor ? cor.img : (_cfg.defaultImage || ''),
      };

      PattaCart.add(cartItem);

      if (window.PattaAnalytics) {
        PattaAnalytics.trackAddToCart(cartItem);
      }

      if (window.fbq) {
        fbq('track', 'AddToCart', {
          content_ids: [variantId],
          content_name: _cfg.name,
          content_type: 'product',
          value: _cfg.price * _qty,
          currency: 'BRL'
        });
      }
      if (window.PattaCartUI) {
        PattaCartUI.showToast('Produto adicionado ao carrinho');
        PattaCartUI.pulseBadge();
      }
      setTimeout(function () { close(); }, 350);
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay)  overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) close();
    });
    if (qtyMinus) qtyMinus.addEventListener('click', function () { if (_qty > 1)  { _qty--; syncSummary(); } });
    if (qtyPlus)  qtyPlus.addEventListener('click',  function () { if (_qty < 10) { _qty++; syncSummary(); } });
    if (ctaBtn)   ctaBtn.addEventListener('click', addToCart);

    return { open: open, close: close };
  })();

  /* Scroll Reveal */
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


  function buildVariantGallery(galleryWrap, variants, onSelect, labelPrefix) {
    if (!galleryWrap) return function () {};
    galleryWrap.innerHTML = '';
    variants.forEach(function (v, i) {
      const btn = document.createElement('button');
      btn.className = 'vcard-thumb' + (i === 0 ? ' active' : '');
      btn.type = 'button';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', 'Ver ' + labelPrefix + ' ' + v.name);
      btn.innerHTML = '<img src="' + v.img + '" alt="" loading="lazy">';
      btn.addEventListener('click', function () { onSelect(i); });
      galleryWrap.appendChild(btn);
    });
    return function (activeIndex) {
      galleryWrap.querySelectorAll('.vcard-thumb').forEach(function (thumb, i) {
        thumb.classList.toggle('active', i === activeIndex);
      });
    };
  }

  /* ── Seleção Canina ── */
  (function () {
    const PRODUCT_ID = '10299357397293';
    const BASE_SC = 'cole%C3%A7%C3%A3o%20SELE%C3%87%C3%83O%20CANINA%20FEMININA%20BABY%20LOOK/';
    const variants = [
      { name: 'Preta',   cartValue: 'Preta',   hex: '#1C1C1C', img: BASE_SC + 'preta%202.webp' },
      { name: 'Branca',  cartValue: 'Branca',  hex: '#F0EDE5', img: BASE_SC + 'branca%203.webp', light: true },
      { name: 'Marinho', cartValue: 'Marinho', hex: '#1C2B4A', img: BASE_SC + 'azul%20marinho%204.webp' },
    ];
    const SIZES = ['PP', 'P', 'M', 'G', 'GG', '3G'];
    const scBlVariantIds = {
      'Preta|PP':'52164760764717','Preta|P':'52164760961325','Preta|M':'52164761157933',
      'Preta|G':'52164761354541','Preta|GG':'52164761551149','Preta|3G':'52164761747757',
      'Branca|PP':'52164760797485','Branca|P':'52164760994093','Branca|M':'52164761190701',
      'Branca|G':'52164761387309','Branca|GG':'52164761583917','Branca|3G':'52164761780525',
      'Marinho|PP':'52164760830253','Marinho|P':'52164761026861','Marinho|M':'52164761223469',
      'Marinho|G':'52164761420077','Marinho|GG':'52164761616685','Marinho|3G':'52164761813293',
    };

    const img    = document.getElementById('scImg');
    const corNome = document.getElementById('scCorNome');
    const swWrap = document.getElementById('scSwatches');
    const szWrap = document.getElementById('scSizes');
    const galleryWrap = document.getElementById('scGallery');
    const ctaBtn = document.getElementById('scCta');

    if (!img || !swWrap || !szWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeSz  = null;

    variants.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', () => setCor(i));
      swWrap.appendChild(btn);
    });

    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', () => setSz(sz));
      szWrap.appendChild(btn);
    });

    const syncGallery = buildVariantGallery(galleryWrap, variants, setCor, 'Seleção Canina Baby Look');

    function setCor(i) {
      if (activeCor === i) return;
      activeCor = i;
      swWrap.querySelectorAll('.sc-swatch').forEach((s, j) => s.classList.toggle('active', j === i));
      syncGallery(i);
      corNome.textContent = variants[i].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = variants[i].img;
        img.alt = 'Seleção Canina ' + variants[i].name + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === sz));
      syncCta();
    }

    function syncCta() {
      ctaBtn.removeAttribute('href');
      ctaBtn.type = 'button';
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Seleção Canina · Baby Look · Feminina',
        price: 129.90, installments: 10, installmentText: 'ou 10x de R$13,51',
        defaultImage: variants[0].img,
        colors: variants, sizes: SIZES,
        variantIds: scBlVariantIds, productId: PRODUCT_ID,
        guide: 'algodao-peruano',
      });
    }, true);
    syncCta();
  })();

  /* ── Caramelo FC — Baby Look · Feminina ── */
  (function () {
    const PRODUCT_ID = '10299358871853';
    const variants = [
      { name: 'Preta',       cartValue: 'Preta',       hex: '#1C1C1C', img: 'https://cdn.shopify.com/s/files/1/0954/7916/9325/files/preta_e5f0eb2f-d707-41a0-b18d-d355c38bda9e.webp?v=1780856653' },
      { name: 'Branca',      cartValue: 'Branca',      hex: '#F0EDE5', img: 'https://cdn.shopify.com/s/files/1/0954/7916/9325/files/branca_bfcbbad3-d1fe-4a76-9f23-ce5bde3b2101.webp?v=1780856653', light: true },
      { name: 'Marinho',     cartValue: 'Marinho',     hex: '#1C2B4A', img: 'https://cdn.shopify.com/s/files/1/0954/7916/9325/files/azulmarinho.webp?v=1780856653' },
      { name: 'Verde Musgo', cartValue: 'Verde Musgo', hex: '#3F6A44', img: 'https://cdn.shopify.com/s/files/1/0954/7916/9325/files/def55430f0c2c1d4a7fdc76c33e69670.jpg?v=1781832471' },
    ];
    const SIZES = ['PP', 'P', 'M', 'G', 'GG'];
    const cfc2VariantIds = {
      'Preta|PP':'52164767154477','Preta|P':'52164767482157','Preta|M':'52164767809837',
      'Preta|G':'52164768137517','Preta|GG':'52164768465197',
      'Branca|PP':'52164767187245','Branca|P':'52164767514925','Branca|M':'52164767842605',
      'Branca|G':'52164768170285','Branca|GG':'52164768497965',
      'Marinho|PP':'52164767220013','Marinho|P':'52164767547693','Marinho|M':'52164767875373',
      'Marinho|G':'52164768203053','Marinho|GG':'52164768530733',
      'Verde Musgo|PP':'52164767285549','Verde Musgo|P':'52164767613229','Verde Musgo|M':'52164767940909',
      'Verde Musgo|G':'52164768268589','Verde Musgo|GG':'52164768596269',
    };

    const img      = document.getElementById('cfc2Img');
    const corNome  = document.getElementById('cfc2CorNome');
    const swWrap   = document.getElementById('cfc2Swatches');
    const szWrap   = document.getElementById('cfc2Sizes');
    const galleryWrap = document.getElementById('cfc2Gallery');
    const ctaBtn   = document.getElementById('cfc2Cta');

    if (!img || !swWrap || !szWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeSz  = null;

    variants.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', () => setCor(i));
      swWrap.appendChild(btn);
    });

    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', () => setSz(sz));
      szWrap.appendChild(btn);
    });

    const syncGallery = buildVariantGallery(galleryWrap, variants, setCor, 'Caramelo FC Baby Look');

    function setCor(i) {
      if (activeCor === i) return;
      activeCor = i;
      swWrap.querySelectorAll('.sc-swatch').forEach((s, j) => s.classList.toggle('active', j === i));
      syncGallery(i);
      corNome.textContent = variants[i].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = variants[i].img;
        img.alt = 'Caramelo FC Baby Look ' + variants[i].name + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === sz));
      syncCta();
    }

    function syncCta() {
      ctaBtn.removeAttribute('href');
      ctaBtn.type = 'button';
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Caramelo FC · Baby Look · Feminina',
        price: 129.90, installments: 10, installmentText: 'ou 10x de R$13,51',
        defaultImage: variants[0].img,
        colors: variants, sizes: SIZES,
        variantIds: cfc2VariantIds, productId: PRODUCT_ID,
        guide: 'algodao-peruano',
      });
    }, true);
    syncCta();
  })();

  /* ── Seleção Canina — Masculina ── */
  (function () {
    const PRODUCT_ID = '10299357397293';
    const variants = [
      { name: 'Preta',   cartValue: 'Preta',   hex: '#1C1C1C', img: 'COLE%C3%87AO%20selecao%20canina%20feminina/preta%201.webp' },
      { name: 'Branca',  cartValue: 'Branca',  hex: '#F0EDE5', img: 'COLE%C3%87AO%20selecao%20canina%20feminina/branca%202.webp', light: true },
      { name: 'Marinho', cartValue: 'Marinho', hex: '#1C2B4A', img: 'COLE%C3%87AO%20selecao%20canina%20feminina/azul%20marinho%203.webp' },
    ];
    const SIZES = ['P', 'M', 'G', 'GG', '3G', '4G'];

    const img         = document.getElementById('smImg');
    const corNome     = document.getElementById('smCorNome');
    const swWrap      = document.getElementById('smSwatches');
    const szWrap      = document.getElementById('smSizes');
    const galleryWrap = document.getElementById('smGallery');
    const ctaBtn      = document.getElementById('smCta');

    if (!img || !swWrap || !szWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeSz  = null;

    variants.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', () => setCor(i));
      swWrap.appendChild(btn);
    });

    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', () => setSz(sz));
      szWrap.appendChild(btn);
    });

    const syncGallery = buildVariantGallery(galleryWrap, variants, setCor, 'Seleção Canina Regular Masculina');

    function setCor(i) {
      if (activeCor === i) return;
      activeCor = i;
      swWrap.querySelectorAll('.sc-swatch').forEach((s, j) => s.classList.toggle('active', j === i));
      syncGallery(i);
      corNome.textContent = variants[i].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = variants[i].img;
        img.alt = 'Seleção Canina Masculina ' + variants[i].name + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === sz));
    }

    const smVariantIds = {
      'Preta|P':'52164760863021','Preta|M':'52164761059629','Preta|G':'52164761256237',
      'Preta|GG':'52164761452845','Preta|3G':'52164761649453','Preta|4G':'52164761846061',
      'Branca|P':'52164760895789','Branca|M':'52164761092397','Branca|G':'52164761289005',
      'Branca|GG':'52164761485613','Branca|3G':'52164761682221','Branca|4G':'52164761878829',
      'Marinho|P':'52164760928557','Marinho|M':'52164761125165','Marinho|G':'52164761321773',
      'Marinho|GG':'52164761518381','Marinho|3G':'52164761714989','Marinho|4G':'52164761911597',
    };

    if (ctaBtn) {
      ctaBtn.onclick = null;
      ctaBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        ProductDrawer.open({
          name: 'Seleção Canina Regular · Masculina',
          price: 129.90, installments: 10, installmentText: 'ou 10x de R$13,51',
          defaultImage: variants[0].img,
          colors: variants, sizes: SIZES,
          variantIds: smVariantIds, productId: PRODUCT_ID,
          guide: 'regular-masculina',
        });
      }, true);
    }
  })();

  /* ── Clube Seleção Canina ── */
  (function () {
    const PRODUCT_ID = '10299358576941';
    const BASE = 'cole%C3%A7%C3%A3o%20sele%C3%A7%C3%A3o%20canina%20oversize/';
    const variants = [
      { name: 'Preta', cartValue: 'Preta', code: 'PT', hex: '#1C1C1C', img: BASE + 'branca.webp' },
    ];
    const gallery = [
      { label: 'Preta', code: 'PT', img: BASE + 'branca.webp' },
    ];
    const SIZES = ['P', 'M', 'G', 'GG', '3G'];
    const variantIds = {
      'Preta|P':  '52164766400813',
      'Preta|M':  '52164766499117',
      'Preta|G':  '52164766597421',
      'Preta|GG': '52164766695725',
      'Preta|3G': '52164766794029',
    };
    const skuVariations = variants.flatMap(function (v) {
      return SIZES.map(function (size) {
        return {
          product: 'Seleção Canina Oversized',
          category: 'Unissex',
          model: 'Camiseta Oversized',
          modelCode: 'OV',
          color: v.cartValue,
          colorCode: v.code,
          size: size,
          sku: 'PM-BR26-OV-' + v.code + '-' + size,
          variantId: variantIds[v.cartValue + '|' + size],
        };
      });
    });

    window.PATTAMANSA_OVERSIZED_SKUS = skuVariations;

    const img      = document.getElementById('ovImg');
    const corNome  = document.getElementById('ovCorNome');
    const swWrap   = document.getElementById('ovSwatches');
    const szWrap   = document.getElementById('ovSizes');
    const galleryWrap = document.getElementById('ovGallery');
    const ctaBtn   = document.getElementById('ovCta');

    if (!img || !swWrap || !szWrap || !galleryWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeGallery = 0;
    let activeSz = null;

    variants.forEach(function (v, i) {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', function () { setCor(i); });
      swWrap.appendChild(btn);
    });

    gallery.forEach(function (item, i) {
      const btn = document.createElement('button');
      btn.className = 'vcard-thumb' + (i === 0 ? ' active' : '');
      btn.type = 'button';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', 'Ver Clube Seleção Canina ' + item.label);
      btn.innerHTML = '<img src="' + item.img + '" alt="" loading="lazy">';
      btn.addEventListener('click', function () { setGallery(i); });
      galleryWrap.appendChild(btn);
    });

    SIZES.forEach(function (sz) {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', function () { setSz(sz); });
      szWrap.appendChild(btn);
    });

    function setCor(i) {
      const galleryIndex = gallery.findIndex(function (item) { return item.code === variants[i].code; });
      setGallery(galleryIndex >= 0 ? galleryIndex : 0);
    }

    function setGallery(i) {
      activeGallery = i;
      const item = gallery[i];
      const colorIndex = variants.findIndex(function (v) { return v.code === item.code; });
      if (colorIndex >= 0) activeCor = colorIndex;

      swWrap.querySelectorAll('.sc-swatch').forEach(function (s, j) {
        s.classList.toggle('active', j === activeCor);
      });
      galleryWrap.querySelectorAll('.vcard-thumb').forEach(function (thumb, j) {
        thumb.classList.toggle('active', j === activeGallery);
      });

      corNome.textContent = variants[activeCor].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = item.img;
        img.alt = 'Clube Seleção Canina ' + item.label + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.size === sz);
      });
      syncCta();
    }

    function currentSku() {
      if (!activeSz) return null;
      const code = variants[activeCor].code;
      const match = skuVariations.find(function (item) {
        return item.colorCode === code && item.size === activeSz;
      });
      return match ? match.sku : null;
    }

    function syncCta() {
      ctaBtn.type = 'button';
      ctaBtn.removeAttribute('href');
      ctaBtn.setAttribute('aria-label', 'Adicionar Seleção Canina Oversized ao carrinho');
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Seleção Canina · Oversized · Unissex',
        price: 149.90, installments: 10, installmentText: 'ou 10x de R$15,59',
        defaultImage: BASE + 'branca.webp',
        colors: variants, sizes: SIZES,
        variantIds: variantIds, productId: PRODUCT_ID,
        guide: 'camiseta-oversized',
      });
    }, true);
    syncCta();
  })();

  /* ── Clube Canino — Feminina ── */
  (function () {
    const PRODUCT_ID = '10299357987117';
    const variants = [
      { name: 'Amarela', cartValue: 'Amarela', hex: '#F0C830', img: 'cole%C3%A7ao%20clube%20canino%20feminino/amarela%201.webp', light: true },
      { name: 'Branca',  cartValue: 'Branca',  hex: '#F0EDE5', img: 'cole%C3%A7ao%20clube%20canino%20feminino/branca%202.webp',  light: true },
    ];
    const SIZES = ['PP', 'P', 'M', 'G', 'GG', '3G'];
    const ccfVariantIds = {
      'Branca|PP':'52164763615533','Branca|P':'52164763746605','Branca|M':'52164763877677',
      'Branca|G':'52164764008749','Branca|GG':'52164764139821','Branca|3G':'52164764270893',
      'Amarela|PP':'52164763648301','Amarela|P':'52164763779373','Amarela|M':'52164763910445',
      'Amarela|G':'52164764041517','Amarela|GG':'52164764172589','Amarela|3G':'52164764303661',
    };

    const img     = document.getElementById('ccfImg');
    const corNome = document.getElementById('ccfCorNome');
    const swWrap  = document.getElementById('ccfSwatches');
    const szWrap  = document.getElementById('ccfSizes');
    const galleryWrap = document.getElementById('ccfGallery');
    const ctaBtn  = document.getElementById('ccfCta');

    if (!img || !swWrap || !szWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeSz  = null;

    variants.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', () => setCor(i));
      swWrap.appendChild(btn);
    });

    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', () => setSz(sz));
      szWrap.appendChild(btn);
    });

    const syncGallery = buildVariantGallery(galleryWrap, variants, setCor, 'Clube Canino Baby Look');

    function setCor(i) {
      if (activeCor === i) return;
      activeCor = i;
      swWrap.querySelectorAll('.sc-swatch').forEach((s, j) => s.classList.toggle('active', j === i));
      syncGallery(i);
      corNome.textContent = variants[i].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = variants[i].img;
        img.alt = 'Clube Canino ' + variants[i].name + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === sz));
      syncCta();
    }

    function syncCta() {
      ctaBtn.removeAttribute('href');
      ctaBtn.type = 'button';
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Clube Canino · Baby Look · Feminina',
        price: 129.90, installments: 10, installmentText: 'ou 10x de R$13,51',
        defaultImage: variants[0].img,
        colors: variants, sizes: SIZES,
        variantIds: ccfVariantIds, productId: PRODUCT_ID,
        guide: 'algodao-peruano',
      });
    }, true);
    syncCta();
  })();

  /* ── Clube Feminino ── */
  (function () {
    const PRODUCT_ID = '10299358347565';
    const BASE = 'cole%C3%A7%C3%A3o%20clube%20canino%20croped%20feminino/';
    const variants = [
      { name: 'Amarelo',  cartValue: 'Amarelo',  code: 'AM', hex: '#F0C830', img: BASE + 'amarelo.webp', light: true },
      { name: 'Preta',    cartValue: 'Preta',    code: 'PT', hex: '#1C1C1C', img: BASE + 'preta.webp' },
      { name: 'Branca',   cartValue: 'Branca',   code: 'BC', hex: '#F0EDE5', img: BASE + 'branca.webp', light: true },
      { name: 'Marinho',  cartValue: 'Marinho',  code: 'MH', hex: '#1C2B4A', img: BASE + 'azul%20marinho.webp' },
      { name: 'Cinza',    cartValue: 'Cinza',    code: 'CZ', hex: '#8A8A8A', img: BASE + 'cinza.webp' },
      { name: 'Vermelho', cartValue: 'Vermelho', code: 'VM', hex: '#B82F2F', img: BASE + 'vermelha.webp' },
      { name: 'Verde',    cartValue: 'Verde',    code: 'VD', hex: '#3F6A44', img: BASE + 'verde.webp' },
    ];
    const crVariantIds = {
      'Amarelo|PP':'52164765221165','Amarelo|P':'52164765450541','Amarelo|M':'52164765679917',
      'Amarelo|G':'52164765909293','Amarelo|GG':'52164766138669',
      'Preta|PP':'52164765024557','Preta|P':'52164765253933','Preta|M':'52164765483309',
      'Preta|G':'52164765712685','Preta|GG':'52164765942061',
      'Branca|PP':'52164765057325','Branca|P':'52164765286701','Branca|M':'52164765516077',
      'Branca|G':'52164765745453','Branca|GG':'52164765974829',
      'Marinho|PP':'52164765090093','Marinho|P':'52164765319469','Marinho|M':'52164765548845',
      'Marinho|G':'52164765778221','Marinho|GG':'52164766007597',
      'Cinza|PP':'52164765122861','Cinza|P':'52164765352237','Cinza|M':'52164765581613',
      'Cinza|G':'52164765810989','Cinza|GG':'52164766040365',
      'Vermelho|PP':'52164765155629','Vermelho|P':'52164765385005','Vermelho|M':'52164765614381',
      'Vermelho|G':'52164765843757','Vermelho|GG':'52164766073133',
      'Verde|PP':'52164765188397','Verde|P':'52164765417773','Verde|M':'52164765647149',
      'Verde|G':'52164765876525','Verde|GG':'52164766105901',
    };
    const gallery = [
      { label: 'Amarelo',  code: 'AM', img: BASE + 'amarelo.webp' },
      { label: 'Preta',    code: 'PT', img: BASE + 'preta.webp' },
      { label: 'Branca',   code: 'BC', img: BASE + 'branca.webp' },
      { label: 'Marinho',  code: 'MH', img: BASE + 'azul%20marinho.webp' },
      { label: 'Cinza',    code: 'CZ', img: BASE + 'cinza.webp' },
      { label: 'Vermelho', code: 'VM', img: BASE + 'vermelha.webp' },
      { label: 'Verde',    code: 'VD', img: BASE + 'verde.webp' },
    ];
    const SIZES = ['PP', 'P', 'M', 'G', 'GG'];
    const skuVariations = variants.flatMap(function (v) {
      return SIZES.map(function (size) {
        return {
          product: 'Seleção Canina Cropped',
          category: 'Feminino',
          model: 'Cropped',
          modelCode: 'CR',
          color: v.name,
          colorCode: v.code,
          size: size,
          sku: 'PM-BR26-CR-' + v.code + '-' + size,
        };
      });
    });

    window.PATTAMANSA_CROPPED_SKUS = skuVariations;

    const img      = document.getElementById('crImg');
    const corNome  = document.getElementById('crCorNome');
    const swWrap   = document.getElementById('crSwatches');
    const szWrap   = document.getElementById('crSizes');
    const galleryWrap = document.getElementById('crGallery');
    const ctaBtn   = document.getElementById('crCta');

    if (!img || !swWrap || !szWrap || !galleryWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeGallery = 0;
    let activeSz = null;

    variants.forEach(function (v, i) {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', function () { setCor(i); });
      swWrap.appendChild(btn);
    });

    gallery.forEach(function (item, i) {
      const btn = document.createElement('button');
      btn.className = 'vcard-thumb' + (i === 0 ? ' active' : '');
      btn.type = 'button';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', 'Ver Clube Feminino ' + item.label);
      btn.innerHTML = '<img src="' + item.img + '" alt="" loading="lazy">';
      btn.addEventListener('click', function () { setGallery(i); });
      galleryWrap.appendChild(btn);
    });

    SIZES.forEach(function (sz) {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', function () { setSz(sz); });
      szWrap.appendChild(btn);
    });

    function setCor(i) {
      const galleryIndex = gallery.findIndex(function (item) { return item.code === variants[i].code; });
      setGallery(galleryIndex >= 0 ? galleryIndex : 0);
    }

    function setGallery(i) {
      activeGallery = i;
      const item = gallery[i];
      const colorIndex = variants.findIndex(function (v) { return v.code === item.code; });
      if (colorIndex >= 0) activeCor = colorIndex;

      swWrap.querySelectorAll('.sc-swatch').forEach(function (s, j) {
        s.classList.toggle('active', j === activeCor);
      });
      galleryWrap.querySelectorAll('.vcard-thumb').forEach(function (thumb, j) {
        thumb.classList.toggle('active', j === activeGallery);
      });

      corNome.textContent = variants[activeCor].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = item.img;
        img.alt = 'Clube Feminino ' + item.label + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.size === sz);
      });
      syncCta();
    }

    function currentSku() {
      if (!activeSz) return null;
      const code = variants[activeCor].code;
      const match = skuVariations.find(function (item) {
        return item.colorCode === code && item.size === activeSz;
      });
      return match ? match.sku : null;
    }

    function syncCta() {
      ctaBtn.removeAttribute('href');
      ctaBtn.type = 'button';
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Seleção Canina · Cropped · Feminino',
        price: 119.90, installments: 10, installmentText: 'ou 10x de R$12,47',
        defaultImage: BASE + 'amarelo.webp',
        colors: variants, sizes: SIZES,
        variantIds: crVariantIds, productId: PRODUCT_ID,
        guide: 'cropped-feminino',
      });
    }, true);
    syncCta();
  })();

  /* ── Clube Canino Cropped Moletom ── */
  (function () {
    const PRODUCT_ID = '10299359592749';
    const BASE = 'cole%C3%A7%C3%A3o%20clube%20canino%20moletom%20croped%20feminino/';
    const variants = [
      { name: 'Branca', cartValue: 'Branca', code: 'BC', hex: '#F0EDE5', img: BASE + 'branca.webp', light: true },
      { name: 'Preta',  cartValue: 'Preta',  code: 'PT', hex: '#1C1C1C', img: BASE + 'preto.webp' },
    ];
    const cmVariantIds = {
      'Branca|PP':'52164771905837','Branca|P':'52164771971373','Branca|M':'52164772036909',
      'Branca|G':'52164772102445','Branca|GG':'52164772167981',
      'Preta|PP':'52164771873069','Preta|P':'52164771938605','Preta|M':'52164772004141',
      'Preta|G':'52164772069677','Preta|GG':'52164772135213',
    };
    const gallery = [
      { label: 'Branca', code: 'BC', img: BASE + 'branca.webp' },
      { label: 'Branca mostruário uso', code: 'BC', img: BASE + 'branca%20mostruario%20uso.webp' },
      { label: 'Preta', code: 'PT', img: BASE + 'preto.webp' },
    ];
    const SIZES = ['PP', 'P', 'M', 'G', 'GG'];
    const skuVariations = variants.flatMap(function (v) {
      return SIZES.map(function (size) {
        return {
          product: 'Caramelo FC Moletom Cropped',
          category: 'Feminino',
          model: 'Cropped Moletom',
          modelCode: 'CM',
          color: v.name,
          colorCode: v.code,
          size: size,
          sku: 'PM-BR26-CM-' + v.code + '-' + size,
        };
      });
    });

    window.PATTAMANSA_CROPPED_MOLETOM_SKUS = skuVariations;

    const img      = document.getElementById('cmImg');
    const corNome  = document.getElementById('cmCorNome');
    const swWrap   = document.getElementById('cmSwatches');
    const szWrap   = document.getElementById('cmSizes');
    const galleryWrap = document.getElementById('cmGallery');
    const ctaBtn   = document.getElementById('cmCta');

    if (!img || !swWrap || !szWrap || !galleryWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeGallery = 0;
    let activeSz = null;

    variants.forEach(function (v, i) {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', function () { setCor(i); });
      swWrap.appendChild(btn);
    });

    gallery.forEach(function (item, i) {
      const btn = document.createElement('button');
      btn.className = 'vcard-thumb' + (i === 0 ? ' active' : '');
      btn.type = 'button';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', 'Ver Clube Canino Cropped Moletom ' + item.label);
      btn.innerHTML = '<img src="' + item.img + '" alt="" loading="lazy">';
      btn.addEventListener('click', function () { setGallery(i); });
      galleryWrap.appendChild(btn);
    });

    SIZES.forEach(function (sz) {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', function () { setSz(sz); });
      szWrap.appendChild(btn);
    });

    function setCor(i) {
      const galleryIndex = gallery.findIndex(function (item) { return item.code === variants[i].code; });
      setGallery(galleryIndex >= 0 ? galleryIndex : 0);
    }

    function setGallery(i) {
      activeGallery = i;
      const item = gallery[i];
      const colorIndex = variants.findIndex(function (v) { return v.code === item.code; });
      if (colorIndex >= 0) activeCor = colorIndex;

      swWrap.querySelectorAll('.sc-swatch').forEach(function (s, j) {
        s.classList.toggle('active', j === activeCor);
      });
      galleryWrap.querySelectorAll('.vcard-thumb').forEach(function (thumb, j) {
        thumb.classList.toggle('active', j === activeGallery);
      });

      corNome.textContent = variants[activeCor].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = item.img;
        img.alt = 'Clube Canino Cropped Moletom ' + item.label + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.size === sz);
      });
      syncCta();
    }

    function currentSku() {
      if (!activeSz) return null;
      const code = variants[activeCor].code;
      const match = skuVariations.find(function (item) {
        return item.colorCode === code && item.size === activeSz;
      });
      return match ? match.sku : null;
    }

    function syncCta() {
      ctaBtn.removeAttribute('href');
      ctaBtn.type = 'button';
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Caramelo FC · Moletom Cropped · Feminino',
        price: 179.90, installments: 10, installmentText: 'ou 10x de R$18,70',
        defaultImage: BASE + 'branca.webp',
        colors: variants, sizes: SIZES,
        variantIds: cmVariantIds, productId: PRODUCT_ID,
        guide: 'cropped-moletom',
      });
    }, true);
    syncCta();
  })();

  /* ── Caramelo FC — Cropped · Feminino ── */
  (function () {
    const PRODUCT_ID = '10299359428909';
    const BASE_CRP = 'cole%C3%A7e%C3%A7%C3%A3o%20caramelo%20futebol%20clube/';
    const variants = [
      { name: 'Preta',   cartValue: 'Preta',   hex: '#1C1C1C', img: BASE_CRP + 'preta.webp' },
      { name: 'Branca',  cartValue: 'Branca',  hex: '#F0EDE5', img: BASE_CRP + 'branca.webp', light: true },
      { name: 'Marinho', cartValue: 'Marinho', hex: '#1C2B4A', img: BASE_CRP + 'preta.webp' },
      { name: 'Cinza',   cartValue: 'Cinza',   hex: '#8A8A8A', img: BASE_CRP + 'preta.webp' },
      { name: 'Verde',   cartValue: 'Verde',   hex: '#3F6A44', img: BASE_CRP + 'preta.webp' },
      { name: 'Amarelo', cartValue: 'Amarelo', hex: '#F0C830', img: BASE_CRP + 'preta.webp', light: true },
    ];
    const SIZES = ['PP', 'P', 'M', 'G', 'GG'];
    const cfcCrpVariantIds = {
      'Preta|PP':'52164770758957','Preta|P':'52164770955565','Preta|M':'52164771152173',
      'Preta|G':'52164771348781','Preta|GG':'52164771545389',
      'Branca|PP':'52164770791725','Branca|P':'52164770988333','Branca|M':'52164771184941',
      'Branca|G':'52164771381549','Branca|GG':'52164771578157',
      'Marinho|PP':'52164770824493','Marinho|P':'52164771021101','Marinho|M':'52164771217709',
      'Marinho|G':'52164771414317','Marinho|GG':'52164771610925',
      'Cinza|PP':'52164770857261','Cinza|P':'52164771053869','Cinza|M':'52164771250477',
      'Cinza|G':'52164771447085','Cinza|GG':'52164771643693',
      'Verde|PP':'52164770890029','Verde|P':'52164771086637','Verde|M':'52164771283245',
      'Verde|G':'52164771479853','Verde|GG':'52164771676461',
      'Amarelo|PP':'52164770922797','Amarelo|P':'52164771119405','Amarelo|M':'52164771316013',
      'Amarelo|G':'52164771512621','Amarelo|GG':'52164771709229',
    };

    const img      = document.getElementById('cfcCrpImg');
    const corNome  = document.getElementById('cfcCrpCorNome');
    const swWrap   = document.getElementById('cfcCrpSwatches');
    const szWrap   = document.getElementById('cfcCrpSizes');
    const galleryWrap = document.getElementById('cfcCrpGallery');
    const ctaBtn   = document.getElementById('cfcCrpCta');

    if (!img || !swWrap || !szWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeSz  = null;

    variants.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', () => setCor(i));
      swWrap.appendChild(btn);
    });

    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', () => setSz(sz));
      szWrap.appendChild(btn);
    });

    const syncGallery = buildVariantGallery(galleryWrap, variants, setCor, 'Caramelo FC Oversized Unissex');

    function setCor(i) {
      if (activeCor === i) return;
      activeCor = i;
      swWrap.querySelectorAll('.sc-swatch').forEach((s, j) => s.classList.toggle('active', j === i));
      syncGallery(i);
      corNome.textContent = variants[i].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = variants[i].img;
        img.alt = 'Caramelo FC Oversized Unissex ' + variants[i].name + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === sz));
      syncCta();
    }

    function syncCta() {
      ctaBtn.removeAttribute('href');
      ctaBtn.type = 'button';
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Caramelo FC · Oversized · Unissex',
        price: 119.90, installments: 10, installmentText: 'ou 10x de R$12,47',
        defaultImage: BASE_CRP + 'preta.webp',
        colors: variants, sizes: SIZES,
        variantIds: cfcCrpVariantIds, productId: PRODUCT_ID,
        guide: 'camiseta-oversized',
      });
    }, true);
    syncCta();
  })();

  /* ── Clube Canino — Masculina ── */
  (function () {
    const PRODUCT_ID = '10299357987117';
    const variants = [
      { name: 'Branca',  cartValue: 'Branco',  hex: '#F0EDE5', img: 'cole%C3%A7%C3%A3o%20clube%20canino%20masculino/branca%201.webp',  light: true },
      { name: 'Amarela', cartValue: 'Amarelo', hex: '#F0C830', img: 'cole%C3%A7%C3%A3o%20clube%20canino%20masculino/amarela%202.webp', light: true },
    ];
    const SIZES = ['PP', 'P', 'M', 'G', 'GG', '3G', '4G'];

    const img         = document.getElementById('ccmImg');
    const corNome     = document.getElementById('ccmCorNome');
    const swWrap      = document.getElementById('ccmSwatches');
    const szWrap      = document.getElementById('ccmSizes');
    const galleryWrap = document.getElementById('ccmGallery');
    const ctaBtn      = document.getElementById('ccmCta');

    if (!img || !swWrap || !szWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeSz  = null;

    variants.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', () => setCor(i));
      swWrap.appendChild(btn);
    });

    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', () => setSz(sz));
      szWrap.appendChild(btn);
    });

    const syncGallery = buildVariantGallery(galleryWrap, variants, setCor, 'Clube Canino Regular Masculina');

    function setCor(i) {
      if (activeCor === i) return;
      activeCor = i;
      swWrap.querySelectorAll('.sc-swatch').forEach((s, j) => s.classList.toggle('active', j === i));
      syncGallery(i);
      corNome.textContent = variants[i].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = variants[i].img;
        img.alt = 'Clube Canino Masculino ' + variants[i].name + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === sz));
      syncCta();
    }

    function syncCta() {
      ctaBtn.type = 'button';
      ctaBtn.removeAttribute('href');
      ctaBtn.setAttribute('aria-label', 'Garantir Clube Canino Regular Masculina');
    }

    const ccmVariantIds = {
      'Branco|P': '52164763681069','Branco|M': '52164763812141','Branco|G': '52164763943213',
      'Branco|GG':'52164764074285','Branco|3G':'52164764205357','Branco|4G':'52164764336429',
      'Amarelo|P':'52164763713837','Amarelo|M':'52164763844909','Amarelo|G':'52164763975981',
      'Amarelo|GG':'52164764107053','Amarelo|3G':'52164764238125','Amarelo|4G':'52164764369197',
    };
    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Clube Canino Regular · Masculina',
        price: 129.90, installments: 10, installmentText: 'ou 10x de R$13,51',
        defaultImage: variants[0].img,
        colors: variants, sizes: SIZES,
        variantIds: ccmVariantIds, productId: PRODUCT_ID,
        guide: 'regular-masculina',
      });
    }, true);
    syncCta();
  })();

  /* ── Caramelo Futebol Clube — Unissex ── */
  (function () {
    const PRODUCT_ID = '10299358871853';
    const variants = [
      { name: 'Preta',   cartValue: 'Preta',   hex: '#1C1C1C', img: 'cole%C3%A7e%C3%A7%C3%A3o%20caramelo%20futebol%20clube/preta.webp' },
      { name: 'Branca',  cartValue: 'Branca',  hex: '#F0EDE5', img: 'cole%C3%A7e%C3%A7%C3%A3o%20caramelo%20futebol%20clube/branca.webp', light: true },
      { name: 'Marinho', cartValue: 'Marinho', hex: '#1C2B4A', img: 'cole%C3%A7e%C3%A7%C3%A3o%20caramelo%20futebol%20clube/preta.webp' },
    ];
    const SIZES = ['P', 'M', 'G', 'GG', '3G', '4G'];
    const cfcVariantIds = {
      'Preta|P':'52164767318317','Preta|M':'52164767645997','Preta|G':'52164767973677',
      'Preta|GG':'52164768301357','Preta|3G':'52164768629037',
      'Branca|P':'52164767351085','Branca|M':'52164767678765','Branca|G':'52164768006445',
      'Branca|GG':'52164768334125','Branca|3G':'52164768661805',
      'Marinho|P':'52164767383853','Marinho|M':'52164767711533','Marinho|G':'52164768039213',
      'Marinho|GG':'52164768366893','Marinho|3G':'52164768694573',
    };

    const img     = document.getElementById('cfcImg');
    const corNome = document.getElementById('cfcCorNome');
    const swWrap  = document.getElementById('cfcSwatches');
    const szWrap  = document.getElementById('cfcSizes');
    const galleryWrap = document.getElementById('cfcGallery');
    const ctaBtn  = document.getElementById('cfcCta');

    if (!img || !swWrap || !szWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeSz  = null;

    variants.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', () => setCor(i));
      swWrap.appendChild(btn);
    });

    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', () => setSz(sz));
      szWrap.appendChild(btn);
    });

    const syncGallery = buildVariantGallery(galleryWrap, variants, setCor, 'Caramelo Futebol Clube');

    function setCor(i) {
      if (activeCor === i) return;
      activeCor = i;
      swWrap.querySelectorAll('.sc-swatch').forEach((s, j) => s.classList.toggle('active', j === i));
      syncGallery(i);
      corNome.textContent = variants[i].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = variants[i].img;
        img.alt = 'Caramelo Futebol Clube Unissex ' + variants[i].name + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === sz));
      syncCta();
    }

    function syncCta() {
      ctaBtn.removeAttribute('href');
      ctaBtn.type = 'button';
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Caramelo FC · Regular · Masculino',
        price: 129.90, installments: 10, installmentText: 'ou 10x de R$13,51',
        defaultImage: variants[0].img,
        colors: variants, sizes: SIZES,
        variantIds: cfcVariantIds, productId: PRODUCT_ID,
        guide: 'regular-masculina',
      });
    }, true);
    syncCta();
  })();

  /* ── Caramelo FC — Oversized · Unissex ── */
  (function () {
    const PRODUCT_ID = '10299356545325';
    const BASE_OV = 'cole%C3%A7e%C3%A7%C3%A3o%20caramelo%20futebol%20clube/';
    const variants = [
      { name: 'Preta',     cartValue: 'Preta',     hex: '#1C1C1C', img: BASE_OV + 'preta.webp' },
      { name: 'Off White', cartValue: 'Off White', hex: '#E9E1D1', img: BASE_OV + 'off%20white.webp', light: true },
      { name: 'Areia',     cartValue: 'Areia',     hex: '#D7C7A5', img: BASE_OV + 'areia.webp', light: true },
    ];
    const SIZES = ['P', 'M', 'G', 'GG', '3G'];
    const cfcOvVariantIds = {
      'Preta|P':'52164758372653','Preta|M':'52164758470957','Preta|G':'52164758569261',
      'Preta|GG':'52164758667565','Preta|3G':'52164758765869',
      'Off White|P':'52164758405421','Off White|M':'52164758503725','Off White|G':'52164758602029',
      'Off White|GG':'52164758700333','Off White|3G':'52164758798637',
      'Areia|P':'52164758438189','Areia|M':'52164758536493','Areia|G':'52164758634797',
      'Areia|GG':'52164758733101','Areia|3G':'52164758831405',
    };

    const img      = document.getElementById('cfcOvImg');
    const corNome  = document.getElementById('cfcOvCorNome');
    const swWrap   = document.getElementById('cfcOvSwatches');
    const szWrap   = document.getElementById('cfcOvSizes');
    const galleryWrap = document.getElementById('cfcOvGallery');
    const ctaBtn   = document.getElementById('cfcOvCta');

    if (!img || !swWrap || !szWrap || !ctaBtn) return;

    let activeCor = 0;
    let activeSz  = null;

    variants.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'sc-swatch' + (i === 0 ? ' active' : '');
      btn.style.backgroundColor = v.hex;
      btn.setAttribute('aria-label', v.name);
      btn.setAttribute('title', v.name);
      if (v.light) btn.dataset.light = '';
      btn.addEventListener('click', () => setCor(i));
      swWrap.appendChild(btn);
    });

    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.className = 'sc-size-btn';
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.addEventListener('click', () => setSz(sz));
      szWrap.appendChild(btn);
    });

    const syncGallery = buildVariantGallery(galleryWrap, variants, setCor, 'Caramelo FC Oversized');

    function setCor(i) {
      if (activeCor === i) return;
      activeCor = i;
      swWrap.querySelectorAll('.sc-swatch').forEach((s, j) => s.classList.toggle('active', j === i));
      syncGallery(i);
      corNome.textContent = variants[i].name;
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = variants[i].img;
        img.alt = 'Caramelo FC Oversized ' + variants[i].name + ' — PattaMansa';
        img.style.opacity = '1';
      }, 200);
      syncCta();
    }

    function setSz(sz) {
      activeSz = sz;
      szWrap.querySelectorAll('.sc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === sz));
      syncCta();
    }

    function syncCta() {
      ctaBtn.removeAttribute('href');
      ctaBtn.type = 'button';
    }

    ctaBtn.onclick = null;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      ProductDrawer.open({
        name: 'Caramelo FC · Oversized · Unissex',
        price: 149.90, installments: 10, installmentText: 'ou 10x de R$15,59',
        defaultImage: BASE_OV + 'preta.webp',
        colors: variants, sizes: SIZES,
        variantIds: cfcOvVariantIds, productId: PRODUCT_ID,
        guide: 'camiseta-oversized',
      });
    }, true);
    syncCta();
  })();

  /* ── Filtros da coleção ── */
  (function () {
    const filters = document.querySelectorAll('.collection-filter');
    const cards = document.querySelectorAll('[data-product-card]');
    const grid = document.getElementById('collectionGrid');
    if (!filters.length || !cards.length || !grid) return;

    function applyFilter(filter) {
      filters.forEach(function (btn) {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      cards.forEach(function (card) {
        const groups = (card.dataset.filter || '').split(/\s+/);
        const shouldShow = filter === 'todos' || groups.includes(filter);

        if (shouldShow) {
          card.hidden = false;
          requestAnimationFrame(function () {
            card.classList.remove('is-filtering-out');
          });
        } else {
          card.classList.add('is-filtering-out');
          setTimeout(function () {
            if (card.classList.contains('is-filtering-out')) card.hidden = true;
          }, 220);
        }
      });
    }

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.dataset.filter || 'todos');
      });
    });
  })();

  /* ONG Counter removido na Tarefa 7 — secao agora usa linha de compromisso */

  /* ── Guia de Medidas ── */
  (function () {
    const GUIDES = {
      'algodao-peruano': {
        material: 'Algodão Peruano',
        title:    'Modelagem Premium',
        subtitle: 'Toque extremamente macio, caimento refinado e modelagem confortável.',
        badges:   ['toque ultra macio', 'caimento refinado', 'acabamento premium'],
        cols:     ['Tamanho', 'Altura', 'Largura'],
        rows: [
          { size: 'P',  vals: ['70 cm', '51 cm'] },
          { size: 'M',  vals: ['72 cm', '53 cm'] },
          { size: 'G',  vals: ['74 cm', '55 cm'] },
          { size: 'GG', vals: ['76 cm', '58 cm'] },
        ],
        measure: {
          title: 'Como medir',
          lines: [
            'Altura = medida vertical da peça',
            'Largura = medida horizontal do tórax',
          ],
        },
      },
      'regular-masculina': {
        material: 'Regular Masculina',
        title:    'Modelagem Clássica',
        subtitle: 'Caimento confortável com visual versátil para o dia a dia.',
        badges:   ['conforto premium', 'caimento equilibrado', 'toque macio'],
        cols:     ['Tamanho', 'Altura', 'Largura'],
        rows: [
          { size: 'PP', vals: ['69 cm', '51 cm'] },
          { size: 'P',  vals: ['71 cm', '53 cm'] },
          { size: 'M',  vals: ['73 cm', '55 cm'] },
          { size: 'G',  vals: ['75 cm', '57 cm'] },
          { size: 'GG', vals: ['77 cm', '59 cm'] },
          { size: '3G', vals: ['79 cm', '63 cm'] },
          { size: '4G', vals: ['81 cm', '67 cm'] },
        ],
        measure: {
          title: 'Como medir',
          lines: [
            'Altura = medida vertical da peça',
            'Largura = medida horizontal do tórax',
          ],
        },
      },
      'regular-unissex': {
        material: 'Regular Unissex',
        title:    'Modelagem Clássica',
        subtitle: 'Caimento confortável com visual versátil para o dia a dia.',
        badges:   ['conforto premium', 'caimento equilibrado', 'toque macio'],
        cols:     ['Tamanho', 'Altura', 'Largura'],
        rows: [
          { size: 'PP', vals: ['69 cm', '51 cm'] },
          { size: 'P',  vals: ['71 cm', '53 cm'] },
          { size: 'M',  vals: ['73 cm', '55 cm'] },
          { size: 'G',  vals: ['75 cm', '57 cm'] },
          { size: 'GG', vals: ['77 cm', '59 cm'] },
          { size: '3G', vals: ['79 cm', '63 cm'] },
          { size: '4G', vals: ['81 cm', '67 cm'] },
        ],
        measure: {
          title: 'Como medir',
          lines: [
            'Altura = medida vertical da peça',
            'Largura = medida horizontal do tórax',
          ],
        },
      },
      'camiseta-oversized': {
        material: 'Camiseta Oversized',
        title:    'Modelagem Oversized',
        subtitle: 'Caimento amplo, unissex e confortável para um visual mais solto.',
        badges:   ['unissex', 'oversized', 'caimento amplo'],
        cols:     ['Tamanho', 'Altura', 'Largura'],
        rows: [
          { size: 'P',  vals: ['72 cm', '58 cm'] },
          { size: 'M',  vals: ['74 cm', '60 cm'] },
          { size: 'G',  vals: ['76 cm', '62 cm'] },
          { size: 'GG', vals: ['78 cm', '64 cm'] },
          { size: '3G', vals: ['80 cm', '68 cm'] },
        ],
        measure: {
          title: 'Como medir',
          lines: [
            'Altura = medida vertical da peça',
            'Largura = medida horizontal do tórax',
          ],
        },
      },
      'cropped-feminino': {
        material: 'Cropped Feminino',
        title:    'Modelagem Cropped',
        subtitle: 'Caimento curto, confortável e pensado para acompanhar cintura alta.',
        badges:   ['feminino', 'cropped', 'toque macio'],
        cols:     ['Tamanho', 'Altura', 'Largura'],
        rows: [
          { size: 'P',  vals: ['42 cm', '47 cm'] },
          { size: 'M',  vals: ['44 cm', '49 cm'] },
          { size: 'G',  vals: ['46 cm', '51 cm'] },
          { size: 'GG', vals: ['48 cm', '53 cm'] },
        ],
        measure: {
          title: 'Como medir',
          lines: [
            'Altura = medida vertical da peça',
            'Largura = medida horizontal do tórax',
          ],
        },
      },
      'cropped-moletom': {
        material: 'Cropped Moletom',
        title:    'Modelagem Cropped Moletom',
        subtitle: 'Caimento curto com estrutura de moletom e conforto para dias mais frescos.',
        badges:   ['feminino', 'moletom', 'caimento estruturado'],
        cols:     ['Tamanho', 'Altura', 'Largura'],
        rows: [
          { size: 'PP', vals: ['43 cm', '54 cm'] },
          { size: 'P',  vals: ['45 cm', '56 cm'] },
          { size: 'M',  vals: ['47 cm', '58 cm'] },
          { size: 'G',  vals: ['49 cm', '60 cm'] },
          { size: 'GG', vals: ['51 cm', '62 cm'] },
        ],
        measure: {
          title: 'Como medir',
          lines: [
            'Altura = medida vertical da peça',
            'Largura = medida horizontal do tórax',
          ],
        },
      },
      /* Para adicionar nova modelagem, copie o bloco acima e ajuste apenas os dados:
         'baby-look': { material: '...', title: '...', ... }
         'oversized':  { ... }
         'moletom':    { ... }
      */
    };

    const overlay  = document.getElementById('sgOverlay');
    const modal    = document.getElementById('sgModal');
    const content  = document.getElementById('sgContent');
    const closeBtn = document.getElementById('sgClose');
    if (!overlay || !content) return;

    function buildHTML(key) {
      const g = GUIDES[key];
      if (!g) return '<p style="color:var(--sage);padding:1rem">Guia não encontrado.</p>';
      return (
        '<p class="sg-material">' + g.material + '</p>' +
        '<h2 class="sg-title" id="sgTitle">' + g.title + '</h2>' +
        '<p class="sg-sub">' + g.subtitle + '</p>' +
        '<div class="sg-badges">' +
          g.badges.map(function(b) { return '<span class="sg-badge">' + b + '</span>'; }).join('') +
        '</div>' +
        '<div class="sg-table-wrap"><table class="sg-table">' +
          '<thead><tr>' +
            g.cols.map(function(c) { return '<th>' + c + '</th>'; }).join('') +
          '</tr></thead>' +
          '<tbody>' +
            g.rows.map(function(r) {
              return '<tr><td>' + r.size + '</td>' +
                r.vals.map(function(v) { return '<td>' + v + '</td>'; }).join('') +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table></div>' +
        '<div class="sg-measure">' +
          '<p class="sg-measure-title">' + g.measure.title + '</p>' +
          g.measure.lines.map(function(l) {
            return '<p class="sg-measure-line">' + l + '</p>';
          }).join('') +
        '</div>'
      );
    }

    function open(key) {
      content.innerHTML = buildHTML(key);
      overlay.removeAttribute('aria-hidden');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    document.addEventListener('click', function(e) {
      const t = e.target.closest('[data-guide]');
      if (t) { e.preventDefault(); open(t.dataset.guide); }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const t = e.target.closest('[data-guide]');
        if (t) { e.preventDefault(); open(t.dataset.guide); }
      }
    });
  })();

  /* ─── PATTA LIGHTBOX ─── */
  (function () {
    var overlay    = document.getElementById('lbOverlay');
    var imgEl      = document.getElementById('lbImg');
    var prevBtn    = document.getElementById('lbPrev');
    var nextBtn    = document.getElementById('lbNext');
    var closeBtn   = document.getElementById('lbClose');
    var thumbsWrap = document.getElementById('lbThumbs');
    var counter    = document.getElementById('lbCounter');
    var caption    = document.getElementById('lbCaption');

    if (!overlay || !imgEl) return;

    var images          = [];   // [{ src, alt }]
    var currentIndex    = 0;
    var sourceCardThumbs = [];  // .vcard-thumb buttons from the triggering card

    function open(vcard) {
      var mainImg  = vcard.querySelector('.vcard-img');
      var gallery  = vcard.querySelector('.vcard-gallery');
      var thumbBtns = gallery ? gallery.querySelectorAll('.vcard-thumb') : [];

      sourceCardThumbs = Array.prototype.slice.call(thumbBtns);

      if (thumbBtns.length <= 1) {
        images = [{ src: mainImg.src, alt: mainImg.alt }];
        currentIndex = 0;
      } else {
        images = sourceCardThumbs.map(function (btn) {
          var ti = btn.querySelector('img');
          return {
            src: ti ? ti.src : mainImg.src,
            alt: btn.getAttribute('aria-label') || mainImg.alt,
          };
        });
        currentIndex = sourceCardThumbs.findIndex(function (btn) {
          var ti = btn.querySelector('img');
          return ti && ti.src === mainImg.src;
        });
        if (currentIndex < 0) currentIndex = 0;
      }

      renderThumbs();
      showImage(currentIndex, false);

      overlay.removeAttribute('aria-hidden');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function go(idx) {
      var next = (idx + images.length) % images.length;
      showImage(next, true);
      // Sync card state by simulating the thumb click
      if (sourceCardThumbs[next]) {
        sourceCardThumbs[next].click();
      }
    }

    function showImage(idx, animate) {
      currentIndex = idx;

      if (animate) {
        imgEl.style.opacity = '0';
        setTimeout(function () {
          imgEl.src = images[idx].src;
          imgEl.alt = images[idx].alt;
          imgEl.style.opacity = '1';
        }, 160);
      } else {
        imgEl.src = images[idx].src;
        imgEl.alt = images[idx].alt;
      }

      var multi = images.length > 1;
      prevBtn.classList.toggle('lb-hidden', !multi);
      nextBtn.classList.toggle('lb-hidden', !multi);

      counter.textContent = multi ? (idx + 1) + ' / ' + images.length : '';

      var productName = (images[idx].alt || '').replace(' — PattaMansa', '').replace(/\s*·\s*PattaMansa$/, '');
      caption.textContent = productName;

      // Update thumb strip active state
      if (thumbsWrap) {
        thumbsWrap.querySelectorAll('.lb-thumb').forEach(function (btn, i) {
          btn.classList.toggle('active', i === currentIndex);
        });
      }
    }

    function renderThumbs() {
      if (!thumbsWrap) return;
      thumbsWrap.innerHTML = '';
      if (images.length <= 1) return;

      images.forEach(function (item, i) {
        var btn = document.createElement('button');
        btn.className = 'lb-thumb' + (i === currentIndex ? ' active' : '');
        btn.type = 'button';
        btn.setAttribute('role', 'listitem');
        btn.setAttribute('aria-label', 'Ver imagem ' + (i + 1));
        btn.innerHTML = '<img src="' + item.src + '" alt="" loading="lazy">';
        btn.addEventListener('click', function () { go(i); });
        thumbsWrap.appendChild(btn);
      });
    }

    /* ── Event listeners ── */
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { go(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { go(currentIndex + 1); });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   go(currentIndex - 1);
      if (e.key === 'ArrowRight')  go(currentIndex + 1);
    });

    /* ── Trigger: clique na imagem principal do card ── */
    var grid = document.querySelector('.colecao-section');
    if (grid) {
      grid.addEventListener('click', function (e) {
        // Não disparar se o clique foi dentro da galeria de miniaturas
        if (e.target.closest('.vcard-gallery')) return;
        var wrap = e.target.closest('.vcard-img-wrap');
        if (!wrap) return;
        var vcard = wrap.closest('[data-product-card]');
        if (!vcard) return;
        open(vcard);
      });
    }
  })();

  /* ── Sticky CTA Mobile ── */
  (function () {
    var bar = document.getElementById('stickyCta');
    if (!bar || window.innerWidth >= 768) return;

    var hero    = document.querySelector('.hero');
    var vitrine = document.getElementById('selecao-canina');
    var pdvDrw  = document.getElementById('pdvDrawer');
    var cartDrw = document.getElementById('cartDrawer');

    var heroVisible    = true;
    var vitrineVisible = false;
    var productsReached = false;

    function update() {
      var drawersOpen = (pdvDrw && pdvDrw.classList.contains('open')) ||
                        (cartDrw && cartDrw.classList.contains('open'));

      document.body.classList.toggle('hero-cart-hidden', heroVisible || !productsReached);

      if (heroVisible || vitrineVisible || drawersOpen) {
        bar.classList.remove('visible');
      } else {
        bar.style.display = 'block';
        bar.classList.add('visible');
      }
    }

    var heroObs = new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      update();
    }, { threshold: 0.1 });
    if (hero) heroObs.observe(hero);

    var vitrineObs = new IntersectionObserver(function (entries) {
      vitrineVisible = entries[0].isIntersecting;
      if (vitrineVisible) productsReached = true;
      update();
    }, { threshold: 0.15 });
    if (vitrine) vitrineObs.observe(vitrine);

    /* Re-check when drawers open/close */
    document.addEventListener('click', function () {
      setTimeout(update, 50);
    });
  })();