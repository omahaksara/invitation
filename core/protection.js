// Mencegah klik kanan
document.addEventListener('contextmenu', e => e.preventDefault());

// Mencegah website dimasukkan ke dalam iframe domain lain
if (window.top !== window.self) {
    window.top.location = window.self.location;
}
