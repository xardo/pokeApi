import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

CURRENT_DIR = Path(__file__).resolve().parent
SEED_FILE = CURRENT_DIR / "data" / "seedCharacters.json"

with open(SEED_FILE, "r", encoding="utf-8") as f:
    characters = json.load(f)

FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

def run_seeder():
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("❌ Error: falta instalar 'firebase-admin'. Ejecuta: pip install firebase-admin")
        return

    cred = None

    if FIREBASE_CREDENTIALS:
        try:
            cred_dict = json.loads(FIREBASE_CREDENTIALS)
            cred = credentials.Certificate(cred_dict)
            print("[INFO] Usando credenciales de variable FIREBASE_CREDENTIALS")
        except Exception as e:
            print(f"[ERROR] Error parseando FIREBASE_CREDENTIALS: {e}")
            return
    elif FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
        print(f"[INFO] Usando credenciales desde: {FIREBASE_SERVICE_ACCOUNT_PATH}")
    else:
        local_key = CURRENT_DIR / "firebase-key.json"
        if local_key.exists():
            cred = credentials.Certificate(str(local_key))
            print(f"[INFO] Usando archivo local: {local_key}")
        else:
            print("[ERROR] No se encontro ninguna credencial de Firebase.")
            print("Coloca el archivo 'firebase-key.json' en esta carpeta (services/anime-service-python/)")
            print("o define la variable de entorno FIREBASE_CREDENTIALS con el JSON.")
            return

    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        col_ref = db.collection("characters")

        print(f"[SEEDED] Poblando Firestore con {len(characters)} personajes en la coleccion 'characters'...")
        for char in characters:
            char_id = str(char.get("character", {}).get("mal_id", "char"))
            name = char.get("character", {}).get("name", "Desconocido")
            col_ref.document(char_id).set(char)
            print(f"  [OK] Insertado: [{char_id}] {name}")

        print("\n[EXITO] Seeder completado. Todos los personajes estan en Cloud Firestore.")
    except Exception as e:
        print(f"[ERROR] Error al conectar o insertar en Firebase: {e}")

if __name__ == "__main__":
    run_seeder()
