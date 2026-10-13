// Disable right click
document.addEventListener('contextmenu', e => e.preventDefault());

// Disable inspect
document.addEventListener('keydown', e => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) ||
    (e.ctrlKey && ['U','S'].includes(e.key))
  ) {
    e.preventDefault();
  }
});

// Anti drag image
document.querySelectorAll('img').forEach(img => {
  img.setAttribute('draggable', 'false');
});

// Fake warning
console.log(
  "%cSTOP!",
  "color:red;font-size:48px;font-weight:bold;"
);

console.log(
  "%cProtected by Omah Aksara Engine © 2026",
  "font-size:14px;"
);
