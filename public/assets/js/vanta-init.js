// public/assets/js/vanta-init.js
// ES module to safely initialize/destroy/reinit Vanta.NET on a page element.
//
// Usage examples:
// import { initVanta, destroyVanta, reinitVanta } from '/public/assets/js/vanta-init.js';
// initVanta('#vanta-bg', { color: 0x355f9f, backgroundColor: 0x0B1220, mobileDisableWidth: 700 });
//
// Notes:
// - The module expects Vanta (VANTA.NET) to be available globally (via CDN) or you can provide a wrapper that imports it.
// - It stores the effect instance on the target element as el._vantaEffect so it can be destroyed safely.

const DEFAULTS = {
  // default target selector
  selector: '#vanta-bg',
  // visual defaults (match your Tailwind palette)
  color: 0x355f9f,         // deep-500
  backgroundColor: 0x0B1220, // surface.dark
  // Vanta.NET specific options (you can override via opts)
  points: 12.0,
  maxDistance: 20.0,
  spacing: 18.0,
  showDots: true,
  // performance / behavior
  mouseControls: true,
  touchControls: true,
  minHeight: 200.0,
  minWidth: 200.0,
  scale: 1.0,
  scaleMobile: 1.0,
  // disable Vanta on very small screens to save battery/CPU
  mobileDisableWidth: 600,
};

/**
 * Normalize hex-like input (0x.. or '#rrggbb' or number) to number for Vanta options.
 */
function parseColorHex(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (s.startsWith('0x')) return parseInt(s, 16);
    if (s.startsWith('#')) return parseInt(s.slice(1), 16);
    const num = Number(s);
    if (!Number.isNaN(num)) return num;
  }
  return DEFAULTS.color;
}

function getElement(selectorOrEl) {
  if (!selectorOrEl) return null;
  if (typeof selectorOrEl === 'string') return document.querySelector(selectorOrEl);
  if (selectorOrEl instanceof Element) return selectorOrEl;
  return null;
}

/**
 * initVanta(selectorOrEl, opts)
 * - selectorOrEl: CSS selector string or Element. default: '#vanta-bg'
 * - opts: overrides for DEFAULTS and VANTA.NET options
 */
export async function initVanta(selectorOrEl = DEFAULTS.selector, opts = {}) {
  const el = getElement(selectorOrEl);
  if (!el) {
    console.info('Vanta init: target element not found for', selectorOrEl);
    return null;
  }

  const options = Object.assign({}, DEFAULTS, opts || {});
  // Respect mobile disable threshold
  if (window.innerWidth < options.mobileDisableWidth) {
    // If there is an existing effect, destroy to free resources
    if (el._vantaEffect && typeof el._vantaEffect.destroy === 'function') {
      try { el._vantaEffect.destroy(); } catch (err) { /* ignore */ }
      delete el._vantaEffect;
      console.info('Vanta: destroyed instance due to small screen width.');
    }
    console.info('Vanta init skipped: screen width < mobileDisableWidth');
    return null;
  }

  // Ensure VANTA.NET is available
  if (!window.VANTA || !window.VANTA.NET) {
    console.warn('Vanta not found on window. Ensure you loaded Vanta script (vanta.net.min.js) before calling initVanta.');
    return null;
  }

  // destroy previous effect on this element if present
  if (el._vantaEffect && typeof el._vantaEffect.destroy === 'function') {
    try {
      el._vantaEffect.destroy();
    } catch (err) {
      console.warn('Vanta previous instance destroy error:', err);
    }
    delete el._vantaEffect;
  }

  // prepare final options to pass to VANTA.NET
  const vantaOpts = {
    el,
    color: parseColorHex(options.color),
    backgroundColor: parseColorHex(options.backgroundColor),
    points: options.points,
    maxDistance: options.maxDistance,
    spacing: options.spacing,
    showDots: options.showDots,
    mouseControls: options.mouseControls,
    touchControls: options.touchControls,
    minHeight: options.minHeight,
    minWidth: options.minWidth,
    scale: options.scale,
    scaleMobile: options.scaleMobile,
  };

  // Allow additional VANTA options provided by caller (merge)
  // but don't overwrite `el`.
  const allowedExtra = Object.assign({}, opts);
  delete allowedExtra.selector;
  delete allowedExtra.mobileDisableWidth;
  delete allowedExtra.color;
  delete allowedExtra.backgroundColor;

  Object.assign(vantaOpts, allowedExtra);

  try {
    // create instance and save reference on element
    el._vantaEffect = window.VANTA.NET(vantaOpts);
    // return the instance for optional further handling
    return el._vantaEffect;
  } catch (err) {
    console.error('Vanta.NET initialization failed:', err);
    return null;
  }
}

/**
 * destroyVanta(selectorOrEl)
 * - destroys any Vanta instance attached to element
 */
export function destroyVanta(selectorOrEl = DEFAULTS.selector) {
  const el = getElement(selectorOrEl);
  if (!el) return;
  if (el._vantaEffect && typeof el._vantaEffect.destroy === 'function') {
    try {
      el._vantaEffect.destroy();
    } catch (err) {
      console.warn('Error destroying Vanta instance:', err);
    } finally {
      delete el._vantaEffect;
    }
  }
}

/**
 * reinitVanta(selectorOrEl, opts)
 * - convenience: destroy then init (useful on resize)
 */
export async function reinitVanta(selectorOrEl = DEFAULTS.selector, opts = {}) {
  destroyVanta(selectorOrEl);
  // small delay to allow cleanup on some environments
  await new Promise((r) => setTimeout(r, 60));
  return await initVanta(selectorOrEl, opts);
}
