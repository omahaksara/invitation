document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientFolder = urlParams.get('c');

    if (!clientFolder) {
        document.getElementById('app').innerHTML = '<div class="error-msg"><h2>Undangan tidak ditemukan.</h2></div>';
        return;
    }

    try {
        const basePath = `public/clients/${clientFolder}/`;
        
        // 1. Ambil data klien
        const response = await fetch(`${basePath}data.json`);
        if (!response.ok) throw new Error("Data klien tidak ditemukan");
        const clientData = await response.json();

        // 2. Ambil template yang ditentukan di data.json
        const theme = clientData.theme || 'royal-vintage';
        const templateResponse = await fetch(`templates/${theme}/index.html`);
        const templateHtml = await templateResponse.text();

        // 3. Inject CSS Tema
        const themeCss = document.createElement('link');
        themeCss.rel = 'stylesheet';
        themeCss.href = `templates/${theme}/style.css`;
        document.head.appendChild(themeCss);

        // 4. Render HTML Template
        document.getElementById('app').innerHTML = templateHtml;

        // 5. Isi Data Otomatis ke Element yang Memiliki Attribute data-bind
        bindDataToTemplate(clientData, basePath);

    } catch (err) {
        console.error(err);
        document.getElementById('app').innerHTML = '<div class="error-msg"><h2>Gagal memuat undangan.</h2></div>';
    }
});

// Fungsi otomatisasi binding data berdasarkan tag `data-bind`
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
