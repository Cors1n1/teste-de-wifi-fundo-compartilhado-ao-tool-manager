const fs = require('fs');
const path = require('path');

const sourceCSS = path.join('C:', 'Users', 'Corsini', 'Desktop', 'tool_manager', 'ui', 'style.css');
const destCSS = path.join(__dirname, 'ui', 'style.css');

try {
    if (fs.existsSync(sourceCSS)) {
        const cssContent = fs.readFileSync(sourceCSS, 'utf8');
        fs.writeFileSync(destCSS, cssContent, 'utf8');
        console.log('✅ Estilo sincronizado com sucesso do Tool Manager!');
    } else {
        console.log('⚠️ Arquivo style.css do Tool Manager não encontrado em:', sourceCSS);
    }
} catch (error) {
    console.error('Erro ao sincronizar estilo:', error);
}
