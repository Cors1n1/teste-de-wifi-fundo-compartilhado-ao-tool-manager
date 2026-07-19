import sys
import json
import speedtest
import logging

# Ensure we don't pollute stdout with logs, only JSON
logging.basicConfig(level=logging.ERROR)

def emit(event, data=None):
    message = {"event": event}
    if data is not None:
        message["data"] = data
    print(json.dumps(message))
    sys.stdout.flush()

def run_test():
    try:
        emit("status", "Inicializando Speedtest...")
        st = speedtest.Speedtest()
        
        emit("status", "Buscando o melhor servidor...")
        st.get_best_server()
        server = st.results.server
        emit("server_info", {
            "sponsor": server.get("sponsor", "Desconhecido"),
            "name": server.get("name", "Desconhecido"),
            "country": server.get("country", "Desconhecido"),
            "host": server.get("host", ""),
            "latency": server.get("latency", 0.0)
        })

        emit("status", "Testando Download...")
        download_speed = st.download()
        emit("progress_download", download_speed)

        emit("status", "Testando Upload...")
        upload_speed = st.upload()
        emit("progress_upload", upload_speed)

        emit("status", "Finalizando...")
        
        results = st.results.dict()
        
        emit("done", {
            "download": results["download"],
            "upload": results["upload"],
            "ping": results["ping"],
            "server": results["server"]["sponsor"] + " - " + results["server"]["name"]
        })

    except Exception as e:
        emit("error", str(e))

if __name__ == "__main__":
    run_test()
