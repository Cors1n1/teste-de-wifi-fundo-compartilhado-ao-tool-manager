# Teste WiFi Portátil

Aplicação desktop leve para medição de velocidade de rede (Speedtest), utilizando Electron para a interface e Python para o processamento dos testes.

## Instalação e Configuração
A instalação e configuração são **AUTOMÁTICAS**.

Para iniciar o projeto pela primeira vez:
1. Execute o arquivo **`start.bat`**.
2. O script irá configurar automaticamente o ambiente Node.js, instalar as dependências necessárias e iniciar a aplicação.

## Como utilizar
* **Execução**: Utilize o `start.bat` para abrir a interface.
* **Interface**: O aplicativo roda como um utilitário de bandeja (system tray). Clique no ícone para exibir a janela de medição.
* **Testes**: Ao abrir, inicie o teste através da interface. O backend Python executará o `speedtest-cli` e enviará os resultados em tempo real via IPC (Inter-Process Communication) para o front-end.

## Estrutura do Projeto
* `ookla/`: Documentação específica do motor de testes Speedtest.
* `ui/`: Interface gráfica (HTML, CSS e lógica frontend).
* `.gitignore`: Definições de arquivos ignorados pelo versionamento (incluindo dependências, builds e configurações de IDE).
* `backend.py`: Script Python responsável pela execução do teste de velocidade.
* `main.js`: Ponto de entrada do Electron, gerenciamento de janelas e IPC (incluindo lógica para ping contínuo).
* `preload.js`: Ponte de segurança entre o Node.js e o frontend, expondo novas APIs de ping contínuo e controle de janela.
* `package.json` / `package-lock.json`: Definições e versões das dependências do Node.js.
* `requirements.txt`: Lista de dependências Python.
* `speedtest.exe`: Binário auxiliar para testes de rede.
* `start.bat`: Script de automação para instalação e inicialização.
* `sync.js`: Utilitário de sincronização de dados.
* `window-snapper.js`: Lógica para o comportamento "magnético" da janela.

## Dependências
- **Python**: `speedtest-cli`
- **Node.js**: Electron, `child_process`, `os` (gerenciadas via `package.json`)

## 📋 Histórico de Atualizações

### 🔄 Atualização (28/09/2026)
- Implementação de funcionalidade de Ping Contínuo (`start-continuous-ping`) via IPC.
- Atualização da `preload.js` para expor métodos de controle de janela (fixar, esconder) e monitoramento de ping.
- Ajustes de CSS na interface para otimização em telas de 320x220 pixels.
- Adição de menu de temas e botões de controle de janela no `index.html`.

### 🔄 Atualização (27/09/2026)
- Refatoração da estrutura do projeto para incluir suporte a `WindowSnapper`, nova lógica de IPC (ping e reparo de rede) e integração com a API `ipify` para status da rede em tempo real.
- Atualização do `.gitignore` para ignorar novos arquivos de build, logs e pastas de IDE.
- Implementação de `single-instance-lock` para evitar múltiplas execuções do aplicativo.
- Otimização do gerenciamento de tray icon e comportamentos da janela (tamanho e foco).
