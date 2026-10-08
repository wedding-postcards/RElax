/* AxiomOps adapter. See PROVENANCE.md for exact original components and settings.
   This adapts Framer's layout animation to WAAPI; it does not replace the donor
   curve with a guessed CSS easing. The spring samples below are calculated by
   the original animator.spring({keyframes:[0,1],duration:400,bounce:.2}). */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 810px)');
  const spring = [0,0.01036971,0.03826366,0.07938849,0.13010255,0.18734955,0.24859469,0.31176398,0.37518733,0.43754577,0.4978228,0.55526022,0.60931815,0.65963922,0.70601681,0.748367,0.78670407,0.82111929,0.8517627,0.87882753,0.90253718,0.92313434,0.94087199,0.95600619,0.96879033,0.97947062,0.98828271,0.99544927,1.0011783,1.0056621,1.00907681,1.0115823,1.01332252,1.01442594,1.01500637,1.01516376,1.01498518,1.01454585,1.01391012,1.01313257,1.01225893,1.01132713,1.01036814,1.0094069,1.00846305,1.0075517,1.0066841,1.00586822,1.00510931,1.00441034,1.00377247,1.0031954,1.00267767,1.00221695,1.00181026,1.0014542,1.00114508,1.00087903,1.0006522,1.00046073,1];
  const running = new WeakMap();
  const toggleAnimations = new Set();
  function setToggle(group, value, instant = false) {
    const buttons = [...group.querySelectorAll('[data-model-view]')];
    const previous = buttons.map(button => {
      const css = getComputedStyle(button);
      return {backgroundColor:css.backgroundColor, color:css.color};
    });
    buttons.forEach(button => running.get(button)?.cancel());
    group.classList.toggle('framer-v-1mrk6p0', value === 'detail');
    group.classList.toggle('framer-v-fcksah', value !== 'detail');
    buttons.forEach((button,index) => {
      button.setAttribute('aria-pressed', String(button.dataset.modelView === value));
      if (instant || reduce.matches) return;
      const css = getComputedStyle(button);
      const next = {backgroundColor:css.backgroundColor,color:css.color};
      // Price Toggle uses the same source .4s / .2-bounce spring for color.
      // Fixed segments only: no invented sliding pill or text roll.
      const animation = button.animate([previous[index],next], {
        duration:400, easing:`linear(${spring.join(',')})`
      });
      running.set(button,animation);
      toggleAnimations.add(animation);
      animation.finished.then(() => toggleAnimations.delete(animation),() => toggleAnimations.delete(animation));
    });
  }
  const color = secondary => secondary ? 'var(--token-0717d515-91e4-40bc-9ee3-2e9c2f7acaea)' : 'var(--token-0c7bda5a-d5f8-4857-8dfa-bc6f6f03eb25)';
  function edge(outerClass, innerClass, angle, secondary) {
    const outer = document.createElement('div');
    outer.className = outerClass;
    outer.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('div');
    inner.className = `${innerClass} svgContainer`;
    inner.style.transform = `rotate(${angle}deg)`;
    // Exact path and 10.096 viewBox from the donor Button component.
    inner.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10.096 10.096" overflow="visible" focusable="false" style="width:100%;height:100%"><path d="M 0 10.096 L 0 0 L 10.096 0" fill="transparent" stroke="${color(secondary)}"></path></svg>`;
    outer.append(inner);
    return outer;
  }
  function animateLayout(button, hover, instant = false) {
    const parts = [...button.querySelectorAll('.framer-8ax1d4,.framer-h6oz0b,.framer-zqer2b,.framer-mug2t2,.framer-ekeov5,.framer-gnyai6,.framer-q59zxc,.framer-1xkfo6v')];
    if (button.classList.contains('hover') === hover) {
      // Keyboard/reduced-motion feedback must also finish an in-flight hover.
      if (instant || reduce.matches) parts.forEach(part => running.get(part)?.cancel());
      return;
    }
    const previous = parts.map(part => part.getBoundingClientRect());
    parts.forEach(part => running.get(part)?.cancel());
    button.classList.toggle('hover', hover);
    if (reduce.matches || instant) return;
    parts.forEach((part, index) => {
      const next = part.getBoundingClientRect();
      const x = previous[index].left - next.left;
      const y = previous[index].top - next.top;
      if (!x && !y) return;
      const animation = part.animate(spring.map(value => ({transform: `translate(${x * (1-value)}px, ${y * (1-value)}px)`})), {duration: 400, easing: 'linear'});
      running.set(part, animation);
    });
  }
  function fitLabel(button) {
    if (button.dataset.axiomVariant === 'primary-small') return;
    const label = button.querySelector('.framer-ekeov5');
    const needed = Math.ceil(label.getBoundingClientRect().width + 56);
    // Localization adapter: donor English fits 200px; long Russian labels do not.
    if (button.style.getPropertyValue('--axiom-button-width') && !button.dataset.axiomAutoWidth) return;
    button.dataset.axiomAutoWidth = 'true';
    button.style.setProperty('--axiom-button-width', `${Math.max(200, needed)}px`);
  }
  function mountButtons(root = document) {
    root.querySelectorAll('[data-axiom-variant]:not([data-axiom-ready])').forEach(button => {
      const variant = button.dataset.axiomVariant;
      const secondary = variant === 'secondary-large';
      const small = variant === 'primary-small';
      const label = button.textContent.trim();
      button.dataset.axiomReady = 'true';
      if (/[\u0400-\u052f]/.test(label)) button.dataset.axiomScript = 'cyrillic';
      button.setAttribute('aria-label', button.getAttribute('aria-label') || label);
      button.classList.add('framer-x427C','framer-C7nJD','framer-1b34cvm','framer-xkumya', small ? 'framer-v-sybiaw' : secondary ? 'framer-v-v3ysme' : 'framer-v-1b34cvm');
      button.dataset.framerName = small ? 'Primary Small' : secondary ? 'Secondary Large' : 'Primary Large';
      button.textContent = '';
      button.append(edge('framer-8ax1d4','framer-15r5zsp',0,secondary), edge('framer-h6oz0b','framer-yzxpgi',-90,secondary));
      const content = document.createElement('div');
      content.className = 'framer-17fzfqd';
      if (secondary) {
        content.dataset.border = 'true';
        content.style.cssText = '--border-top-width:1px;--border-right-width:1px;--border-bottom-width:1px;--border-left-width:1px;--border-style:solid;--border-color:var(--token-0717d515-91e4-40bc-9ee3-2e9c2f7acaea)';
      }
      const wrap = document.createElement('div');
      wrap.className = 'framer-1nh44ou';
      const spacer = document.createElement('div');
      spacer.className = 'framer-qnt49f';
      wrap.append(spacer);
      ['framer-ekeov5','framer-gnyai6'].forEach(className => {
        const holder = document.createElement('div');
        holder.className = className;
        holder.setAttribute('aria-hidden','true');
        const text = document.createElement('p');
        text.className = 'framer-text framer-styles-preset-99egca';
        text.style.setProperty('--framer-text-color', secondary ? 'var(--token-0c7bda5a-d5f8-4857-8dfa-bc6f6f03eb25)' : 'var(--token-4bca0573-86e0-464f-9415-c584725e492e)');
        text.textContent = label;
        holder.append(text);
        wrap.append(holder);
      });
      content.append(wrap);
      button.append(content,edge('framer-zqer2b','framer-1mavfjv',-180,secondary),edge('framer-mug2t2','framer-nr8k7h',90,secondary));
      button.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'touch' && matchMedia('(hover: hover) and (pointer: fine)').matches) animateLayout(button,true);
      });
      button.addEventListener('pointerleave', () => animateLayout(button,button.matches(':focus-visible')));
      button.addEventListener('focus', () => { if (button.matches(':focus-visible')) animateLayout(button,true,true); });
      button.addEventListener('blur', () => animateLayout(button,false,true));
      fitLabel(button);
      document.fonts.ready.then(() => fitLabel(button));
    });
  }
  function mountFrames(root = document) {
    root.querySelectorAll('[data-axiom-frame]:not([data-axiom-frame-ready])').forEach(frame => {
      // Preserve the original anchor, images, captions and layout. Only append
      // the four exact Axiom corner paths; do not turn this into a Button.
      frame.dataset.axiomFrameReady = 'true';
      frame.append(
        edge('framer-8ax1d4','framer-15r5zsp',0,true),
        edge('framer-h6oz0b','framer-yzxpgi',-90,true),
        edge('framer-zqer2b','framer-1mavfjv',-180,true),
        edge('framer-mug2t2','framer-nr8k7h',90,true)
      );
      frame.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'touch' && matchMedia('(hover: hover) and (pointer: fine)').matches) animateLayout(frame,true);
      });
      frame.addEventListener('pointerleave', () => animateLayout(frame,frame.matches(':focus-visible')));
      // Emil: keyboard feedback should be immediate. Pointer motion continues
      // to use Axiom's original .4s / .2-bounce spring without changing buttons.
      frame.addEventListener('focus', () => { if (frame.matches(':focus-visible')) animateLayout(frame,true,true); });
      frame.addEventListener('blur', () => animateLayout(frame,false,true));
    });
  }
  let lenis = null;
  function mountNavLinks(root = document) {
    root.querySelectorAll('.framer-kg5JT:not([data-axiom-nav-ready])').forEach(link => {
      link.dataset.axiomNavReady = 'true';
      const labels = [...link.querySelectorAll('.framer-q59zxc,.framer-1xkfo6v')];
      link.setAttribute('aria-label',labels[0].textContent.trim());
      labels.forEach(label => label.setAttribute('aria-hidden','true'));
      link.addEventListener('pointerenter',event => {
        if (event.pointerType !== 'touch' && matchMedia('(hover: hover) and (pointer: fine)').matches) animateLayout(link,true);
      });
      link.addEventListener('pointerleave',() => animateLayout(link,link.matches(':focus-visible')));
      link.addEventListener('focus',() => { if (link.matches(':focus-visible')) animateLayout(link,true,true); });
      link.addEventListener('blur',() => animateLayout(link,false,true));
    });
  }
  let frame = 0;
  const tick = time => { lenis?.raf(time); if (lenis) frame = requestAnimationFrame(tick); };
  function syncScroll() {
    if (desktop.matches && !reduce.matches && window.Lenis) {
      if (lenis) return;
      // Exact values from Axiom's published Smooth Scroll component instance.
      lenis = new Lenis({lerp: .045, smoothWheel: true, wheelMultiplier: .85, syncTouch: false});
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
    }
  }
  function focusDestination(target) {
    const temporaryTabIndex = !target.hasAttribute('tabindex') && !target.matches('a[href],button,input,select,textarea,[contenteditable]');
    if (temporaryTabIndex) {
      target.setAttribute('tabindex','-1');
      target.addEventListener('blur',() => target.removeAttribute('tabindex'),{once:true});
    }
    target.focus({preventScroll:true});
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    let target;
    try { target = document.querySelector(hash); } catch { return; }
    if (!target) return;
    const keyboard = event.detail === 0;
    const offset = -(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anchor-offset')) || 0);
    if (!lenis) {
      // Pointer anchor scrolling stays native. Keyboard activation is instant
      // even if the host enables CSS scroll-behavior: smooth.
      if (keyboard) {
        event.preventDefault();
        window.scrollTo({top:target.getBoundingClientRect().top + window.scrollY + offset,behavior:'instant'});
        focusDestination(target);
        history.pushState(null,'',hash);
      }
      return;
    }
    event.preventDefault();
    lenis.scrollTo(target,{offset,immediate:keyboard,onComplete:keyboard ? () => focusDestination(target) : undefined});
    history.pushState(null,'',hash);
  });
  const pendingReveals = new Set();
  const activeReveals = new Set();
  const reveal = element => {
    pendingReveals.delete(element);
    if (reduce.matches) { element.style.opacity = ''; return; }
    const section = element.dataset.axiomReveal === 'section';
    // Published appear: 6px/.35s. Published scroll enter As: 40px/.6s.
    const animation = element.animate([{opacity:0,transform:`translateY(${section ? 40 : 6}px)`},{opacity:1,transform:'translateY(0px)'}],{duration:section ? 600 : 350,easing:'cubic-bezier(.44,0,.56,1)'});
    activeReveals.add(animation);
    animation.finished.then(() => activeReveals.delete(animation),() => activeReveals.delete(animation));
    element.style.opacity = '';
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); } });
  },{threshold:.01,rootMargin:'0px 0px -16px 0px'});
  function mountReveals(root = document) {
    root.querySelectorAll('[data-axiom-reveal]:not([data-axiom-observed])').forEach(element => {
      element.dataset.axiomObserved = 'true';
      if (reduce.matches) return;
      // Large sections must never appear as an empty panel while scrolling.
      if (element.getBoundingClientRect().height > innerHeight) return;
      element.style.opacity = '0';
      pendingReveals.add(element);
      observer.observe(element);
    });
  }
  const refresh = root => { mountButtons(root); mountFrames(root); mountNavLinks(root); mountReveals(root); lenis?.resize(); };
  reduce.addEventListener('change', () => {
    syncScroll();
    if (reduce.matches) {
      pendingReveals.forEach(element => { element.style.opacity=''; observer.unobserve(element); pendingReveals.delete(element); });
      activeReveals.forEach(animation => animation.cancel());
      activeReveals.clear();
      toggleAnimations.forEach(animation => animation.cancel());
      toggleAnimations.clear();
      document.querySelectorAll('[data-axiom-ready],[data-axiom-frame-ready],[data-axiom-nav-ready]').forEach(element => animateLayout(element,element.classList.contains('hover'),true));
    }
  });
  desktop.addEventListener('change',syncScroll);
  window.addEventListener('pageshow',() => lenis?.resize());
  let resizeFrame = 0;
  window.addEventListener('resize',() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => document.querySelectorAll('[data-axiom-ready]').forEach(fitLabel));
  });
  window.AxiomDonor = {refresh, setToggle, get scroll() { return lenis; }};
  refresh();
  syncScroll();
})();
