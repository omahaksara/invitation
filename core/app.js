document.addEventListener("DOMContentLoaded", async () => {
    // 1. Ambil nama folder klien dari URL (contoh: ?c=budi-ani)
    const urlParams = new URLSearchParams(window.location.search);
    const clientFolder = urlParams.get('c');

    if (!clientFolder) {
        document.getElementById('app').innerHTML = '<div style="text-align:center; padding: 50px;"><h2>Undangan tidak ditemukan.</h2></div>';
        return;
    }

    try {
        // Path langsung ke folder clients/
        const basePath = `clients/${clientFolder}/`;

        // 2. Ambil data.json milik klien
        const response = await fetch(`${basePath}data.json`);
        if (!response.ok) throw new Error("Data klien tidak ditemukan");
        const clientData = await response.json();

        // 3. Tentukan tema (default: royal-vintage jika tidak diisi)
        const theme = clientData.theme || 'royal-vintage';

        // 4. Load HTML & CSS Tema
        const templateResponse = await fetch(`templates/${theme}/index.html`);
        const templateHtml = await templateResponse.text();

        const themeCss = document.createElement('link');
        themeCss.rel = 'stylesheet';
        themeCss.href = `templates/${theme}/style.css`;
        document.head.appendChild(themeCss);

        // 5. Tampilkan template ke layar
        document.getElementById('app').innerHTML = templateHtml;

        // 6. Masukkan data teks/gambar dari JSON ke elemen HTML
        bindDataToTemplate(clientData, basePath);

    } catch (error) {
        console.error(error);
        document.getElementById('app').innerHTML = '<div style="text-align:center; padding: 50px;"><h2>Gagal memuat data undangan.</h2></div>';
    }
});

// Fungsi Otomatisasi Mengisi Data dari JSON ke HTML
function bindDataToTemplate(data, basePath) {
    document.querySelectorAll('[data-bind]').forEach(el => {
        const keyPath = el.getAttribute('data-bind').split('.');
        let val = data;

        for (const k of keyPath) {
            val = val ? val[k] : null;
        }

        if (val) {
            if (el.tagName === 'IMG') {
                el.src = basePath + val;
            } else if (el.tagName === 'AUDIO') {
                el.src = basePath + val;
            } else if (el.tagName === 'A') {
                el.href = val;
            } else {
                el.innerText = val;
            }
        }
    });
}
