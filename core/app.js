document.addEventListener("DOMContentLoaded", async () => {
    // 1. Ambil nama folder klien (?c=budi-ani) & nama tamu (?to=Bapak+Ahmad) dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const clientFolder = urlParams.get('c');
    const guestName = urlParams.get('to');

    // 2. Jika parameter ?c= tidak ada di URL
    if (!clientFolder) {
        document.getElementById('app').innerHTML = `
            <div style="text-align:center; padding: 60px 20px; font-family: sans-serif;">
                <h2 style="color: #e74c3c; margin-bottom: 10px;">Undangan Tidak Ditemukan</h2>
                <p style="color: #666;">Silakan gunakan tautan lengkap dengan parameter klien.<br>Contoh: <code>?c=budi-ani</code></p>
            </div>`;
        return;
    }

    try {
        const basePath = `clients/${clientFolder}/`;

        // 3. Ambil data.json milik klien
        const response = await fetch(`${basePath}data.json`);
        if (!response.ok) {
            throw new Error(`File 'data.json' tidak ditemukan di path: ${basePath}data.json`);
        }
        const clientData = await response.json();

        // 4. Tentukan tema (default: royal-vintage)
        const theme = clientData.theme || 'royal-vintage';

        // 5. Load HTML Template Tema
        const templateResponse = await fetch(`templates/${theme}/index.html`);
        if (!templateResponse.ok) {
            throw new Error(`File template 'templates/${theme}/index.html' tidak ditemukan.`);
        }
        const templateHtml = await templateResponse.text();

        // 6. Muat CSS Tema secara dinamis
        const themeCss = document.createElement('link');
        themeCss.rel = 'stylesheet';
        themeCss.href = `templates/${theme}/style.css`;
        document.head.appendChild(themeCss);

        // 7. Inject HTML Template ke dalam container #app
        document.getElementById('app').innerHTML = templateHtml;

        // 8. Masukkan data dari JSON ke elemen HTML (Data Binding)
        bindDataToTemplate(clientData, basePath);

        // 9. Jika ada parameter nama tamu (&to=...)
        if (guestName) {
            const guestEl = document.getElementById('nama-tamu');
            if (guestEl) {
                guestEl.innerText = decodeURIComponent(guestName.replace(/\+/g, ' '));
            }
        }

    } catch (error) {
        console.error("Error App:", error);
        document.getElementById('app').innerHTML = `
            <div style="text-align:center; padding: 60px 20px; font-family: sans-serif;">
                <h2 style="color: #e74c3c; margin-bottom: 10px;">Gagal Memuat Undangan</h2>
                <p style="color: #666; max-width: 500px; margin: 0 auto; font-size: 0.95rem;">${error.message}</p>
            </div>`;
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

        if (val !== null && val !== undefined) {
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
