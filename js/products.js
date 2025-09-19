/* =========================================================
   CHIGUI – Productos (JS)
   Búsqueda, filtros, QuickView, carrito, WhatsApp y BackToTop
========================================================= */
(function ($) {
  'use strict';

  /* -------------------- Constantes -------------------- */
  var WHATSAPP_PHONE       = '573124999533';
  var FREE_SHIP_THRESHOLD  = 120000;     // envío gratis desde
  var SHIPPING_COST        = 12000;      // costo de envío por defecto
  var LOAD_STEP            = 12;         // cuántos ítems por “cargar más”
  var CART_KEY             = 'chigui.cart.v1';
  var DID_FIRST_PAINT      = false;

  /* -------------------- Helpers -------------------- */
  function norm(str) {
    return (str || '')
      .toString()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function fmtCOP(n) {
    var num = Number(n) || 0;
    return '$ ' + num.toLocaleString('es-CO');
  }
  function escapeHtml(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function capitalize(s){ s = (s||'').toString(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* -------------------- Variantes -------------------- */
  // Solo p015 maneja precio por variante; ropa solo talla (sin price).
  var VARIANTS = {
    'p015': [
      { key: 'p015-400', label: 'Bote 400 g (133 servicios)', price: 120000 },
      { key: 'p015-150', label: 'Bolsa 150 g (50 servicios)' } // usa precio base del producto
    ],

    // ===== ROPA (solo talla) =====
    'r001': [{key:'r001-M',label:'Talla M'},{key:'r001-L',label:'Talla L'},{key:'r001-XL',label:'Talla XL'},{key:'r001-XXL',label:'Talla XXL'}],
    'r002': [{key:'r002-SM',label:'Talla SM'},{key:'r002-ML',label:'Talla ML'}],
    'r004': [{key:'r004-M',label:'Talla M'},{key:'r004-L',label:'Talla L'},{key:'r004-XL',label:'Talla XL'},{key:'r004-XXL',label:'Talla XXL'}],
    'r005': [{key:'r005-SM',label:'Talla SM'},{key:'r005-ML',label:'Talla ML'}],
    'r006': [{key:'r006-SM',label:'Talla SM'},{key:'r006-ML',label:'Talla ML'}],
    'r007': [{key:'r007-SM',label:'Talla SM'},{key:'r007-LXL',label:'Talla LXL'}],
    'r008': [{key:'r008-SM',label:'Talla SM'},{key:'r008-ML',label:'Talla ML'}],
    'r009': [{key:'r009-SM',label:'Talla SM'},{key:'r009-ML',label:'Talla ML'}],
    'r010': [{key:'r010-S',label:'Talla S'},{key:'r010-M',label:'Talla M'},{key:'r010-L',label:'Talla L'}],
    'r011': [{key:'r011-SM',label:'Talla SM'},{key:'r011-TXL',label:'Talla TXL'}],
    'r012': [{key:'r012-SM',label:'Talla SM'},{key:'r012-ML',label:'Talla ML'}],
    'r013': [{key:'r013-SM',label:'Talla SM'},{key:'r013-LXL',label:'Talla LXL'}],
    'r014': [{key:'r014-S',label:'Talla S'},{key:'r014-M',label:'Talla M'},{key:'r014-L',label:'Talla L'},{key:'r014-XL',label:'Talla XL'}],
    'r015r':[{key:'r015r-M',label:'Talla M'},{key:'r015r-L',label:'Talla L'},{key:'r015r-XL',label:'Talla XL'},{key:'r015r-XXL',label:'Talla XXL'}],
    'r016': [{key:'r016-SM',label:'Talla SM'},{key:'r016-ML',label:'Talla ML'}],
    'r017': [{key:'r017-M',label:'Talla M'},{key:'r017-L',label:'Talla L'},{key:'r017-XL',label:'Talla XL'},{key:'r017-XXL',label:'Talla XXL'}],
    'r022': [{key:'r022-M',label:'Talla M'},{key:'r022-L',label:'Talla L'},{key:'r022-XL',label:'Talla XL'},{key:'r022-XXL',label:'Talla XXL'}],
    'r023': [{key:'r023-M',label:'Talla M'},{key:'r023-L',label:'Talla L'},{key:'r023-XL',label:'Talla XL'},{key:'r023-XXL',label:'Talla XXL'}],
    'r024': [{key:'r024-SM',label:'Talla SM'},{key:'r024-LXL',label:'Talla LXL'}]
  };

  function getVariant(prod, vKey){
    if (!prod || !prod.variants) return null;
    for (var i=0;i<prod.variants.length;i++){ if (prod.variants[i].key === vKey) return prod.variants[i]; }
    return null;
  }

  /* -------------------- Productos desde el DOM -------------------- */
  var $cards = $('#product-grid .product-item');

  // Si no encuentra tarjetas, no hacemos nada para evitar "no hay resultados" por error de carga.
  if (!$cards.length) { console.warn('CHIGUI: no se encontraron .product-item'); return; }

  var PRODUCTS = $.map($cards, function (el, idx) {
    var $el = $(el);
    var id = $el.data('id');
    var category = norm($el.data('category')) || 'otros';
    var priceDOM = Number($el.data('price')) || 0;
    var titleAttr = $el.data('title');
    var titleText = titleAttr ? titleAttr : $el.find('.card-title').text();
    var img = $el.find('img.product-img').attr('src') || '';
    var desc = $el.find('.card-text').text();
    var variants = VARIANTS[id] || null;

    // Precio base: usa el de la 1ª variante SOLO si esa variante trae price
    var basePrice = priceDOM;
    if (variants && variants.length && typeof variants[0].price === 'number') {
      basePrice = variants[0].price;
    }

    return {
      id: id,
      category: category,
      price: basePrice,
      title: norm(titleText),
      titleRaw: titleText,
      img: img,
      desc: norm(desc),
      $el: $el,
      originalIndex: idx,
      variants: variants
    };
  });

  function findProduct(id){
    for (var i=0;i<PRODUCTS.length;i++){ if (PRODUCTS[i].id === id) return PRODUCTS[i]; }
    return null;
  }

  /* -------------------- Estado UI -------------------- */
  var state = {
    q: '',
    category: 'all',
    sort: 'default',
    showLimit: LOAD_STEP
  };

  /* -------------------- Carrito -------------------- */
  var cart = loadCart();
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '{}'); }
    catch(_) { return {}; }
  }
  function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c || cart)); }
  function updateCartCount(){
    var n = 0, k;
    for (k in cart) if (cart.hasOwnProperty(k)) n += (cart[k].qty||0);
    $('#cart-count').text(n);
  }

  function addToCartById(id, deltaQty, variantKey) {
    var idKey   = variantKey || id;
    var qtyPlus = (deltaQty || 1);

    if (cart[idKey]) {
      cart[idKey].qty = Math.max(0, (cart[idKey].qty||0) + qtyPlus);
      if (cart[idKey].qty === 0) delete cart[idKey];
      saveCart(cart); updateCartCount(); renderCart();
      return;
    }

    var base = findProduct(id);
    if (!base) return;

    var price = base.price;
    var titleFull = base.titleRaw;
    if (variantKey && base.variants) {
      var v = getVariant(base, variantKey);
      if (v) {
        titleFull = base.titleRaw + ' — ' + v.label;             // añade talla/presentación
        if (typeof v.price === 'number') price = v.price;        // respeta precio solo si la variante lo define
      }
    }

    cart[idKey] = {
      id: idKey,
      baseId: id,
      variant: variantKey || null,
      qty: Math.max(1, qtyPlus),
      price: price,
      title: titleFull,
      img: base.img
    };
    saveCart(cart); updateCartCount(); renderCart();
  }

  /* -------------------- Cupones -------------------- */
  var COUPONS = {
    'CHIGUI10': { kind:'pct', value:10,  label:'10% de descuento' },
    'CHIGUI20': { kind:'pct', value:20,  label:'20% de descuento' },
    'ENVIOFREE':{ kind:'ship',value:1,   label:'Envío gratis' }
  };
  var APPLIED_COUPON = '';

  function evaluateCoupon(code, subtotal) {
    var c = COUPONS[code] || null;
    var discount = 0, freeShip = false, label = '';

    if (c) {
      if (c.kind === 'pct') {
        discount = Math.max(0, Math.round(subtotal * (c.value/100)));
        label = c.label;
      } else if (c.kind === 'ship') {
        freeShip = true;
        label = c.label;
      }
    }
    return { discount: discount, freeShip: freeShip, discountLabel: label };
  }

  function computeTotals(){
    var items = [];
    var k, sub = 0;
    for (k in cart) if (cart.hasOwnProperty(k)) {
      var it = cart[k];
      items.push(it);
      sub += (it.price || 0) * (it.qty || 0);
    }
    var code = APPLIED_COUPON ? APPLIED_COUPON.toUpperCase().trim() : '';
    var ev = evaluateCoupon(code, sub);
    var discount = ev.discount || 0;
    var subAfter = Math.max(0, sub - discount);

    var freeShip = (items.length>0) && (subAfter >= FREE_SHIP_THRESHOLD || ev.freeShip);
    var shipping = (items.length === 0) ? 0 : (freeShip ? 0 : SHIPPING_COST);
    var total = subAfter + shipping;

    return {
      items: items,
      subtotal: sub,
      discount: discount,
      discountLabel: ev.discountLabel,
      shipping: shipping,
      total: total,
      freeShip: freeShip
    };
  }

  /* -------------------- Render Carrito -------------------- */
  function renderCart(){
    var $list  = $('#cart-items');
    var $empty = $('#cart-empty');
    var $sub   = $('#sub-amount');
    var $disc  = $('#disc-amount');
    var $ship  = $('#ship-amount');
    var $total = $('#cart-total');

    var data = computeTotals();

    // Items
    $list.empty();
    if (!data.items.length) {
      $empty.show();
    } else {
      $empty.hide();
      data.items.forEach(function(it) {
        var li = [
          '<li class="list-group-item d-flex align-items-center justify-content-between">',
            '<div class="d-flex align-items-center" style="gap:10px">',
              (it.img ? '<img src="'+it.img+'" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px">' : ''),
              '<div>',
                '<div style="font-weight:700">'+escapeHtml(it.title)+'</div>',
                '<div class="text-muted" style="font-size:.9rem">'+fmtCOP(it.price)+' × '+it.qty+'</div>',
              '</div>',
            '</div>',
            '<div class="btn-group btn-group-sm">',
              '<button class="btn btn-outline-secondary cart-minus" data-id="'+it.id+'">−</button>',
              '<span class="btn btn-light disabled">'+it.qty+'</span>',
              '<button class="btn btn-outline-secondary cart-plus" data-id="'+it.id+'">+</button>',
              '<button class="btn btn-outline-danger cart-remove" data-id="'+it.id+'">&times;</button>',
            '</div>',
          '</li>'
        ].join('');
        $list.append(li);
      });
    }

    // Totales
    $sub.text(data.items.length ? fmtCOP(data.subtotal) : '—');

    if (data.discount > 0) {
      $disc.html(fmtCOP(data.discount)+' <span class="text-muted" style="font-size:.85rem">('+escapeHtml(data.discountLabel)+')</span>');
    } else {
      $disc.text('—');
    }

    if (!data.items.length) {
      $ship.text('—');
    } else {
      $ship.html(data.shipping === 0 ? '<span class="text-success">GRATIS</span>' : fmtCOP(data.shipping));
    }
    $total.text(fmtCOP(data.total));

    updateShipBar(data.subtotal, data.freeShip);
    buildWhatsAppLink();
  }

  /* -------------------- Progreso Envío -------------------- */
  function updateShipBar(subtotal, freeShip){
    var $bar = $('#ship-progress span');
    var $txt = $('#ship-text');

    var pct = Math.max(0, Math.min(100, Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100)));
    $bar.css('width', pct + '%');

    if (!subtotal) {
      $txt.text('Empieza tu pedido para ver el envío gratis.');
      return;
    }
    if (freeShip) {
      $txt.text('¡Tienes envío GRATIS!');
      return;
    }
    var faltan = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
    $txt.html('Te faltan <strong>'+fmtCOP(faltan)+'</strong> para envío <strong>GRATIS</strong>.');
  }

  /* -------------------- WhatsApp -------------------- */
  function buildWhatsAppLink(){
    var data = computeTotals();
    var $a = $('#checkout-whatsapp');

    if (!data.items.length) { $a.attr('href', '#'); return; }

    var lines = [];
    lines.push('Hola CHIGUI, quiero hacer este pedido:');
    lines.push('');
    data.items.forEach(function(it, i){
      lines.push((i+1)+'. '+it.title+' ×'+it.qty+' — '+fmtCOP(it.price * it.qty));
    });
    lines.push('');
    lines.push('Subtotal: '+fmtCOP(data.subtotal));
    if (data.discount > 0) lines.push('Descuento: -'+fmtCOP(data.discount));
    lines.push('Envío: '+(data.shipping===0 ? 'GRATIS' : fmtCOP(data.shipping)));
    lines.push('Total: '+fmtCOP(data.total));
    if (data.freeShip) lines.push('✅ Aplica envío GRATIS');

    var text = encodeURIComponent(lines.join('\n'));
    var url  = 'https://wa.me/'+WHATSAPP_PHONE+'?text='+text;
    $a.attr('href', url);
  }

  /* -------------------- Quick View -------------------- */
  var CURRENT_QV_ID = null;

  function openQuickView(p) {
    if (!p) return;
    CURRENT_QV_ID = p.id;

    var hasVar = p.variants && p.variants.length;
    var variantBlock = '';

    if (hasVar) {
      var labelTxt = (p.category === 'ropa' ? 'Talla' : 'Presentación');
      variantBlock += '<div class="qv-variants">';
      variantBlock += '  <label>'+labelTxt+'</label>';
      variantBlock += '  <select id="qv-variant">';
      for (var i=0;i<p.variants.length;i++){
        var v = p.variants[i];
        var txt = v.label + (typeof v.price === 'number' ? ' - '+fmtCOP(v.price) : '');
        variantBlock += '    <option value="'+v.key+'">'+txt+'</option>';
      }
      variantBlock += '  </select>';
      variantBlock += '</div>';
    }

    // precio inicial visible
    var visiblePrice = p.price;
    if (hasVar && typeof p.variants[0].price === 'number') visiblePrice = p.variants[0].price;

    var html = ''
      + '<div class="qv-card">'
      + '  <figure class="qv-media"><img src="'+p.img+'" alt="'+escapeHtml(p.titleRaw)+'"></figure>'
      + '  <div class="qv-info">'
      + '    <h3 class="qv-title">'+escapeHtml(p.titleRaw)+'</h3>'
      + '    <div class="qv-cat"><i class="fa-solid fa-tag"></i> '+capitalize(p.category)+'</div>'
      +        variantBlock
      + '    <div class="qv-price">'+fmtCOP(visiblePrice)+'</div>'
      + '    <p class="qv-desc">'+(p.desc ? (p.desc.charAt(0).toUpperCase()+p.desc.slice(1)) : '—')+'</p>'
      + '    <div class="qv-actions">'
      + '      <button id="qv-add" class="btn btn-primary"><i class="fas fa-cart-plus"></i> Añadir al carrito</button>'
      + '      <button class="btn btn-ghost" data-dismiss="modal">Seguir mirando</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    $('#qv2').html(html);
    $('#quickViewModal').modal('show');

    if (hasVar) {
      var $sel = $('#qv-variant');
      var $price = $('#quickViewModal .qv-price');
      function sync(){
        var v = getVariant(p, $sel.val()) || p.variants[0];
        var show = (v && typeof v.price === 'number') ? v.price : p.price;
        $price.text(fmtCOP(show));
      }
      sync();
      $sel.on('change', sync);
    }
  }

  /* -------------------- Filtros y render -------------------- */
  function scrollToGrid(){
    var grid = document.getElementById('product-grid');
    if (!grid) return;
    var y = grid.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function applyFiltersAndRender(keepScroll) {
    var q = norm(state.q);
    var cat = norm(state.category || 'all');

    // 1) filtrar
    var filtered = PRODUCTS.filter(function(p){
      var matchCat = (cat === 'all') || (norm(p.category) === cat);
      var target = p.title + ' ' + p.desc; // ya vienen normalizados
      var matchQ = (!q) || target.indexOf(q) !== -1;
      return matchCat && matchQ;
    });

    // fallback: si por alguna razón quedó vacío en el primer paint, muestra todos
    if (!DID_FIRST_PAINT && (!filtered || !filtered.length)) {
      filtered = PRODUCTS.slice();
    }

    // 2) ordenar
    if (state.sort === 'price-asc') {
      filtered.sort(function(a,b){ return a.price - b.price; });
    } else if (state.sort === 'price-desc') {
      filtered.sort(function(a,b){ return b.price - a.price; });
    } else {
      filtered.sort(function(a,b){ return a.originalIndex - b.originalIndex; });
    }

    // 3) mostrar/ocultar según límite
    var limit = state.showLimit;
    PRODUCTS.forEach(function(p){ p.$el.hide(); });
    filtered.slice(0, limit).forEach(function(p){ p.$el.show(); });

    // 4) botón “cargar más”
    if (filtered.length > limit) $('#load-more').show(); else $('#load-more').hide();

    // primer render: no desplazarse
    if (!DID_FIRST_PAINT && typeof keepScroll === 'undefined') keepScroll = true;
    if (!keepScroll) scrollToGrid();
    DID_FIRST_PAINT = true;
  }

  /* -------------------- Eventos UI -------------------- */
  // Search
  $('#btn-search').on('click', function(){
    state.q = $('#product-search').val();
    state.showLimit = LOAD_STEP;
    applyFiltersAndRender(false);
  });
  $('#product-search').on('keydown', function(e){
    if (e.key === 'Enter') { e.preventDefault(); $('#btn-search').click(); }
  });

  // Sort
  $('#sort-select').on('change', function(){
    state.sort = $(this).val();
    state.showLimit = LOAD_STEP;
    applyFiltersAndRender(false);
  });

  // Categorías (carousel)
  $('.cat-item').on('click', function(){
    $('.cat-item').removeClass('is-active');
    $(this).addClass('is-active');
    state.category = $(this).data('filter') || 'all';
    state.showLimit = LOAD_STEP;
    applyFiltersAndRender(false);
  });

  // Cargar más (sin mover la página)
  $('#load-more').on('click', function (e) {
    e.preventDefault();
    state.showLimit += LOAD_STEP;
    applyFiltersAndRender(true); // NO hacer scroll
  });

  // QuickView
  $(document).on('click', '.quickview-btn', function(){
    var id = $(this).data('id');
    openQuickView(findProduct(id));
  });

  // Añadir desde overlay: si tiene variantes → abrir QuickView
  $(document).on('click', '.add-to-cart', function(){
    var id = $(this).data('id');
    var p = findProduct(id);
    if (p && p.variants && p.variants.length) {
      openQuickView(p);
    } else {
      addToCartById(id, 1, null);
    }
  });

  // Añadir desde QuickView
  $(document).on('click', '#qv-add', function(){
    var id = CURRENT_QV_ID;
    if (!id) return;
    var vkey = $('#qv-variant').length ? $('#qv-variant').val() : null;
    addToCartById(id, 1, vkey);
    $('#quickViewModal').modal('hide');
  });

  // Cart controls
  $(document).on('click', '.cart-plus', function(){ addToCartById($(this).data('id'), +1); });
  $(document).on('click', '.cart-minus', function(){ addToCartById($(this).data('id'), -1); });
  $(document).on('click', '.cart-remove', function(){
    var id = $(this).data('id');
    var current = cart[id] ? cart[id].qty : 0;
    addToCartById(id, -current);
  });

  // Vaciar carrito
  $('#cart-clear-btn').on('click', function(){
    cart = {}; saveCart(cart); updateCartCount(); renderCart();
  });

  // Cupones
  $('.coupon-form').on('submit', function(e){
    e.preventDefault();
    var raw = $('#coupon-input').val();
    APPLIED_COUPON = norm(raw).toUpperCase();
    var before = computeTotals();
    var ev = evaluateCoupon(APPLIED_COUPON, before.subtotal);
    if (ev.discount > 0 || ev.freeShip) {
      $('#coupon-feedback').text('Cupón aplicado: '+(ev.discountLabel || APPLIED_COUPON));
    } else {
      $('#coupon-feedback').text('Cupón inválido.');
    }
    renderCart();
  });

  /* -------------------- Back to Top -------------------- */
  (function backToTopInit () {
    // 1) Inyecta el botón si no existe
    if (!$('.back-to-top').length) {
      $('body').append(
        '<a href="#" class="btn btn-lg btn-primary btn-lg-square back-to-top" aria-label="Volver arriba">' +
          '<i class="fa fa-angle-double-up"></i>' +
        '</a>'
      );
    }

    // 2) Posiciona el botón por encima del WhatsApp
    function positionBackToTop () {
      var $btn = $('.back-to-top');
      if (!$btn.length) return;
      var $wa  = $('#whatsapp-float');

      var gap   = 12;                         // separación entre ambos
      var right = 18;                         // alineado con WhatsApp
      var bottom = 30;                        // valor por defecto si no hay WhatsApp

      if ($wa.length && $wa.is(':visible')) {
        var waH = $wa.outerHeight() || 56;   // alto del botón de WhatsApp
        var waB = parseInt($wa.css('bottom'), 10); if (isNaN(waB)) waB = 18;
        var waR = parseInt($wa.css('right'), 10);  if (isNaN(waR)) waR = 18;
        bottom = waB + waH + gap;            // coloca el back-to-top encima del WhatsApp
        right  = waR;
      }
      $btn.css({ right: right + 'px', bottom: bottom + 'px', zIndex: 1062 });
    }

    // 3) Mostrar/ocultar con el scroll
    $(window).on('scroll.backToTop', function () {
      if ($(this).scrollTop() > 120) {
        $('.back-to-top').stop(true, true).fadeIn('fast');
      } else {
        $('.back-to-top').stop(true, true).fadeOut('fast');
      }
    });

    // 4) Click → subir arriba (con fallback de easing)
    $(document).on('click', '.back-to-top', function (e) {
      e.preventDefault();
      var easing = ($.easing && $.easing['easeInOutExpo']) ? 'easeInOutExpo' : 'swing';
      $('html, body').stop().animate({ scrollTop: 0 }, 800, easing);
    });

    // 5) Reposicionar en resize y al iniciar
    $(window).on('resize.backToTop', positionBackToTop);
    positionBackToTop();
  })();

  /* -------------------- Owl Carousel (categorías) -------------------- */
  if ($.fn.owlCarousel && $('.cat-carousel').length) {
    var $owl = $('.cat-carousel').owlCarousel({
      loop:false, dots:false, nav:false, margin:8, autoWidth:true,
      responsive:{0:{items:2},576:{items:3},768:{items:4},992:{items:5}}
    });
    $('.cat-prev').on('click', function(){ $owl.trigger('prev.owl.carousel'); });
    $('.cat-next').on('click', function(){ $owl.trigger('next.owl.carousel'); });
  }

  /* -------------------- Inicialización -------------------- */
  // Evitar desplazamiento inicial por focus
  (function () {
    var ps = document.getElementById('product-search');
    if (!ps) return;
    try { ps.focus({ preventScroll: true }); } catch(_) { /* no-op */ }
  })();

  // Limpia hash #product-grid si viniera en la URL
  if (location.hash === '#product-grid' && history.replaceState) {
    history.replaceState(null, document.title, location.pathname + location.search);
  }

  updateCartCount();
  renderCart();
  applyFiltersAndRender(true); // primer pintado sin scroll

})(jQuery);