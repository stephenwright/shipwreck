
/**
 * Catch link clicks, prevent navigation, and call a callback function
 * @param {string} origin - base location that will be intercepted
 * @param {function} callback - function to be called when a click occurs
 * @returns cleanup function
 */
export const intercept = (origin, callback) => {
  const clickHandler = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }

    const [anchor] = e.composedPath().filter((n) => n.tagName === 'A');
    if (!anchor || anchor.target ||
        anchor.hasAttribute('download') ||
        anchor.getAttribute('rel') === 'external') {
      return;
    }

    const { href } = anchor;
    if (!href || href.indexOf('mailto:') !== -1) {
      return;
    }

    const { location } = window;
    const o = origin || location.origin || `${location.protocol}//${location.host}`;
    const url = new URL(href, location.origin);

    if (url.origin !== o) {
      return;
    }

    e.preventDefault();

    callback(href);
  };

  document.body.addEventListener('click', clickHandler);

  return {
    remove: () => document.body.removeEventListener('click', clickHandler),
  };
};
