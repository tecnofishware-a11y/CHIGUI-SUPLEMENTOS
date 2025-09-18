(function () {
  'use strict';

  // ---------- Utilidades ----------
  var $doc = $(document);
  var FREE_SHIP_THRESHOLD = 120000;   // envío gratis desde $120.000
  var DEFAULT_SHIP = 9000;            // envío si no hay gratis
  var LOAD_STEP = 12;                 // productos por lote
  var WHATSAPP_PHONE = '573124999533';
  // Variantes por producto (presentaciones y tallas)
  var VARIANTS = {
    // p015 (sí cambia precio por presentación)
    'p015': [
      { key: 'p015-400', label: 'Bote 400 g (133 servicios)', price: 120000 },
      { key: 'p015-150', label: 'Bolsa 150 g (50 servicios)', price: 50000  }, 
    ],

    // ===== ROPA r001–r024 ===== (solo talla)
    'r001': [
      { key: 'r001-M',   label: 'Talla M' },
      { key: 'r001-L',   label: 'Talla L' },
      { key: 'r001-XL',  label: 'Talla XL' },
      { key: 'r001-XXL', label: 'Talla XXL' }
    ],
    'r002': [
      { key: 'r002-SM', label: 'Talla SM' },
      { key: 'r002-ML', label: 'Talla ML' }
    ],

    // r003 (talla única) => sin variantes

    'r004': [
      { key: 'r004-M',   label: 'Talla M' },
      { key: 'r004-L',   label: 'Talla L' },
      { key: 'r004-XL',  label: 'Talla XL' },
      { key: 'r004-XXL', label: 'Talla XXL' }
    ],

    'r005': [
      { key: 'r005-SM', label: 'Talla SM' },
      { key: 'r005-ML', label: 'Talla ML' }
    ],

    'r006': [
      { key: 'r006-SM', label: 'Talla SM' },
      { key: 'r006-ML', label: 'Talla ML' }
    ],

    'r007': [
      { key: 'r007-SM',  label: 'Talla SM'  },
      { key: 'r007-LXL', label: 'Talla LXL' }
    ],

    'r008': [
      { key: 'r008-SM', label: 'Talla SM' },
      { key: 'r008-ML', label: 'Talla ML' }
    ],

    'r009': [
      { key: 'r009-SM', label: 'Talla SM' },
      { key: 'r009-ML', label: 'Talla ML' }
    ],

    'r010': [
      { key: 'r010-S', label: 'Talla S' },
      { key: 'r010-M', label: 'Talla M' },
      { key: 'r010-L', label: 'Talla L' }
    ],

    'r011': [
      { key: 'r011-SM',  label: 'Talla SM'  },
      { key: 'r011-TXL', label: 'Talla TXL' }
    ],

    'r012': [
      { key: 'r012-SM', label: 'Talla SM' },
      { key: 'r012-ML', label: 'Talla ML' }
    ],

    'r013': [
      { key: 'r013-SM',  label: 'Talla SM'  },
      { key: 'r013-LXL', label: 'Talla LXL' }
    ],

    'r014': [
      { key: 'r014-S', label: 'Talla S' },
      { key: 'r014-M', label: 'Talla M' },
      { key: 'r014-L', label: 'Talla L' },
      { key: 'r014-XL',label: 'Talla XL' }
    ],

    'r015r': [
      { key: 'r015r-M',   label: 'Talla M'   },
      { key: 'r015r-L',   label: 'Talla L'   },
      { key: 'r015r-XL',  label: 'Talla XL'  },
      { key: 'r015r-XXL', label: 'Talla XXL' }
    ],

    'r016': [
      { key: 'r016-SM', label: 'Talla SM' },
      { key: 'r016-ML', label: 'Talla ML' }
    ],

    'r017': [
      { key: 'r017-M',   label: 'Talla M'   },
      { key: 'r017-L',   label: 'Talla L'   },
      { key: 'r017-XL',  label: 'Talla XL'  },
      { key: 'r017-XXL', label: 'Talla XXL' }
    ],

    'r022': [
      { key: 'r022-M',   label: 'Talla M'   },
      { key: 'r022-L',   label: 'Talla L'   },
      { key: 'r022-XL',  label: 'Talla XL'  },
      { key: 'r022-XXL', label: 'Talla XXL' }
    ],

    'r023': [
      { key: 'r023-M',   label: 'Talla M'   },
      { key: 'r023-L',   label: 'Talla L'   },
      { key: 'r023-XL',  label: 'Talla XL'  },
      { key: 'r023-XXL', label: 'Talla XXL' }
    ],

    'r024': [
      { key: 'r024-SM',  label: 'Talla SM'  },
      { key: 'r024-LXL', label: 'Talla LXL' }
    ]
  };

  function fmtCOP(n) {
    n = Number(n || 0);
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
    } catch (e) {
      return '$ ' + (n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    }
  }

  function norm(s) {
    s = (s || '').toString().toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(s) {
    s = (s || '').toString();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // ---------- Índice de productos desde el DOM ----------
  var $grid = $('#product-grid');
  var $cards = $grid.find('.product-item');

  var PRODUCTS = $.map($cards, function (el, idx) {
    var $el = $(el);
    var id = $el.data('id');
    var category = norm($el.data('category'));
    var priceDOM = Number($el.data('price')) || 0;
    var titleAttr = $el.data('title');
    var titleDOM = norm($el.find('.card-title').text());
    var img = $el.find('img.product-img').attr('src') || '';
    var desc = norm($el.find('.card-text').text());
    var variants = VARIANTS[id] || null;

    var price = priceDOM;
    if (variants && variants.length && typeof variants[0].price === 'number') {
      price = variants[0].price;
    }

    return {
      id: id,
      category: category,
      price: price,
      title: titleAttr ? norm(titleAttr) : titleDOM,
      titleRaw: titleAttr || $el.find('.card-title').text(),
      img: img,
      desc: desc,
      $el: $el,
      originalIndex: idx,
      variants: variants
    };
  });

  // ---------- Estado UI ----------
  var state = {
    q: '',
    category: 'all',
    sort: 'default',
    showLimit: Math.max(LOAD_STEP, 12)
  };

  // ---------- Carrito ----------
  var CART_KEY = 'chigui_cart_v1';
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  var cart = loadCart(); // { [id]: { id, qty, price, title, img } }

  // ---------- Inicialización ----------
  $(function () {
    initCarouselCategorias();
    bindControls();
    applyFiltersAndRender(false);
    renderCart();
  });

  // ========================================================
  // Carrusel Categorías (con fallback)
  // ========================================================
  function initCarouselCategorias() {
    var $carousel = $('.cat-carousel');
    var $prev = $('.cat-prev');
    var $next = $('.cat-next');

    if ($.fn && $.fn.owlCarousel && $carousel.length) {
      $carousel.owlCarousel({
        loop: false,
        margin: 12,
        dots: false,
        nav: false,
        smartSpeed: 450,
        responsive: {
          0: { items: 2.2 },
          480: { items: 2.6 },
          576: { items: 3.2 },
          768: { items: 4 },
          992: { items: 5 },
          1200: { items: 6 }
        }
      });

      $prev.on('click', function () { $carousel.trigger('prev.owl.carousel'); });
      $next.on('click', function () { $carousel.trigger('next.owl.carousel'); });
    } else {
      var node = $carousel.get(0);
      if (!node) return;
      node.style.overflowX = 'auto';
      node.style.scrollBehavior = 'smooth';
      $prev.on('click', function () { node.scrollLeft -= 260; });
      $next.on('click', function () { node.scrollLeft += 260; });
    }
  }

  // ========================================================
  // Búsqueda / Filtros / Orden
  // ========================================================
  function bindControls() {
    // Búsqueda
    $('#btn-search').on('click', function () {
      state.q = norm($('#product-search').val());
      state.showLimit = Math.max(LOAD_STEP, 12);
      applyFiltersAndRender(false);
    });
    $('#product-search').on('keydown', function (e) {
      if (e.key === 'Enter') {
        state.q = norm($('#product-search').val());
        state.showLimit = Math.max(LOAD_STEP, 12);
        applyFiltersAndRender(false);
      }
    });

    // Orden
    $('#sort-select').on('change', function () {
      state.sort = $(this).val();
      applyFiltersAndRender(true);
    });

    // Categorías
    $doc.on('click', '.cat-item', function (e) {
      e.preventDefault();
      var $it = $(this);
      $('.cat-item').removeClass('is-active');
      $it.addClass('is-active');
      state.category = $it.data('filter') || 'all';
      state.showLimit = Math.max(LOAD_STEP, 12);
      applyFiltersAndRender(false);
    });

    // Cargar más
    $('#load-more').on('click', function () {
      state.showLimit += LOAD_STEP;
      applyFiltersAndRender(true);
    });

    // Quick View
    $doc.on('click', '.quickview-btn', function () {
      var id = $(this).data('id');
      var product = null;
      for (var i = 0; i < PRODUCTS.length; i++) {
        if (PRODUCTS[i].id === id) { product = PRODUCTS[i]; break; }
      }
      if (product) openQuickView(product);
    });
    $('#quickViewModal').on('hidden.bs.modal', function () {
      $('#qv2').empty();
    });

    // Añadir al carrito
    $doc.on('click', '.add-to-cart', function () {
      var id = $(this).data('id');
      var vkey = $(this).data('variant') || null;
      var p = findProduct(id);
      if (p && p.variants && !vkey) {
        // Si el producto tiene variantes y no se eligió, abrimos el Quick View
        openQuickView(p);
        return;
      }
      addToCartById(id, 1, vkey);
    });

    // Carrito: abrir → refrescar
    $('#cartModal').on('show.bs.modal', function () {
      renderCart();
    });

    // Carrito: vaciar
    $('#cart-clear-btn').on('click', function () {
      if (Object.keys(cart).length === 0) return;
      if (!window.confirm('¿Vaciar carrito?')) return;
      for (var k in cart) { if (cart.hasOwnProperty(k)) delete cart[k]; }
      saveCart(cart);
      renderCart();
      updateCartCount();
    });

    // Carrito: +/-
    $('#cart-items')
      .on('click', '.btn-inc', function () {
        var id = $(this).closest('li').data('id');
        addToCartById(id, 1);
      })
      .on('click', '.btn-dec', function () {
        var id = $(this).closest('li').data('id');
        addToCartById(id, -1);
      })
      .on('click', '.btn-remove', function () {
        var id = $(this).closest('li').data('id');
        removeItem(id);
      });

    // Cupón
    $('.coupon-form').on('submit', function (e) {
      e.preventDefault();
      applyCoupon($('#coupon-input').val());
    });

    // Al mostrar modal, construir link WhatsApp
    $('#cartModal').on('shown.bs.modal', function () {
      buildWhatsAppLink();
    });
  }

  function applyFiltersAndRender(keepScroll) {
    // 1) Filtrar
    var q = state.q;
    var cat = norm(state.category || 'all');

    var filtered = [];
    for (var i = 0; i < PRODUCTS.length; i++) {
      var p = PRODUCTS[i];
      var matchCat = (cat === 'all') || norm(p.category) === cat;
      var target = p.title + ' ' + p.desc;
      var matchQ = !q || norm(target).indexOf(q) !== -1;
      if (matchCat && matchQ) filtered.push(p);
    }

    // 2) Ordenar
    var sorted = filtered.slice(0);
    if (state.sort === 'price-asc') {
      sorted.sort(function (a, b) { return a.price - b.price; });
    } else if (state.sort === 'price-desc') {
      sorted.sort(function (a, b) { return b.price - a.price; });
    } else if (state.sort === 'newest') {
      sorted.sort(function (a, b) { return b.originalIndex - a.originalIndex; });
    } else {
      sorted.sort(function (a, b) { return a.originalIndex - b.originalIndex; });
    }

    // 3) Límite (Load more)
    var limit = state.showLimit;
    var toShowIds = {};
    for (var j = 0; j < sorted.length && j < limit; j++) {
      toShowIds[sorted[j].id] = true;
    }

    // 4) Mostrar/ocultar
    for (i = 0; i < PRODUCTS.length; i++) {
      var pr = PRODUCTS[i];
      var isInSorted = false;
      for (j = 0; j < sorted.length; j++) { if (sorted[j].id === pr.id) { isInSorted = true; break; } }
      if (!isInSorted) {
        pr.$el.addClass('d-none');
      } else if (toShowIds[pr.id]) {
        pr.$el.removeClass('d-none');
      } else {
        pr.$el.addClass('d-none');
      }
    }

    // 5) Reordenar DOM
    var frag = document.createDocumentFragment();
    for (i = 0; i < sorted.length; i++) {
      frag.appendChild(sorted[i].$el.get(0));
    }
    $grid.get(0).appendChild(frag);

    // 6) Botón "Cargar más"
    var hasMore = sorted.length > limit;
    $('#load-more').toggleClass('d-none', !hasMore);

    // 7) Scroll opcional
    if (!keepScroll) {
      var top = $grid.offset().top - 120;
      window.scrollTo(0, top < 0 ? 0 : top);
    }
  }

  // ========================================================
  // Quick View
  // ========================================================
  function findProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }
  function getVariant(p, key) {
    if (!p || !p.variants) return null;
    for (var i = 0; i < p.variants.length; i++) if (p.variants[i].key === key) return p.variants[i];
    return null;
  }
  
  function openQuickView(p) {
    var hasVar = p.variants && p.variants.length;
    var variantBlock = '';

    if (hasVar) {
      var vLabelTxt = (p.category === 'ropa' ? 'Talla' : 'Presentación');
      variantBlock += '<div class="qv-variants">';
      variantBlock += '  <label>' + vLabelTxt + '</label>';
      variantBlock += '  <select id="qv-variant">';
      for (var i = 0; i < p.variants.length; i++) {
        var v = p.variants[i];
        var optText = v.label + (typeof v.price === 'number' ? ' - ' + fmtCOP(v.price) : '');
        variantBlock += '    <option value="' + v.key + '">' + optText + '</option>';
      }
      variantBlock += '  </select>';
      variantBlock += '</div>';
    }

    // precio visible inicial
    var initialPrice = p.price;
    if (hasVar && typeof p.variants[0].price === 'number') {
      initialPrice = p.variants[0].price;
    }

    var html = ''
      + '<div class="qv-card">'
      + '  <figure class="qv-media">'
      + '    <img src="' + p.img + '" alt="' + escapeHtml(p.titleRaw) + '">'
      + '  </figure>'
      + '  <div class="qv-info">'
      + '    <h3 class="qv-title">' + escapeHtml(p.titleRaw) + '</h3>'
      + '    <div class="qv-cat"><i class="fa-solid fa-tag"></i> ' + capitalize(p.category) + '</div>'
      +      variantBlock
      + '    <div class="qv-price">' + fmtCOP(initialPrice) + '</div>'
      + '    <p class="qv-desc">' + (p.desc ? (p.desc.charAt(0).toUpperCase() + p.desc.slice(1)) : '—') + '</p>'
      + '    <div class="qv-actions">'
      + '      <button id="qv-add" class="btn btn-primary add-to-cart" data-id="' + p.id + '"><i class="fas fa-cart-plus"></i> Añadir al carrito</button>'
      + '      <button class="btn btn-ghost" data-dismiss="modal">Seguir mirando</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    $('#qv2').html(html);
    $('#quickViewModal').modal('show');

    if (hasVar) {
      var $sel = $('#qv-variant');
      var $price = $('#quickViewModal .qv-price');
      var $btn = $('#qv-add');

      function _syncVariant() {
        var vkey = $sel.val();
        var v = getVariant(p, vkey) || p.variants[0];
        var showPrice = (v && typeof v.price === 'number') ? v.price : p.price; // usa precio del producto si la variante no trae
        $price.text(fmtCOP(showPrice));
        $btn.attr('data-variant', v.key);
      }
      _syncVariant();
      $sel.on('change', _syncVariant);
    }
  }
  
  // ========================================================
  // Carrito
  // ========================================================
  function addToCartById(id, deltaQty, variantKey) {
    var idKey = variantKey || id;                 // cada talla es una línea separada
    var qtyDelta = (deltaQty || 1);

    if (cart[idKey]) {
      cart[idKey].qty = Math.max(0, (cart[idKey].qty || 0) + qtyDelta);
      if (cart[idKey].qty === 0) delete cart[idKey];
      saveCart(cart); updateCartCount(); renderCart();
      return;
    }

    var base = findProduct(id);
    if (!base) return;

    var price = base.price;                       
    var titleFull = base.titleRaw;
    var img = base.img;

    if (variantKey && base.variants) {
      var v = getVariant(base, variantKey);
      if (v) {
        titleFull = base.titleRaw + ' — ' + v.label; 
        if (typeof v.price === 'number') price = v.price; 
      }
    }

    cart[idKey] = {
      id: idKey, baseId: id, variant: variantKey || null,
      qty: Math.max(1, qtyDelta),
      price: price, title: titleFull, img: img
    };

    saveCart(cart); updateCartCount(); renderCart();
  }

  function removeItem(id) {
    if (cart[id]) { delete cart[id]; saveCart(cart); updateCartCount(); renderCart(); }
  }

  function updateCartCount() {
    var items = Object.values ? Object.values(cart) : $.map(cart, function (v) { return v; });
    var count = 0;
    for (var i = 0; i < items.length; i++) count += (items[i].qty || 0);
    $('#cart-count').text(count);
  }

  function evaluateCoupon(code, subtotal) {
    var discount = 0;
    var discountLabel = '—';
    var freeShipOverride = false;
    code = (code || '').toUpperCase();

    if (code === 'CHIGUI10') {
      discount = Math.round(subtotal * 0.10);
      discountLabel = '10% OFF';
    } else if (code === 'ENVIOFREE') {
      freeShipOverride = true;
      discountLabel = 'Envío GRATIS';
    } else if (code === 'BIENVENIDA5') {
      discount = Math.round(subtotal * 0.05);
      discountLabel = '5% bienvenida';
    } else if (code === 'CHIGUI5K') {
      discount = Math.min(subtotal, 5000);
      discountLabel = '$5.000 OFF';
    }
    return { discount: discount, discountLabel: discountLabel, freeShipOverride: freeShipOverride };
  }

  function computeTotals() {
    var items = Object.values ? Object.values(cart) : $.map(cart, function (v) { return v; });
    var subtotal = 0;
    for (var i = 0; i < items.length; i++) subtotal += (items[i].price * items[i].qty);

    var couponCode = (norm($('#coupon-input').val()) || '').toUpperCase();
    var evalRes = evaluateCoupon(couponCode, subtotal);
    var discount = evalRes.discount;
    var discountLabel = evalRes.discountLabel;
    var freeShipOverride = evalRes.freeShipOverride;

    var shipping = 0;
    var freeShip = false;

    if (freeShipOverride) {
      shipping = 0; freeShip = true;
    } else if (subtotal >= FREE_SHIP_THRESHOLD) {
      shipping = 0; freeShip = true;
    } else {
      shipping = items.length ? DEFAULT_SHIP : 0;
    }

    var total = Math.max(0, subtotal - discount) + shipping;

    return { items: items, subtotal: subtotal, discount: discount, discountLabel: discountLabel, shipping: shipping, total: total, freeShip: freeShip };
  }

  function renderCart() {
    var $items = $('#cart-items');
    var $empty = $('#cart-empty');
    var $disc = $('#disc-amount');
    var $sub = $('#sub-amount');
    var $ship = $('#ship-amount');
    var $total = $('#cart-total');

    var r = computeTotals();
    var items = r.items, subtotal = r.subtotal, discount = r.discount, discountLabel = r.discountLabel, shipping = r.shipping, total = r.total, freeShip = r.freeShip;

    // Lista
    if (!items.length) {
      $items.empty();
      $empty.show();
    } else {
      $empty.hide();
      var lis = [];
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        lis.push(
          '<li class="list-group-item d-flex align-items-center" data-id="' + it.id + '">'
          + '<img src="' + it.img + '" alt="' + escapeHtml(it.title) + '" style="width:56px;height:56px;object-fit:cover;border-radius:10px;margin-right:12px;">'
          + '<div class="flex-grow-1">'
          + '  <div style="font-weight:700;">' + escapeHtml(it.title) + '</div>'
          + '  <div class="text-muted" style="font-size:.9rem;">' + fmtCOP(it.price) + '</div>'
          + '  <div class="d-flex align-items-center mt-1">'
          + '    <button class="btn btn-sm btn-outline-secondary btn-dec" title="Restar" aria-label="Restar">−</button>'
          + '    <span class="mx-2" aria-live="polite">' + it.qty + '</span>'
          + '    <button class="btn btn-sm btn-outline-secondary btn-inc" title="Sumar" aria-label="Sumar">+</button>'
          + '    <button class="btn btn-sm btn-outline-danger ml-3 btn-remove" title="Eliminar">Eliminar</button>'
          + '  </div>'
          + '</div>'
          + '<div style="font-weight:700;">' + fmtCOP(it.qty * it.price) + '</div>'
          + '</li>'
        );
      }
      $items.html(lis.join(''));
    }

    // Totales
    $sub.text(items.length ? fmtCOP(subtotal) : '—');

    if (discount > 0) {
      $disc.html(fmtCOP(discount) + ' <span class="text-muted" style="font-size:.85rem;">(' + discountLabel + ')</span>');
    } else {
      $disc.text('—');
    }

    if (!items.length) {
      $ship.text('—');
    } else {
      $ship.html(shipping === 0 ? '<span class="text-success">GRATIS</span>' : fmtCOP(shipping));
    }

    $total.text(fmtCOP(total));

    updateShipBar(subtotal, freeShip);
    $('#coupon-feedback').text(discount > 0 ? ('Cupón aplicado: ' + discountLabel) : '');

    buildWhatsAppLink();
  }

  function updateShipBar(subtotal, freeShip) {
    var $bar = $('#ship-progress span');
    var $txt = $('#ship-text');

    var pct = Math.max(0, Math.min(100, Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100)));
    $bar.css('width', pct + '%');

    if (!subtotal) { $txt.text('Empieza tu pedido para ver el envío gratis.'); return; }
    if (freeShip) { $txt.text('¡Tienes envío GRATIS!'); return; }

    var faltan = FREE_SHIP_THRESHOLD - subtotal;
    $txt.html('Te faltan <strong>' + fmtCOP(faltan) + '</strong> para envío <strong>GRATIS</strong>.');
  }

  // ========================================================
  // Cupones
  // ========================================================
  function applyCoupon(raw) {
    var code = (raw || '').toString().trim();
    if (!code) { $('#coupon-feedback').text('Ingresa un cupón.'); return; }

    var before = computeTotals();
    var res = evaluateCoupon(code, before.subtotal);

    if (res.discount > 0 || /ENVIOFREE/i.test(code)) {
      $('#coupon-feedback').text('Cupón aplicado: ' + res.discountLabel);
    } else {
      $('#coupon-feedback').text('Cupón inválido.');
    }
    renderCart();
  }

  // ========================================================
  // WhatsApp Checkout
  // ========================================================
  function buildWhatsAppLink() {
    var r = computeTotals();
    var items = r.items, subtotal = r.subtotal, discount = r.discount, shipping = r.shipping, total = r.total, freeShip = r.freeShip;

    if (!items.length) {
      $('#checkout-whatsapp').attr('href', '#');
      return;
    }

    var lines = [];
    lines.push('Hola CHIGUI, quiero hacer este pedido:');
    lines.push('');
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      lines.push((i + 1) + '. ' + it.title + ' x' + it.qty + ' - ' + fmtCOP(it.price * it.qty));
    }
    lines.push('');
    lines.push('Subtotal: ' + fmtCOP(subtotal));
    if (discount > 0) lines.push('Descuento: -' + fmtCOP(discount));
    lines.push('Envío: ' + (shipping === 0 ? 'GRATIS' : fmtCOP(shipping)));
    lines.push('Total: ' + fmtCOP(total));
    if (freeShip) lines.push('✅ Aplica envío GRATIS');

    var text = encodeURIComponent(lines.join('\n'));
    var url = 'https://wa.me/' + WHATSAPP_PHONE + '?text=' + text;
    $('#checkout-whatsapp').attr('href', url);
  }

  // ---------- Estética rápida (pulse carrito) ----------
  var pulseCss = '#cart-button.pulse { transform: translateY(-1px) scale(1.04); box-shadow: 0 12px 26px rgba(196,155,99,.35); }';
  $('<style/>').text(pulseCss).appendTo(document.head);

})();