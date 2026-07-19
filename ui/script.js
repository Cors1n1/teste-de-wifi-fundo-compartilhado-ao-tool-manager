document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const pingValue = document.getElementById('pingValue');
    const downloadValue = document.getElementById('downloadValue');
    const uploadValue = document.getElementById('uploadValue');
    const statusText = document.getElementById('statusText');
    const serverInfo = document.getElementById('serverInfo');

    startBtn.addEventListener('click', () => {
        // Reset UI
        startBtn.disabled = true;
        startBtn.textContent = 'Testando...';
        pingValue.innerHTML = '-- <small>ms</small>';
        downloadValue.innerHTML = '-- <small>Mbps</small>';
        uploadValue.innerHTML = '-- <small>Mbps</small>';
        serverInfo.textContent = '';
        
        // Call main process via preload bridge
        window.api.startTest();
    });

    window.api.onTestEvent((data) => {
        if (!data || !data.event) return;

        switch (data.event) {
            case 'status':
                statusText.textContent = data.data;
                break;
                
            case 'server_info':
                const info = data.data;
                serverInfo.textContent = `${info.sponsor} - ${info.name} (${info.country})`;
                if (info.latency) {
                    pingValue.innerHTML = `${info.latency.toFixed(1)} <small>ms</small>`;
                }
                break;
                
            case 'progress_download':
                // Convert bps to Mbps
                const dlMbps = (data.data / 1000000).toFixed(2);
                downloadValue.innerHTML = `${dlMbps} <small>Mbps</small>`;
                break;
                
            case 'progress_upload':
                // Convert bps to Mbps
                const ulMbps = (data.data / 1000000).toFixed(2);
                uploadValue.innerHTML = `${ulMbps} <small>Mbps</small>`;
                break;
                
            case 'done':
                const final = data.data;
                pingValue.innerHTML = `${final.ping.toFixed(1)} <small>ms</small>`;
                downloadValue.innerHTML = `${(final.download / 1000000).toFixed(2)} <small>Mbps</small>`;
                uploadValue.innerHTML = `${(final.upload / 1000000).toFixed(2)} <small>Mbps</small>`;
                statusText.textContent = 'Teste concluído!';
                startBtn.disabled = false;
                startBtn.textContent = 'Testar Novamente';
                break;
                
            case 'error':
                statusText.textContent = 'Erro: ' + data.data;
                startBtn.disabled = false;
                startBtn.textContent = 'Tentar Novamente';
                break;
        }
    });
});

// ===========================
// Spotify Theme Sync
// ===========================
async function syncSpotifyTheme() {
    try {
        const res = await fetch(`http://127.0.0.1:5555/spotify/me/player`);
        if (res.ok) {
            const data = await res.json();
            if (data.item && data.item.album && data.item.album.images.length > 0) {
                const coverUrl = data.item.album.images[0].url;
                updateDominantColor(coverUrl);
                document.body.classList.add('theme-spotify-cover');
                document.documentElement.style.setProperty('--sp-bg-img', `url('${coverUrl}')`);
                return;
            }
        }
    } catch(e) {}
    
    // Default fallback
    document.body.classList.remove('theme-spotify-cover');
    document.documentElement.style.setProperty('--sp-bg-img', 'none');
    document.documentElement.style.setProperty('--accent-rgb', '0, 229, 255');
}

function updateDominantColor(imgSrc) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        try {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let r=0, g=0, b=0, count=0;
            const step = 4 * 10;
            for (let i = 0; i < data.length; i += step) {
                const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
                if (brightness > 20 && brightness < 235) {
                    r += data[i]; g += data[i+1]; b += data[i+2]; count++;
                }
            }
            if(count > 0) {
                r = Math.floor(r/count);
                g = Math.floor(g/count);
                b = Math.floor(b/count);
                const max = Math.max(r, g, b);
                if (max > 0) {
                    const factor = 255 / max * 0.8; 
                    r = Math.min(255, Math.floor(r * factor));
                    g = Math.min(255, Math.floor(g * factor));
                    b = Math.min(255, Math.floor(b * factor));
                }
                document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
            }
        } catch(e) {}
    };
    img.src = imgSrc;
}
setInterval(syncSpotifyTheme, 3000);
syncSpotifyTheme();
