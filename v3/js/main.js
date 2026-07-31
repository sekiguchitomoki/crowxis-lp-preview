/* ============================================================
   Crowxis LP  scripts (fullpage edition)
============================================================ */
(function(){
  'use strict';

  var qaFinal = /[?&]final/.test(location.href);
  var screenParam = (location.href.match(/[?&]screen=(\d)/) || [])[1];

  /* ---------- text splitter ---------- */
  document.querySelectorAll('.split').forEach(function(el){
    var stagger = parseFloat(el.dataset.stagger || '.06');
    var base    = parseFloat(el.dataset.base || '0');
    var text = el.textContent;
    el.textContent = '';
    Array.prototype.forEach.call(text, function(c, i){
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? ' ' : c;
      s.style.animationDelay = (base + i * stagger) + 's';
      el.appendChild(s);
    });
  });

  /* ============================================================
     筆 : 各画面が独立した「一筆」を全画面に描く
     - arc  : キービジュアルの太い弧（brush_arc.png）を一筆で払う
     - ring : 3枚回転合成の円相を一筆で描き切る
     入場のたびに 0 から描き直す（画面ごとに方向はさまざま）
  ============================================================ */
  var NS = 'http://www.w3.org/2000/svg';
  var CX = 440, CY = 60;                 // 素材座標系での円弧中心
  var brushes = {};                      // sectionId -> {path,len,reverse,raf}
  document.querySelectorAll('[data-brush]').forEach(function(host, idx){
    var shape = host.dataset.shape;
    var svg = document.createElementNS(NS, 'svg');
    var defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);

    // エッジフェード（画像境界の直線を溶かす）
    var edgeMaskId = null;
    if('edgefade' in host.dataset){
      var ef = document.createElementNS(NS, 'filter');
      ef.setAttribute('id','bEF' + idx);ef.setAttribute('x','-30%');ef.setAttribute('y','-30%');
      ef.setAttribute('width','160%');ef.setAttribute('height','160%');
      var efb = document.createElementNS(NS, 'feGaussianBlur');
      efb.setAttribute('stdDeviation','26');ef.appendChild(efb);
      defs.appendChild(ef);
      var em = document.createElementNS(NS, 'mask');
      em.setAttribute('id','bEM' + idx);em.setAttribute('maskUnits','userSpaceOnUse');
      em.setAttribute('x','-100');em.setAttribute('y','-100');
      em.setAttribute('width','1300');em.setAttribute('height','1000');
      var er = document.createElementNS(NS, 'rect');
      er.setAttribute('x','45');er.setAttribute('y','45');
      er.setAttribute('width','1010');er.setAttribute('height','688');
      er.setAttribute('fill','white');er.setAttribute('filter','url(#bEF' + idx + ')');
      em.appendChild(er);defs.appendChild(em);
      edgeMaskId = 'bEM' + idx;
    }

    // ワイプ用ブラー
    var wb = document.createElementNS(NS, 'filter');
    wb.setAttribute('id','bWB' + idx);wb.setAttribute('x','-30%');wb.setAttribute('y','-30%');
    wb.setAttribute('width','160%');wb.setAttribute('height','160%');
    var wbb = document.createElementNS(NS, 'feGaussianBlur');
    wbb.setAttribute('stdDeviation', shape === 'ring' ? '18' : '16');wb.appendChild(wbb);
    defs.appendChild(wb);

    // ワイプマスク
    var wm = document.createElementNS(NS, 'mask');
    wm.setAttribute('id','bWM' + idx);wm.setAttribute('maskUnits','userSpaceOnUse');
    wm.setAttribute('x','-660');wm.setAttribute('y','-1040');
    wm.setAttribute('width','2400');wm.setAttribute('height','2400');
    var wr = document.createElementNS(NS, 'rect');
    wr.setAttribute('x','-660');wr.setAttribute('y','-1040');
    wr.setAttribute('width','2400');wr.setAttribute('height','2400');
    wr.setAttribute('fill','black');
    wm.appendChild(wr);
    var pts = [], deg, a, r, t;
    var path = document.createElementNS(NS, 'path');
    if(shape === 'ring'){
      svg.setAttribute('viewBox','-560 -940 2000 2000');
      svg.setAttribute('preserveAspectRatio','xMidYMid meet');
      for(deg = 140; deg >= -230; deg -= 4){
        a = deg * Math.PI / 180; r = 640 + 20 * Math.sin(deg * .05);
        pts.push([CX + r * Math.cos(a), CY + r * Math.sin(a)]);
      }
      path.setAttribute('stroke-width','520');
    }else{
      svg.setAttribute('viewBox', host.dataset.viewbox || '0 0 1100 778');
      svg.setAttribute('preserveAspectRatio', (host.dataset.align || 'xMidYMid') + ' slice');
      var range = (host.dataset.arc || '140,-8').split(',').map(Number);
      for(deg = range[0]; deg >= range[1]; deg -= 4){
        t = (140 - deg) / 148; r = 560 + t * 300;
        a = deg * Math.PI / 180;
        pts.push([CX + r * Math.cos(a), CY + r * Math.sin(a)]);
      }
      path.setAttribute('stroke-width','480');
    }
    path.setAttribute('d','M ' + pts.map(function(p){ return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L '));
    path.setAttribute('fill','none');
    path.setAttribute('stroke','white');
    path.setAttribute('stroke-linecap','round');
    path.setAttribute('filter','url(#bWB' + idx + ')');
    wm.appendChild(path);
    defs.appendChild(wm);

    // インク本体
    var root = document.createElementNS(NS, 'g');
    root.setAttribute('mask','url(#bWM' + idx + ')');
    var copies = shape === 'ring' ? [0, 120, 240] : [0];
    copies.forEach(function(rot){
      var g = document.createElementNS(NS, 'g');
      if(rot) g.setAttribute('transform','rotate(' + rot + ' ' + CX + ' ' + CY + ')');
      if(edgeMaskId) g.setAttribute('mask','url(#' + edgeMaskId + ')');
      var img = document.createElementNS(NS, 'image');
      img.setAttribute('href','assets/brush_arc.png');
      img.setAttribute('x','0');img.setAttribute('y','0');
      img.setAttribute('width','1100');img.setAttribute('height','778');
      g.appendChild(img);
      root.appendChild(g);
    });
    svg.appendChild(root);
    host.appendChild(svg);

    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    var rev = 'reverse' in host.dataset;
    path.style.strokeDashoffset = rev ? -len : len;
    var sec = host.closest('section, footer');
    brushes[sec.id] = {path: path, len: len, reverse: rev, raf: null};
  });

  /* 速い払い→スッと止まる、勢いのある筆致 */
  function easeStroke(t){ return 1 - Math.pow(1 - t, 4); }
  function setBrushP(b, p){
    b.path.style.strokeDashoffset = b.reverse ? -(b.len * (1 - p)) : (b.len * (1 - p));
  }
  function drawBrush(secId, dur){
    var b = brushes[secId];
    if(!b) return;
    if(b.raf) cancelAnimationFrame(b.raf);
    var t0 = performance.now();
    (function step(now){
      var t = Math.min(1, (now - t0) / dur);
      setBrushP(b, easeStroke(t));
      if(t < 1) b.raf = requestAnimationFrame(step);
    })(t0);
  }
  function resetBrush(secId){
    var b = brushes[secId];
    if(!b) return;
    if(b.raf) cancelAnimationFrame(b.raf);
    setBrushP(b, 0);
  }

  /* ============================================================
     フルページ・エンジン
  ============================================================ */
  var slides = ['hero','message','movie','about','news','footer'].map(function(id){ return document.getElementById(id); });
  var tints  = document.querySelectorAll('.bg-tint');
  var SEG = 1 / slides.length;
  var cur = -1, animating = false;

  // pager
  var pager = document.getElementById('pager');
  slides.forEach(function(s, i){
    var b = document.createElement('button');
    b.setAttribute('aria-label', s.id);
    b.addEventListener('click', function(){ goTo(i); });
    pager.appendChild(b);
  });
  function setPager(n){
    pager.querySelectorAll('button').forEach(function(b, i){
      b.classList.toggle('act', i === n);
    });
  }
  function setTint(n){
    tints.forEach(function(t, i){ t.classList.toggle('on', i === n); });
  }

  function goTo(n, instant){
    n = Math.max(0, Math.min(slides.length - 1, n));
    if(n === cur || (animating && !instant)) return;
    var dir = n > cur ? 1 : -1;
    var out = cur >= 0 ? slides[cur] : null;
    var inc = slides[n];
    var first = cur < 0;
    cur = n;
    setPager(n);
    setTint(n);
    document.body.dataset.screen = n;   // 太陽ステージ等の状態切替

    if(instant){
      slides.forEach(function(s){
        s.classList.remove('is-active','is-leaving','on');
        s.style.transform = '';
        resetBrush(s.id);
      });
      inc.classList.add('is-active','on');
      inc.scrollTop = 0;
      var bi = brushes[inc.id];
      if(bi) setBrushP(bi, 1);
      return;
    }
    animating = true;

    if(out){
      out.classList.remove('is-active');
      out.classList.add('is-leaving');
      out.classList.remove('on');
      out.style.transform = 'translateY(' + (dir > 0 ? -7 : 7) + 'vh) scale(.985)';
      setTimeout(function(){
        out.classList.remove('is-leaving');
        out.style.transform = '';
        out.scrollTop = 0;             // スクロール位置もリセット
        resetBrush(out.id);            // 次回入場時にまた一筆から描く
      }, 850);
    }
    // 入場: 位置をセット → 次フレームでアクティブ化（スクロール位置は必ず先頭へ）
    inc.scrollTop = 0;
    inc.style.transition = 'none';
    inc.style.transform = 'translateY(' + (dir > 0 ? 8 : -8) + 'vh)';
    inc.style.visibility = 'visible';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        inc.style.transition = '';
        inc.style.transform = '';
        inc.classList.add('is-active');
      });
    });

    // 1. 画面がサッと現れる → 2. 見えている画面の上で一筆が走る → 3. コンテンツ出現
    var brushDelay   = first ? 700 : 500;    // 画面のフェードが済んでから筆
    var brushDur     = first ? 1600 : 1400;  // 少しゆっくり、払いの緩急を見せる
    var contentDelay = first ? 2300 : 1950;  // 筆を描き切ってからコンテンツ
    setTimeout(function(){ drawBrush(inc.id, brushDur); }, brushDelay);
    setTimeout(function(){ inc.classList.add('on'); }, contentDelay);
    setTimeout(function(){ animating = false; }, 1500);
  }

  /* ---------- 入力（ホイール / タッチ / キー） ---------- */
  // セクション自身がスクロール可能（モバイル等 overflow:auto 時）のみ内部スクロールを優先
  function innerScrollBlocks(sec, delta){
    if(!sec) return false;
    if(getComputedStyle(sec).overflowY !== 'auto') return false;
    if(sec.scrollHeight <= sec.clientHeight + 4) return false;
    var atTop = sec.scrollTop <= 0;
    var atBottom = sec.scrollTop + sec.clientHeight >= sec.scrollHeight - 2;
    return (delta > 0 && !atBottom) || (delta < 0 && !atTop);
  }
  var wheelLock = 0;
  addEventListener('wheel', function(e){
    if(!document.body.classList.contains('is-open')) return;
    if(document.body.classList.contains('menu-open')) return;
    var now = Date.now();
    if(animating || now < wheelLock) return;
    if(innerScrollBlocks(slides[cur], e.deltaY)) return;
    if(Math.abs(e.deltaY) < 4) return;
    wheelLock = now + 1500;
    goTo(cur + (e.deltaY > 0 ? 1 : -1));
  }, {passive:true});

  var touchY = null;
  addEventListener('touchstart', function(e){ touchY = e.touches[0].clientY; }, {passive:true});
  // スワイプ中の不要なネイティブスクロール/バウンスを抑止（ガタつき防止）
  addEventListener('touchmove', function(e){
    if(!document.body.classList.contains('is-open')) return;
    if(document.body.classList.contains('menu-open')) return;
    var sec = slides[cur];
    if(animating || !sec){ e.preventDefault(); return; }
    // セクション内スクロールの余地がない場合は常に抑止
    if(getComputedStyle(sec).overflowY !== 'auto' || sec.scrollHeight <= sec.clientHeight + 4){
      e.preventDefault();
      return;
    }
    // 内部スクロール可能でも、端からさらに引っ張る動きは抑止
    var dy = touchY !== null ? (touchY - e.touches[0].clientY) : 0;
    var atTop = sec.scrollTop <= 0;
    var atBottom = sec.scrollTop + sec.clientHeight >= sec.scrollHeight - 2;
    if((dy > 0 && atBottom) || (dy < 0 && atTop)) e.preventDefault();
  }, {passive:false});
  addEventListener('touchend', function(e){
    if(touchY === null || animating || !document.body.classList.contains('is-open')) return;
    var dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if(Math.abs(dy) < 60) return;
    if(innerScrollBlocks(slides[cur], dy)) return;
    goTo(cur + (dy > 0 ? 1 : -1));
  }, {passive:true});

  addEventListener('keydown', function(e){
    if(!document.body.classList.contains('is-open')) return;
    if(e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') goTo(cur + 1);
    if(e.key === 'ArrowUp' || e.key === 'PageUp') goTo(cur - 1);
    if(e.key === 'Home') goTo(0);
    if(e.key === 'End') goTo(slides.length - 1);
  });

  // アンカー（メニュー / フッター / ヘッダー / CTA）→ スライド移動
  var idToIndex = {};
  slides.forEach(function(s, i){ idToIndex['#' + s.id] = i; });
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var h = a.getAttribute('href');
      if(h in idToIndex){
        e.preventDefault();
        document.body.classList.remove('menu-open');
        goTo(idToIndex[h]);
      }else if(h === '#'){
        e.preventDefault();
      }
    });
  });
  document.getElementById('scrollCue').addEventListener('click', function(){ goTo(1); });

  /* ---------- opening movie ---------- */
  var opening = document.getElementById('opening');
  var video   = document.getElementById('openingVideo');
  var skipBtn = document.getElementById('skipBtn');
  var opBar   = document.getElementById('opBar');
  var opened  = false;

  function openSite(){
    if(opened) return;
    opened = true;
    opening.classList.add('is-ending');
    setTimeout(function(){
      document.body.classList.add('is-open');
      goTo(0);
    }, 200);
    setTimeout(function(){
      opening.classList.add('is-hidden');
      try{ video.pause(); }catch(e){}
    }, 1450);
    setTimeout(function(){
      opening.remove();
      var ring = document.getElementById('openingRing');
      if(ring) ring.remove();
    }, 2200);
  }

  var startAt = screenParam !== undefined ? parseInt(screenParam, 10) : ((location.hash && idToIndex[location.hash] !== undefined) ? idToIndex[location.hash] : null);

  if(qaFinal){
    document.body.classList.add('qa-final','is-open');
    opening.remove();
    var r0 = document.getElementById('openingRing'); if(r0) r0.remove();
    slides.forEach(function(s){
      s.classList.add('on');
      var b = brushes[s.id];
      if(b) setBrushP(b, 1);
    });
  }else if(startAt !== null || /[?&#]skip/.test(location.href)){
    opening.remove();
    var r1 = document.getElementById('openingRing'); if(r1) r1.remove();
    document.body.classList.add('is-open');
    if(screenParam !== undefined){
      document.body.classList.add('qa-still');
      goTo(startAt || 0, true);        // QA: 対象画面を完成状態で即表示
    }else{
      goTo(startAt || 0);
    }
  }else{
    skipBtn.addEventListener('click', openSite);
    video.addEventListener('ended', openSite);
    video.addEventListener('error', openSite);
    var safety = setTimeout(function(){
      if(video.readyState < 2 || video.paused) openSite();
    }, 4000);
    video.addEventListener('playing', function(){ clearTimeout(safety); });
    video.addEventListener('timeupdate', function(){
      if(video.duration) opBar.style.width = (video.currentTime / video.duration * 100) + '%';
    });
    var p = video.play();
    if(p && p.catch) p.catch(function(){});
  }

  /* ---------- menu ---------- */
  document.getElementById('menuBtn').addEventListener('click', function(){
    document.body.classList.toggle('menu-open');
  });

  /* ---------- cursor glow / parallax ---------- */
  var glow = document.getElementById('cursorGlow');
  var fine = window.matchMedia('(pointer:fine)').matches;
  if(fine){
    document.addEventListener('mousemove', function(e){
      glow.style.opacity = 1;
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  }

  /* ---------- gold particles ---------- */
  var cv = document.getElementById('particles');
  var ctx = cv.getContext('2d');
  var W, H, parts = [];
  function resize(){ W = cv.width = innerWidth; H = cv.height = innerHeight; }
  resize();
  addEventListener('resize', resize);
  var COUNT = Math.min(70, Math.floor(innerWidth / 22));
  function newPart(init){
    return {
      x: Math.random() * W,
      y: init ? Math.random() * H : H + 10,
      r: .6 + Math.random() * 1.9,
      vy: .18 + Math.random() * .55,
      vx: (Math.random() - .5) * .25,
      tw: Math.random() * Math.PI * 2,
      tws: .01 + Math.random() * .04,
      hue: 42 + Math.random() * 10
    };
  }
  for(var i = 0; i < COUNT; i++) parts.push(newPart(true));
  (function tick(){
    ctx.clearRect(0, 0, W, H);
    for(var i = 0; i < parts.length; i++){
      var p = parts[i];
      p.y -= p.vy; p.x += p.vx + Math.sin(p.tw) * .15; p.tw += p.tws;
      if(p.y < -12 || p.x < -12 || p.x > W + 12){ parts[i] = newPart(false); continue; }
      var a = .25 + Math.abs(Math.sin(p.tw)) * .55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = 'hsla(' + p.hue + ', 80%, 68%, ' + a + ')';
      ctx.shadowColor = 'hsla(45, 90%, 65%, .9)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(tick);
  })();
})();
