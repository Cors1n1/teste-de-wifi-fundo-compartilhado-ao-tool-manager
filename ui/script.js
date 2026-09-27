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
    
    // Default fallback: remove o fundo da capa, mas MANTÉM as cores da última música
    document.body.classList.remove('theme-spotify-cover');
    document.documentElement.style.setProperty('--sp-bg-img', 'none');
    // document.documentElement.style.setProperty('--accent-rgb', '0, 229, 255');
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



// Tabs Logic
function switchTab(btn, tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
    
    if (tabId === 'radar') {
        startRadar();
    } else {
        stopRadar();
    }
}

// Radar Logic
const servers = [
    { id: 'custom', name: 'Servidor 72.60', ip: '72.60.248.73', icon: 'fa-server', color: '#9b59b6' },
    { id: 'lol', name: 'League of Legends BR', ip: '104.160.152.3', icon: 'fa-gamepad', color: '#e67e22' },
    { id: 'discord', name: 'Discord API', ip: 'discord.com', icon: 'fa-discord', color: '#5865F2' },
    { id: 'cloudflare', name: 'Cloudflare', ip: '1.1.1.1', icon: 'fa-cloud', color: '#f39c12' },
    { id: 'google', name: 'Google DNS', ip: '8.8.8.8', icon: 'fa-google', color: '#3498db' }
];

let radarInterval = null;

function renderRadar() {
    const list = document.getElementById('radarList');
    list.innerHTML = servers.map(s => `
        <div class="radar-item" id="server-${s.id}">
            <div class="radar-info">
                <div class="radar-icon" style="color: ${s.color}; border: 1px solid ${s.color}40; box-shadow: 0 0 10px ${s.color}20;">
                    <i class="${['fa-discord', 'fa-google'].includes(s.icon) ? 'fa-brands' : 'fa-solid'} ${s.icon}"></i>
                </div>
                <div>
                    <div class="radar-name">${s.name}</div>
                    <div class="radar-desc">${s.ip}</div>
                </div>
            </div>
            <div class="radar-ping">
                <div class="ping-value" id="ping-${s.id}">-- <small style="font-size: 9px; color: var(--text-dim);">ms</small></div>
                <div class="ping-status" id="status-${s.id}">Aguardando...</div>
            </div>
        </div>
    `).join('');
}

async function pingAll() {
    for (const s of servers) {
        try {
            const ms = await window.api.pingServer(s.ip);
            const valEl = document.getElementById(`ping-${s.id}`);
            const statEl = document.getElementById(`status-${s.id}`);
            if (ms >= 0) {
                valEl.innerHTML = `${ms} <small style="font-size: 9px; color: var(--text-dim);">ms</small>`;
                valEl.className = 'ping-value ' + (ms < 50 ? 'good' : (ms < 100 ? 'warn' : 'bad'));
                statEl.innerText = ms < 50 ? 'Excelente' : (ms < 100 ? 'Razoável' : 'Ruim');
                statEl.style.color = ms < 50 ? 'var(--success)' : (ms < 100 ? '#f1c40f' : '#e74c3c');
            } else {
                valEl.innerHTML = `ERR`;
                valEl.className = 'ping-value bad';
                statEl.innerText = 'Offline / Falha';
                statEl.style.color = '#e74c3c';
            }
        } catch (e) {}
    }
}

function startRadar() {
    if (radarInterval) return;
    if (document.getElementById('radarList').children.length === 0) {
        renderRadar();
    }
    pingAll();
    radarInterval = setInterval(pingAll, 5000); // Ping every 5s while active
}

function stopRadar() {
    if (radarInterval) {
        clearInterval(radarInterval);
        radarInterval = null;
    }
}

// Network Logic
let networkInfoLoaded = false;
async function loadNetworkInfo() {
    if (networkInfoLoaded) return;
    try {
        const info = await window.api.getNetworkInfo();
        document.getElementById('netInterface').textContent = info.ifaceName;
        document.getElementById('netLocalIp').textContent = info.localIp;
        document.getElementById('netPublicIp').textContent = info.publicIp;
        networkInfoLoaded = true;
    } catch (e) {
        document.getElementById('netInterface').textContent = 'Erro ao carregar';
    }
}

function copyIp(type) {
    const el = document.getElementById(type === 'local' ? 'netLocalIp' : 'netPublicIp');
    if (el && el.textContent && el.textContent !== '...' && el.textContent !== 'Erro') {
        window.api.copyText(el.textContent);
        const originalText = el.textContent;
        el.innerHTML = '<span style="color: var(--success);">Copiado!</span>';
        setTimeout(() => {
            el.textContent = originalText;
        }, 1500);
    }
}

async function doRepair() {
    const btn = document.getElementById('repairBtn');
    if (btn.disabled) return;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reparando...';
    
    const success = await window.api.repairNetwork();
    
    if (success) {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> DNS Limpo & Reparado!';
        btn.style.color = 'var(--success)';
        btn.style.borderColor = 'var(--success)';
        btn.style.background = 'rgba(0, 255, 170, 0.1)';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Falha ao Reparar';
    }
    
    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-screwdriver-wrench"></i> Limpar DNS e Reparar';
        btn.style = '';
    }, 3000);
}

// Intercept switchTab to load network info
const originalSwitchTab = switchTab;
window.switchTab = function(btn, tabId) {
    originalSwitchTab(btn, tabId);
    if (tabId === 'network') {
        loadNetworkInfo();
    }
};
