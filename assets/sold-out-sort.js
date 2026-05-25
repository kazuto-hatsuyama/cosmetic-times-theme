/**
 * Moves sold-out products to the end of each .product-grid.
 * Runs on initial load and on every infinite-scroll append via MutationObserver.
 */
(function () {
  let sorting = false;

  function sortSoldOut(grid) {
    const soldOut = Array.from(grid.children).filter(
      (el) => el.dataset.available === 'false'
    );
    if (!soldOut.length) return;
    sorting = true;
    soldOut.forEach((el) => grid.appendChild(el));
    sorting = false;
  }

  const observer = new MutationObserver((mutations) => {
    if (sorting) return;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        sortSoldOut(/** @type {HTMLElement} */ (mutation.target));
        break;
      }
    }
  });

  function init() {
    document.querySelectorAll('.product-grid').forEach((grid) => {
      sortSoldOut(grid);
      observer.observe(grid, { childList: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
