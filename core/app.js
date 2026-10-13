document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let clientFolder = urlParams.get('c');
    const guestName = urlParams.get('to');

    // 1. Validasi parameter ?c=
    if (!clientFolder) {
        renderError("Undangan Tidak Ditemukan", "Parameter klien tidak terdeteksi pada URL. Contoh: ?c=budi-ani");
        return;
    }

    try {
        // Menggunakan path absolut khusus GitHub Pages agar tidak tertukar/error
        const originUrl = window.location.origin;
        const basePath = `${originUrl}/invitation/clients/${clientFolder}/`;

        // 2. Fetch data.json
        const resData = await fetch(`${basePath}data.json`);
        if (!resData.ok) {
            throw new Error(`File 'data.json' tidak ditemukan di path: clients/${clientFolder}/data.json`);
        }
        const clientData = await resData.json();

        // 3. Fetch Template
        const theme = clientData.theme || 'royal-vintage';
        const templatePath = `${originUrl}/invitation/templates/${theme}/`;
        
        const resTemplate = await fetch(`${templatePath}index.html`);
        if (!resTemplate.ok) {
            throw new Error(`Template '${theme}' tidak ditemukan di: templates/${theme}/index.html`);
        }
        const templateHtml = await resTemplate.text();

        // Inject CSS Tema
        const themeCss = document.createElement('link');
        themeCss.rel = 'stylesheet';
        themeCss.href = `${templatePath}style.css`;
        document.head.appendChild(themeCss);

        // Render HTML ke #app
        document.getElementById('app').innerHTML = templateHtml;

        // 4. Data Binding
        bindData(clientData, basePath);

        // 5. Render Nama Tamu
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
        <div style="text-align:center; padding: 60px 20px; font-family: sans-serif; background: #181314; color: #E0A996; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;">
            <h2 style="color: #e74c3c; margin-bottom: 12px; font-size: 1.6rem;">${title}</h2>
            <p style="color: #FCE8E3; max-width: 500px; margin: 0 auto; line-height: 1.5; font-size: 0.95rem; opacity: 0.85;">${message}</p>
        </div>`;
}
