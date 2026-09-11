// Practical contrast audit for solid backgrounds; imagery/gradients need visual review.
(() => {
  const rgb = color => (color.match(/[\d.]+/g) || []).map(Number);
  const luminance = color => color.slice(0, 3).map(value => { const n = value / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  const background = element => {
    if (!element) return [255, 255, 255];
    const c = rgb(getComputedStyle(element).backgroundColor);
    if (c.length === 3 || c[3] === 1) return c;
    const base = background(element.parentElement);
    return c.slice(0, 3).map((v, i) => v * (c[3] || 0) + base[i] * (1 - (c[3] || 0)));
  };
  const walker = document.createTreeWalker(document.querySelector('.tp'), NodeFilter.SHOW_TEXT);
  const elements = new Set();
  while (walker.nextNode()) if (walker.currentNode.textContent.trim()) elements.add(walker.currentNode.parentElement);
  const results = [];
  for (const element of elements) {
    if (!element.checkVisibility() || element.closest('.tp-forge-hero,.tp-final-cta,.tp-wellness-statement')) continue;
    const style = getComputedStyle(element);
    const a = luminance(rgb(style.color)), b = luminance(background(element));
    const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
    results.push({text:element.textContent.trim().slice(0, 70), ratio:+ratio.toFixed(2), pass:ratio >= (large ? 3 : 4.5)});
  }
  return {path:location.pathname, checked:results.length, failures:results.filter(item => !item.pass), minimum:Math.min(...results.map(item => item.ratio)), reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches, animations:document.getAnimations().length};
})()
