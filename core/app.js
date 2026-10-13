document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientFolder = urlParams.get('c');
    const guestName = urlParams.get('to');

    if (!clientFolder) {
        renderError("Undangan Tidak Ditemukan", "Parameter klien (?c=nama-klien) tidak terdeteksi pada URL.");
        return;
    }

    try {
        const basePath = `clients/${clientFolder}/`;

        // 1. Fetch data.json klien
        const resData = await fetch(`${basePath}data.json`);
        if (!resData.ok) throw new Error(`File 'data.json' tidak ditemukan di folder '${basePath}'`);
        const clientData = await resData.json();

        // 2. Load Template HTML & CSS
        const theme = clientData.theme || 'royal-vintage';
        const resTemplate = await fetch(`templates/${theme}/index.html`);
        if (!resTemplate.ok) throw new Error(`Template '${theme}' tidak ditemukan.`);
        
        const templateHtml = await resTemplate.text();

        // Inject CSS Tema secara dinamis
        const themeCss = document.createElement('link');
        themeCss.rel = 'stylesheet';
        themeCss.href = `templates/${theme}/style.css`;
        document.head.appendChild(themeCss);

        // Render HTML ke elemen #app
        document.getElementById('app').innerHTML = templateHtml;

        // 3. Bind Data JSON ke Elemen HTML
        bindData(clientData, basePath);

        // 4. Render Nama Tamu
        const finalGuestName = guestName 
            ? decodeURIComponent(guestName.replace(/\+/g, ' ')) 
            : (clientData.guest ? clientData.guest.defaultName : "Tamu Undangan");

        document.querySelectorAll('#nama-tamu, [data-bind="guest.name"]').forEach(el => {
            el.innerText = finalGuestName;
        });

    } catch (err) {
        console.error(err);
        renderError("Gagal Memuat Undangan", err.message);
    }
});

// Fungsi Auto Data Binding
function bindData(data, basePath) {
    document.querySelectorAll('[data-bind]').forEach(el => {
        const keyPath = el.getAttribute('data-bind').split('.');
        let val = data;

        for (const k of keyPath) {
            val = val ? val[k] : null;
        }

        if (val !== null && val !== undefined) {
            if (el.tagName === 'IMG') {
                el.src = (val.startsWith('http://') || val.startsWith('https://')) ? val : basePath + val;
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

function renderError(title, message) {
    document.getElementById('app').innerHTML = `
        <div style="text-align:center; padding: 80px 20px; font-family: sans-serif; background: #181314; color: #E0A996; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <h2 style="color: #e74c3c; margin-bottom: 10px; font-size: 1.5rem;">${title}</h2>
            <p style="color: #FCE8E3; max-width: 480px; margin: 0 auto; font-size: 0.9rem; opacity: 0.8;">${message}</p>
        </div>`;
}
