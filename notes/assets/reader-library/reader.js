(() => {
  'use strict';

  const root = document.documentElement;
  const theme = document.querySelector('[data-library-theme]');
  const sizeButton = document.querySelector('.font-size-switch');
  function readSetting(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function writeSetting(key, value) {
    try { localStorage.setItem(key, value); } catch { /* file and private browsing */ }
  }
  function applyTheme(isDark) {
    if (isDark) root.dataset.theme = 'dark';
    else root.removeAttribute('data-theme');
    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    if (theme) {
      theme.setAttribute('aria-label', label);
      theme.title = label;
    }
  }
  applyTheme(readSetting('ad-lecture-theme') === 'dark');
  theme?.addEventListener('click', () => {
    const isDark = root.dataset.theme !== 'dark';
    applyTheme(isDark);
    writeSetting('ad-lecture-theme', isDark ? 'dark' : 'light');
  });
  if (sizeButton) {
    const applySize = large => {
      document.body.classList.toggle('large-type', large);
      sizeButton.setAttribute('aria-pressed', String(large));
      sizeButton.textContent = large ? 'Standard text' : 'Larger text';
    };
    applySize(readSetting('ad-reading-size') === 'large');
    sizeButton.addEventListener('click', () => {
      const large = !document.body.classList.contains('large-type');
      applySize(large);
      writeSetting('ad-reading-size', large ? 'large' : 'standard');
    });
  }

  const chapterToggle = document.querySelector('#book-nav-toggle');
  const bookNav = document.querySelector('#book-nav');
  if (chapterToggle && bookNav) {
    function revealCurrentChapter(container) {
      const active = container.querySelector('a[aria-current="page"]');
      if (!active || !container.clientHeight) return;
      const position = active.getBoundingClientRect().top - container.getBoundingClientRect().top;
      if (position < 0 || position + active.clientHeight > container.clientHeight) {
        container.scrollTop += position - container.clientHeight * 0.4;
      }
    }
    revealCurrentChapter(bookNav);
    const drawer = document.createElement('dialog');
    drawer.id = 'chapter-drawer';
    drawer.className = 'chapter-drawer';
    drawer.setAttribute('aria-label', 'Book chapters');
    const close = document.createElement('button');
    close.className = 'drawer-close';
    close.type = 'button';
    close.textContent = 'Close';
    close.addEventListener('click', () => drawer.close());
    const nav = bookNav.querySelector('nav').cloneNode(true);
    drawer.append(close, nav);
    document.body.append(drawer);
    chapterToggle.setAttribute('aria-controls', drawer.id);
    chapterToggle.setAttribute('aria-haspopup', 'dialog');
    chapterToggle.addEventListener('click', () => {
      drawer.showModal();
      chapterToggle.setAttribute('aria-expanded', 'true');
      close.focus();
      revealCurrentChapter(drawer);
    });
    drawer.addEventListener('close', () => {
      chapterToggle.setAttribute('aria-expanded', 'false');
      chapterToggle.focus({preventScroll:true});
    });
    drawer.addEventListener('click', event => {
      if (event.target !== drawer) return;
      const box = drawer.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) drawer.close();
    });
  }

  function openLinkedSolution() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    const details = target?.closest('details');
    if (!details) return;
    for (let node = details; node; node = node.parentElement?.closest('details')) node.open = true;
    requestAnimationFrame(() => target.scrollIntoView());
  }
  openLinkedSolution();
  window.addEventListener('hashchange', openLinkedSolution);
  document.querySelectorAll('.section-disclosure nav a').forEach(link => {
    link.addEventListener('click', () => { link.closest('details').open = false; });
  });

  const railLinks = [...document.querySelectorAll('.section-rail a[href^="#"]')];
  const rail = railLinks.map(link => ({ link, node:document.getElementById(link.hash.slice(1)) })).filter(item => item.node);
  if (rail.length) {
    let selected = null;
    let pending = false;
    function track() {
      pending = false;
      // Hidden disclosures can contain headings; only visible sections participate.
      if (!rail[0].link.getClientRects().length) return;
      let active = null;
      for (const item of rail) {
        if (!item.node.getClientRects().length) continue;
        if (item.node.getBoundingClientRect().top > 112) break;
        active = item.link;
      }
      if (selected === active) return;
      selected?.removeAttribute('aria-current');
      active?.setAttribute('aria-current', 'location');
      selected = active;
    }
    const enqueue = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(track);
    };
    window.addEventListener('scroll', enqueue, {passive:true});
    window.addEventListener('resize', enqueue, {passive:true});
    track();
  }

  const article = document.querySelector('.page-content');
  if (!article) return;

  // Insert controls outside <pre> so the copied text contains only the program.
  const copyCode = async (element, button) => {
    const text = element.textContent;
    let success = false;
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); success = true; } catch { /* fallback below */ }
    }
    if (!success) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.cssText = 'position:fixed;top:0;left:-1000px;opacity:0';
      document.body.append(area);
      area.focus();
      area.select();
      try { success = document.execCommand('copy'); } catch { /* select visible text */ }
      area.remove();
      button.focus({preventScroll:true});
    }
    if (success) {
      button.textContent = 'Copied';
    } else {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? 'Press ⌘C to copy' : 'Press Ctrl+C to copy';
    }
    setTimeout(() => { button.textContent = 'Copy code'; }, 2600);
  };
  for (const pre of article.querySelectorAll('pre')) {
    if (pre.closest('[data-lab],.math-lab,[data-own-copy],.code-with-copy')) continue;
    const wrap = document.createElement('div');
    const tools = document.createElement('div');
    const button = document.createElement('button');
    wrap.className = 'code-with-copy';
    tools.className = 'code-tools';
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy code';
    button.setAttribute('aria-live', 'polite');
    button.addEventListener('click', () => copyCode(pre.querySelector('code') || pre, button));
    pre.before(wrap);
    tools.append(button);
    wrap.append(tools,pre);
  }

  const images = [...article.querySelectorAll('img')].filter(img => !img.closest('a,button,[data-lab],.math-lab,.no-zoom,.emoji,math,.math') && !img.matches('.icon,.emoji,[data-no-zoom]'));
  if (!images.length) return;
  const viewer = document.createElement('dialog');
  viewer.className = 'diagram-viewer';
  viewer.setAttribute('aria-label', 'Enlarged diagram');
  viewer.innerHTML = '<div class="diagram-tools"><button type="button" class="diagram-magnify">Magnify</button><button type="button" class="diagram-close">Close</button></div><div class="diagram-canvas"></div><p class="diagram-caption"></p>';
  document.body.append(viewer);
  const canvas = viewer.querySelector('.diagram-canvas');
  const caption = viewer.querySelector('.diagram-caption');
  const magnify = viewer.querySelector('.diagram-magnify');
  const closer = viewer.querySelector('.diagram-close');
  let lastImage = null;
  magnify.addEventListener('click', () => { magnify.textContent = canvas.classList.toggle('is-magnified') ? 'Fit diagram' : 'Magnify'; });
  closer.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const b = viewer.getBoundingClientRect();
    if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => { canvas.replaceChildren(); lastImage?.focus({preventScroll:true}); });
  function showImage(img) {
    const description = img.closest('figure')?.querySelector('figcaption')?.textContent || img.alt || 'Mathematical diagram';
    const large = new Image();
    large.src = img.currentSrc || img.src;
    large.alt = img.alt;
    canvas.classList.remove('is-magnified');
    magnify.textContent = 'Magnify';
    canvas.replaceChildren(large);
    caption.textContent = description;
    lastImage = img;
    viewer.showModal();
    closer.focus();
  }
  for (const img of images) {
    img.dataset.zoomable = 'true';
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    img.setAttribute('aria-haspopup', 'dialog');
    img.setAttribute('aria-label', 'Enlarge ' + (img.alt || 'diagram'));
    img.addEventListener('click', () => showImage(img));
    img.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      showImage(img);
    });
  }
})();
