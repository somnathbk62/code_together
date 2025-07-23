// Debounce utility
export default function debounce(fn, wait) {
  let timeout;
  function debounced(...args) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  }
  debounced.cancel = () => timeout && clearTimeout(timeout);
  return debounced;
} 