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
* `/ui`: Interface gráfica (HTML/CSS/JS).
* `backend.py`: Script Python responsável pela execução do teste de velocidade.
* `main.js` / `preload.js`: Ciclo de vida da aplicação Electron e integração entre processos.
* `start.bat`: Script de automação para preparação do ambiente.

## Requisitos
* Python 3 instalado no sistema.
* Node.js / NPM.
* As dependências do Python (`speedtest-cli`) são gerenciadas durante o processo de inicialização automática.
