/* Alinhar · interações do site */
(function () {
  'use strict';
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WHATS = '5587991253626';

  /* ano do rodapé */
  var ano = document.getElementById('footer-year');
  if (ano) ano.textContent = new Date().getFullYear();

  /* header reativo + barra de progresso */
  var navbar = document.getElementById('navbar');
  var barra = document.getElementById('progresso');
  var tick = false;
  function aoRolar() {
    var y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 24);
    if (barra) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
    }
    tick = false;
  }
  window.addEventListener('scroll', function () {
    if (!tick) { tick = true; requestAnimationFrame(aoRolar); }
  }, { passive: true });
  aoRolar();

  /* menu mobile (drawer) */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  var backdrop = document.getElementById('menuBackdrop');
  var fechar = document.getElementById('mobileClose');
  function abrirMenu() { menu.classList.add('open'); backdrop.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function fecharMenu() { menu.classList.remove('open'); backdrop.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  if (toggle && menu) {
    toggle.addEventListener('click', abrirMenu);
    fechar.addEventListener('click', fecharMenu);
    backdrop.addEventListener('click', fecharMenu);
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', fecharMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) fecharMenu(); });
  }

  /* HERO: os fios encontram o eixo; o ponteiro desalinha e eles voltam */
  var hero = document.getElementById('hero');
  if (hero) {
    var fios = hero.querySelectorAll('.fio');
    requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('alinhado'); }, 350); });
    if (!reduz && window.matchMedia('(pointer: fine)').matches) {
      var volta;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        hero.classList.add('mexendo');
        fios.forEach(function (f, i) {
          var lado = i % 2 ? 1 : -1;
          f.style.transform = 'translateY(' + (py * 26 * lado) + 'px) rotate(' + (px * 3.2 * lado) + 'deg)';
        });
        clearTimeout(volta);
        volta = setTimeout(realinhar, 650);
      });
      hero.addEventListener('pointerleave', realinhar);
    }
    function realinhar() {
      fios.forEach(function (f) { f.style.transform = ''; });
      setTimeout(function () { hero.classList.remove('mexendo'); }, 900);
    }
  }

  /* gatilhos de entrada: IntersectionObserver + checagem por posição no scroll
     (reforço para rolagem muito rápida, quando o observer não chega a disparar) */
  var pendentes = [];
  function quandoVisivel(el, fn, limiar) {
    if (!el) return;
    if (reduz) { fn(); return; }
    var item = { el: el, fn: fn, feito: false, fator: 1 - (limiar || 0.15) * 0.6 };
    pendentes.push(item);
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { disparar(item); o.disconnect(); } });
      }, { threshold: limiar || 0.15, rootMargin: '0px 0px -8% 0px' });
      o.observe(el);
    }
  }
  function disparar(item) { if (!item.feito) { item.feito = true; item.fn(); } }
  var ultimaChecagem = 0;
  function checarPosicoes() {
    var agora = Date.now();
    if (agora - ultimaChecagem < 40) return;
    ultimaChecagem = agora;
    var vh = window.innerHeight;
    for (var i = 0; i < pendentes.length; i++) {
      var it = pendentes[i];
      if (it.feito) continue;
      var r = it.el.getBoundingClientRect();
      if (r.top < vh * it.fator && r.bottom > 0) disparar(it);
    }
  }
  window.addEventListener('scroll', checarPosicoes, { passive: true });
  window.addEventListener('load', checarPosicoes);

  /* reveal on-scroll com stagger */
  document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
    quandoVisivel(el, function () { el.classList.add('visible'); }, 0.15);
  });

  /* TCC: o triângulo pensar/sentir/agir se equilibra */
  var ciclo = document.getElementById('ciclo');
  var textos = {
    pensar: ['Pensamentos', 'As interpretações automáticas que fazemos sobre nós, sobre os outros e sobre o futuro. Na TCC, aprendemos a percebê-las e a questioná-las com gentileza.'],
    sentir: ['Emoções', 'O que sentimos a partir dessas interpretações, no corpo e na mente. Emoções não são inimigas: são sinais que ajudam a entender o que importa para você.'],
    agir: ['Comportamentos', 'O que fazemos, ou deixamos de fazer, diante do que pensamos e sentimos. Pequenas mudanças de ação também transformam o ciclo inteiro.']
  };
  if (ciclo) {
    var titulo = document.getElementById('cicloTitulo');
    var texto = document.getElementById('cicloTexto');
    var nos = ciclo.querySelectorAll('.ciclo__no');
    nos.forEach(function (b) {
      b.addEventListener('click', function () {
        nos.forEach(function (n) { n.classList.remove('is-ativo'); n.setAttribute('aria-pressed', 'false'); });
        b.classList.add('is-ativo'); b.setAttribute('aria-pressed', 'true');
        var t = textos[b.getAttribute('data-ciclo')];
        titulo.textContent = t[0]; texto.textContent = t[1];
      });
    });
    var realinharBtn = document.getElementById('cicloRealinhar');
    if (realinharBtn) realinharBtn.addEventListener('click', function () {
      if (reduz) return;
      ciclo.classList.remove('repete');
      void ciclo.offsetWidth; /* reinicia a animação */
      ciclo.classList.add('repete');
    });
  }

  /* acordeões (diferenciais e FAQ) */
  document.querySelectorAll('.acordeao').forEach(function (grupo) {
    var botoes = grupo.querySelectorAll('.acordeao__botao');
    botoes.forEach(function (b) {
      b.addEventListener('click', function () {
        var aberto = b.getAttribute('aria-expanded') === 'true';
        botoes.forEach(function (o) {
          o.setAttribute('aria-expanded', 'false');
          var p = document.getElementById(o.getAttribute('aria-controls'));
          if (p) p.hidden = true;
        });
        if (!aberto) {
          b.setAttribute('aria-expanded', 'true');
          var painel = document.getElementById(b.getAttribute('aria-controls'));
          if (painel) painel.hidden = false;
        }
      });
    });
  });

  /* menu ativo conforme a seção */
  var linksNav = document.querySelectorAll('.nav-links a[href^="#"], .mobile-menu__links a[href^="#"]');
  var secoes = ['abordagem', 'como-funciona', 'sobre', 'empresas', 'contato'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if ('IntersectionObserver' in window && secoes.length) {
    var ativo = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          linksNav.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoes.forEach(function (s) { ativo.observe(s); });
  }

  /* formulário: mensagem pronta para o WhatsApp */
  var form = document.getElementById('formContato');
  if (form) {
    var cel = form.querySelector('#celular');
    cel.addEventListener('input', function () {
      var d = cel.value.replace(/\D/g, '').slice(0, 11);
      var f = d;
      if (d.length > 2) f = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length > 7) f = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
      cel.value = f;
    });
    function erro(campo, msg) {
      var box = campo.closest('.campo');
      box.classList.toggle('erro', !!msg);
      box.querySelector('.campo__erro').textContent = msg || '';
      return !msg;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.nome, email = form.email, msg = form.mensagem, lgpd = form.lgpd;
      var ok = true;
      ok = erro(nome, nome.value.trim().length < 2 ? 'Informe seu nome.' : '') && ok;
      ok = erro(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'Informe um e-mail válido.') && ok;
      ok = erro(cel, cel.value.replace(/\D/g, '').length < 10 ? 'Informe o celular com DDD.' : '') && ok;
      ok = erro(msg, msg.value.trim().length < 3 ? 'Escreva uma mensagem.' : '') && ok;
      ok = erro(lgpd, lgpd.checked ? '' : 'É preciso concordar com a Política de Privacidade.') && ok;
      if (!ok) { var primeiro = form.querySelector('.campo.erro input, .campo.erro textarea'); if (primeiro) primeiro.focus(); return; }
      var botao = document.getElementById('formBotao');
      botao.classList.add('enviando'); botao.textContent = 'Abrindo o WhatsApp...';
      var texto = 'Olá! Vim pelo site e gostaria de mais informações.\n\n' +
        'Nome: ' + nome.value.trim() + '\n' +
        'E-mail: ' + email.value.trim() + '\n' +
        'Celular: ' + cel.value.trim() + '\n' +
        'Mensagem: ' + msg.value.trim();
      window.open('https://wa.me/' + WHATS + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      setTimeout(function () { botao.classList.remove('enviando'); botao.textContent = 'Enviar pelo WhatsApp'; }, 2200);
    });
  }
})();
