import os
import struct
import sys
from datetime import datetime

def parse_safari_cookies():
    # 1. Localizar el archivo de cookies de Safari
    home = os.path.expanduser("~")
    possible_paths = [
        os.path.join(home, "Library/Containers/com.apple.Safari/Data/Library/Cookies/Cookies.binarycookies"),
        os.path.join(home, "Library/Cookies/Cookies.binarycookies")
    ]
    
    cookie_path = None
    for p in possible_paths:
        if os.path.exists(p):
            cookie_path = p
            break
            
    if not cookie_path:
        print("❌ Error: No se encontró el archivo de cookies de Safari. ¿Has visitado YouTube en Safari?")
        return None

    print(f"Leyendo cookies de Safari en: {cookie_path}")
    
    try:
        with open(cookie_path, 'rb') as f:
            binary_data = f.read()
    except PermissionError:
        print("❌ Error de permisos: Tu terminal no tiene permiso para acceder a los archivos de Safari.")
        print("Para solucionarlo, ve a: Preferencias del Sistema -> Privacidad y Seguridad -> Acceso total al disco, y activa la Terminal.")
        return None
    except Exception as e:
        print(f"❌ Error al abrir el archivo: {e}")
        return None

    if len(binary_data) < 8 or binary_data[:4] != b'cook':
        print("❌ Formato de archivo inválido (no empieza con 'cook').")
        return None

    # Leer páginas
    num_pages = struct.unpack('>i', binary_data[4:8])[0]
    page_sizes = []
    for i in range(num_pages):
        offset = 8 + i * 4
        page_sizes.append(struct.unpack('>i', binary_data[offset:offset+4])[0])

    page_offset = 8 + num_pages * 4
    cookies = []

    for page_size in page_sizes:
        page_data = binary_data[page_offset:page_offset + page_size]
        page_offset += page_size
        
        if len(page_data) < 8:
            continue
            
        num_cookies = struct.unpack('<i', page_data[4:8])[0]
        cookie_offsets = []
        for i in range(num_cookies):
            offset = 8 + i * 4
            cookie_offsets.append(struct.unpack('<i', page_data[offset:offset+4])[0])

        for offset in cookie_offsets:
            cookie_data = page_data[offset:]
            if len(cookie_data) < 48:
                continue
                
            cookie_size = struct.unpack('<i', cookie_data[:4])[0]
            flags = struct.unpack('<i', cookie_data[8:12])[0]
            
            url_offset = struct.unpack('<i', cookie_data[16:20])[0]
            name_offset = struct.unpack('<i', cookie_data[20:24])[0]
            path_offset = struct.unpack('<i', cookie_data[24:28])[0]
            value_offset = struct.unpack('<i', cookie_data[28:32])[0]
            
            # Mac absolute time start is Jan 1 2001. So add 978307200 to convert to Unix timestamp
            expiry_mac = struct.unpack('<d', cookie_data[40:48])[0]
            expiry_unix = int(expiry_mac + 978307200) if expiry_mac > 0 else 0
            
            # Helper to extract null-terminated string
            def get_str(start_offset):
                s = b""
                curr = start_offset
                while curr < len(cookie_data) and cookie_data[curr] != 0:
                    s += bytes([cookie_data[curr]])
                    curr += 1
                return s.decode('utf-8', errors='ignore')

            domain = get_str(url_offset)
            name = get_str(name_offset)
            path = get_str(path_offset)
            value = get_str(value_offset)
            
            secure = (flags & 1) == 1
            
            cookies.append({
                "domain": domain,
                "name": name,
                "path": path,
                "value": value,
                "secure": secure,
                "expiry": expiry_unix
            })
            
    return cookies

def main():
    cookies = parse_safari_cookies()
    if not cookies:
        return

    # Filtrar solo cookies de YouTube y Google
    youtube_cookies = []
    for c in cookies:
        domain = c["domain"]
        if "youtube.com" in domain or "google.com" in domain:
            youtube_cookies.append(c)

    if not youtube_cookies:
        print("⚠️ No se encontraron cookies de YouTube. Asegúrate de haber entrado a youtube.com en Safari antes de correr este script.")
        return

    output_file = os.path.join(os.getcwd(), "cookies.txt")
    try:
        with open(output_file, "w") as out:
            out.write("# Netscape HTTP Cookie File\n")
            out.write("# This file is generated automatically by Safari cookie parser\n\n")
            
            for c in youtube_cookies:
                domain = c["domain"]
                include_subdomains = "TRUE" if domain.startswith(".") else "FALSE"
                path = c["path"]
                secure = "TRUE" if c["secure"] else "FALSE"
                expiry = c["expiry"]
                name = c["name"]
                value = c["value"]
                
                line = f"{domain}\t{include_subdomains}\t{path}\t{secure}\t{expiry}\t{name}\t{value}\n"
                out.write(line)
                
        print(f"✅ ¡Éxito! Se exportaron {len(youtube_cookies)} cookies de YouTube/Google a: {output_file}")
        print("Ahora puedes ejecutar en tu terminal:")
        print("git add cookies.txt && git commit -m 'add cookies' && git push origin main")
    except Exception as e:
        print(f"❌ Error al escribir el archivo: {e}")

if __name__ == "__main__":
    main()
