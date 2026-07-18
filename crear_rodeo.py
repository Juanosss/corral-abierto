#!/usr/bin/env python3
import os
import shutil
import json
import urllib.request

def main():
    print("==================================================")
    print("🚀 AUTOMATIZACIÓN DE NUEVOS RODEOS - CORRAL ABIERTO")
    print("==================================================")
    
    rodeo_id = input("\n1. Escribe el ID del Rodeo (minúsculas, con guiones, ej: clasificatorio-oriente-2026):\n> ").strip().lower().replace(" ", "-")
    if not rodeo_id:
        print("❌ El ID no puede estar vacío.")
        return
        
    nombre = input("\n2. Escribe el Nombre del Rodeo (ej: Clasificatorio Oriente 2026):\n> ").strip()
    if not nombre:
        print("❌ El nombre no puede estar vacío.")
        return

    logo_url = input("\n3. Pega la URL del Logo (Opcional, presiona Enter para omitir):\n> ").strip()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    source_folder = os.path.join(base_dir, "champion-chile")
    dest_folder = os.path.join(base_dir, rodeo_id)

    if not os.path.exists(source_folder):
        print(f"❌ No se encontró la carpeta plantilla 'champion-chile' en: {source_folder}")
        return

    if os.path.exists(dest_folder):
        print(f"⚠️ La carpeta física '{rodeo_id}' ya existe. No se sobreescribirá.")
    else:
        print(f"\n📂 Duplicando plantillas de 'champion-chile' hacia '/{rodeo_id}'...")
        try:
            shutil.copytree(source_folder, dest_folder)
            print(f"✅ ¡Carpeta física '/{rodeo_id}' creada con éxito!")
        except Exception as e:
            print(f"❌ Error al copiar la carpeta: {e}")
            return

    print("\n🌐 Registrando el rodeo en Supabase...")
    supabase_url = "https://hphtzcuwyixcxpaskprj.supabase.co/rest/v1/rodeos"
    anon_key = "sb_publishable__swYk_OxwILPUBbsAk9YKQ_EEH_ZDe_"
    
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    rodeo_data = {
        "id": rodeo_id,
        "nombre": nombre,
        "activo": True,
        "logo_url": logo_url,
        "toro1": True,
        "toro2": True,
        "toro3": True,
        "toro4": True
    }
    
    req_data = json.dumps([rodeo_data]).encode('utf-8')
    req = urllib.request.Request(supabase_url, data=req_data, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            if status in [200, 201]:
                print("✅ ¡Rodeo registrado en Supabase correctamente!")
            else:
                print(f"⚠️ Supabase respondió con código de estado: {status}")
    except Exception as e:
        print(f"❌ Error al conectar con Supabase: {e}")
        print("⚠️ El rodeo se guardó localmente. Si no subió a Supabase, asegúrate de tener conexión a internet.")

    print("\n==================================================")
    print("🎉 ¡TODO LISTO!")
    print(f"1. Abre GitHub Desktop para hacer Commit de la nueva carpeta '/{rodeo_id}'.")
    print("2. Presiona 'Push origin' para subirlo a internet.")
    print("==================================================")

if __name__ == "__main__":
    main()
