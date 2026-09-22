(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  if (!slides.length) return;
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const count = document.getElementById('current-count');
  const total = document.getElementById('total-count');
  const progress = document.getElementById('progress-bar');
  const dots = document.getElementById('nav-dots');
  const fullscreen = document.getElementById('fullscreen');
  const dialog = document.querySelector('.image-dialog');
  const closeDialog = dialog.querySelector('.dialog-close');
  let current = -1;
  let wheelLocked = false;
  let touchStart = null;
  let zoomTrigger = null;
  let wheelTimer;

  const indexFromHash = () => {
    const match = location.hash.match(/^#(?:slide-)?(\d+)$/);
    return match ? Number(match[1]) - 1 : 0;
  };
  slides.forEach((slide, index) => {
    slide.setAttribute('aria-roledescription', 'slide');
    slide.querySelectorAll('.reveal').forEach((element, i) => element.style.setProperty('--i', String(i)));
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'nav-dot';
    dot.setAttribute('aria-label', `Go to slide ${index + 1}: ${slide.dataset.title}`);
    dot.addEventListener('click', () => go(index));
    dots.appendChild(dot);
  });
  const dotItems = [...dots.children];
  total.textContent = String(slides.length).padStart(2, '0');

  function go(index, updateHash = true) {
    const target = Math.max(0, Math.min(slides.length - 1, Number.isFinite(index) ? index : 0));
    const changed = target !== current;
    if (changed && document.activeElement?.closest('.slide')) document.activeElement.blur();
    slides.forEach((slide, i) => {
      const active = i === target;
      slide.classList.toggle('active', active);
      slide.classList.toggle('before', i < target);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    current = target;
    if (changed) slides[current].scrollTop = 0;
    dotItems.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    count.textContent = String(current + 1).padStart(2, '0');
    progress.style.transform = `scaleX(${(current + 1) / slides.length})`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.title = `${slides[current].dataset.title} · Zhishan Tao`;
    if (updateHash) {
      try { history.replaceState(null, '', `#slide-${current + 1}`); }
      catch { location.hash = `slide-${current + 1}`; }
    }
  }
  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  const isControl = target => target instanceof Element && !!target.closest('a,button,input,select,textarea,[contenteditable="true"]');
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      fullscreen.title = 'Fullscreen is unavailable in this browser. Use the browser fullscreen control.';
    }
  }
  fullscreen.hidden = !document.fullscreenEnabled;
  fullscreen.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)');
  });
  window.addEventListener('keydown', event => {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest('input,select,textarea,[contenteditable="true"]')) return;
    if ([' ', 'Enter'].includes(event.key) && isControl(event.target)) return;
    if (['ArrowRight','ArrowDown','PageDown',' '].includes(event.key)) { event.preventDefault(); go(current + 1); }
    else if (['ArrowLeft','ArrowUp','PageUp'].includes(event.key)) { event.preventDefault(); go(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); go(0); }
    else if (event.key === 'End') { event.preventDefault(); go(slides.length - 1); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
  });
  window.addEventListener('wheel', event => {
    if (dialog.open || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const active = slides[current];
    const canScroll = active.scrollHeight > active.clientHeight + 4;
    if (canScroll && ((event.deltaY > 0 && active.scrollTop + active.clientHeight < active.scrollHeight - 3) || (event.deltaY < 0 && active.scrollTop > 3))) return;
    event.preventDefault();
    if (wheelLocked) {
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { wheelLocked = false; }, 400);
      return;
    }
    if (Math.abs(event.deltaY) < 18) return;
    wheelLocked = true;
    go(current + (event.deltaY > 0 ? 1 : -1));
    wheelTimer = setTimeout(() => { wheelLocked = false; }, 650);
  }, {passive:false});
  window.addEventListener('touchstart', event => {
    if (dialog.open || event.touches.length !== 1 || isControl(event.target)) { touchStart = null; return; }
    touchStart = {x:event.touches[0].clientX, y:event.touches[0].clientY};
  }, {passive:true});
  window.addEventListener('touchend', event => {
    if (!touchStart || dialog.open) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(current + (dx < 0 ? 1 : -1));
  }, {passive:true});
  window.addEventListener('touchcancel', () => { touchStart = null; }, {passive:true});
  window.addEventListener('hashchange', () => go(indexFromHash(), false));

  document.querySelectorAll('.zoom-image').forEach(button => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      const enlarged = dialog.querySelector('img');
      enlarged.src = image.currentSrc || image.src;
      enlarged.alt = image.alt;
      zoomTrigger = button;
      dialog.showModal();
      closeDialog.focus();
    });
  });
  closeDialog.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => zoomTrigger?.focus());
  document.documentElement.classList.add('js-deck');
  go(indexFromHash(), false);
})();
