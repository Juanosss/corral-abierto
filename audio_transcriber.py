import os
import time
import json
import subprocess
import threading
from flask import Flask
import google.generativeai as genai
from supabase import create_client, Client

# Inicializar Flask (Necesario para el Web Service gratuito de Render)
app = Flask(__name__)

# Configuración de variables (puedes pasarlas por variables de entorno o editarlas aquí)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://hphtzcuwyixcxpaskprj.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable__swYk_OxwILPUBbsAk9YKQ_EEH_ZDe_")
YOUTUBE_URL = os.getenv("YOUTUBE_URL", "https://www.youtube.com/watch?v=fJps5TeZlZw")
RODEO_NAME = os.getenv("RODEO_NAME", "Champion de Chile 2026")
RODEO_ID = os.getenv("RODEO_ID", "champion-chile-2026")

# Inicializar clientes si las llaves están presentes
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

@app.route('/')
def health_check():
    """Ruta de estado para que Render mantenga el servicio activo."""
    return {
        "status": "online",
        "bot_running": True,
        "rodeo": RODEO_NAME,
        "stream_url": YOUTUBE_URL
    }, 200

def download_audio_chunk(youtube_url, duration_sec=30, output_path="chunk.mp3"):
    """
    Descarga un fragmento de audio de una transmisión de YouTube.
    """
    print(f"Descargando fragmento de audio de {duration_sec}s desde {youtube_url}...")
    try:
        url_cmd = [
            "yt-dlp", 
            "--extractor-args", "youtube:player-client=ios,android", 
            "-f", "bestaudio", 
            "-g"
        ]
        if os.getenv("USE_LOCAL_COOKIES") == "all" or os.getenv("USE_LOCAL_COOKIES") == "true":
            url_cmd.extend(["--cookies-from-browser", "chrome"])
        url_cmd.append(youtube_url)
        direct_url = subprocess.check_output(url_cmd).decode("utf-8").strip()
        
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", direct_url,
            "-t", str(duration_sec),
            "-vn", "-acodec", "libmp3lame",
            output_path
        ]
        
        subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception as e:
        print(f"Error al capturar audio de YouTube: {e}")
        return False

def process_audio_with_gemini(audio_path, rodeo_name):
    """
    Sube el fragmento de audio a la API de Gemini y extrae los puntajes.
    """
    if not os.path.exists(audio_path) or not GEMINI_API_KEY:
        print("Falta API Key de Gemini o el archivo no existe.")
        return None
        
    print("Enviando audio a Gemini 1.5 Flash...")
    try:
        audio_file = genai.upload_file(path=audio_path)
        
        while audio_file.state.name == "PROCESSING":
            time.sleep(1)
            audio_file = genai.get_file(audio_file.name)
            
        if audio_file.state.name == "FAILED":
            raise ValueError("Carga de audio en Gemini fallida")
            
        prompt = f"""
        Estás escuchando el audio de la transmisión en vivo del rodeo chileno "{rodeo_name}". 
        Identifica si el locutor de la caseta oficial anuncia los resultados de una corrida.
        Busca:
        1. El número de salida de la Collera (ej. "Número 12", "Collera 12").
        2. El número de animal o toro actual (ej. "primer animal", "segundo animal", "tercer animal", "cuarto animal").
        3. Los puntos obtenidos en esta corrida o atajada por el locutor oficial (ej. "8 puntos buenos", "4 puntos buenos", "punto malo").
        
        Responde estrictamente en formato JSON válido, sin bloques de código ```json, con la siguiente estructura:
        {{
            "detected": true/false,
            "rodeo": "{rodeo_name}",
            "numero_collera": entero o null,
            "toro": entero (1-4) o null,
            "puntos_toro": entero o null,
            "total_acumulado": entero o null
        }}
        
        Si en este fragmento no hay locución o no se anuncian puntajes definitivos de forma clara, responde con detected: false.
        """
        
        response = model.generate_content([audio_file, prompt])
        genai.delete_file(audio_file.name)
        
        raw_text = response.text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
            if raw_text.startswith("json"):
                raw_text = raw_text.split("\n", 1)[1].strip()
                
        return json.loads(raw_text)
    except Exception as e:
        print(f"Error procesando audio con Gemini: {e}")
        return None

def update_supabase_score(data, active_rodeo_id):
    """
    Actualiza los puntajes en Supabase.
    """
    if not data or not data.get("detected"):
        return
        
    collera_num = data.get("numero_collera")
    toro_num = data.get("toro")
    puntos = data.get("puntos_toro")
    
    if not collera_num or not toro_num or puntos is None:
        print("Datos insuficientes para actualizar.")
        return
        
    print(f"Actualizando en Supabase: Collera N° {collera_num}, Animal {toro_num} -> {puntos} pts...")
    
    try:
        query = supabase.table("colleras").select("*").eq("n", collera_num).eq("rodeo_id", active_rodeo_id).limit(1).execute()
        if not query.data:
            print(f"No se encontró la collera N° {collera_num} para el rodeo {active_rodeo_id} en Supabase.")
            return
            
        collera = query.data[0]
        
        update_data = {}
        if toro_num == 1:
            update_data["animal1"] = puntos
        elif toro_num == 2:
            update_data["animal2"] = puntos
        elif toro_num == 3:
            update_data["animal3"] = puntos
        elif toro_num == 4:
            update_data["animal4"] = puntos
            
        # Calcular el nuevo total
        a1 = update_data.get("animal1", collera.get("animal1"))
        a2 = update_data.get("animal2", collera.get("animal2"))
        a3 = update_data.get("animal3", collera.get("animal3"))
        a4 = update_data.get("animal4", collera.get("animal4"))
        
        def parse_ptos(val):
            if val is None or str(val).upper() == "X" or str(val).strip() == "":
                return 0
            try:
                return int(val)
            except:
                return 0
                
        resultado = parse_ptos(a1) + parse_ptos(a2) + parse_ptos(a3) + parse_ptos(a4)
        update_data["resultado"] = resultado
        
        supabase.table("colleras").update(update_data).eq("n", collera_num).eq("rodeo_id", active_rodeo_id).execute()
        print("✅ Base de datos actualizada con éxito en Supabase.")
    except Exception as e:
        print(f"Error actualizando Supabase: {e}")

def run_realtime_loop():
    """
    Bucle continuo de escucha en segundo plano.
    """
    print("Iniciando bucle de escucha de audio en segundo plano...")
    chunk_filename = "live_temp_chunk.mp3"
    
    # Espera inicial para asegurar el arranque del servidor web
    time.sleep(5)
    
    while True:
        try:
            if not GEMINI_API_KEY:
                print("Esperando configuración de GEMINI_API_KEY...")
                time.sleep(30)
                continue
                
            success = download_audio_chunk(YOUTUBE_URL, duration_sec=30, output_path=chunk_filename)
            if success:
                result = process_audio_with_gemini(chunk_filename, RODEO_NAME)
                print("Resultados de IA:", result)
                if result and result.get("detected"):
                    update_supabase_score(result, RODEO_ID)
            
            if os.path.exists(chunk_filename):
                os.remove(chunk_filename)
                
            print("Esperando 10 segundos para el siguiente bloque...")
            time.sleep(10)
            
        except Exception as e:
            print(f"Error en el bucle del bot: {e}")
            time.sleep(15)

# Iniciar el bucle del transcriptor en un hilo secundario para no bloquear a Flask
threading.Thread(target=run_realtime_loop, daemon=True).start()

if __name__ == "__main__":
    # Arrancar Flask localmente
    app.run(host="0.0.0.0", port=10000)
