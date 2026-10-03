import os
import json
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional, Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
MONGO_URI = os.getenv("MONGO_URI")

CURRENT_DIR = Path(__file__).resolve().parent
SEED_FILE = CURRENT_DIR / "data" / "seedCharacters.json"

with open(SEED_FILE, "r", encoding="utf-8") as f:
    SEED_CHARACTERS = json.load(f)

# Controladores de base de datos
db_backend = "memory"
firestore_db = None
mongo_collection = None


def init_firebase():
    global firestore_db, db_backend
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        cred = None

        # 1. Variable de entorno con el JSON en texto crudo (ideal para Railway / Render)
        if FIREBASE_CREDENTIALS:
            try:
                cred_dict = json.loads(FIREBASE_CREDENTIALS)
                cred = credentials.Certificate(cred_dict)
            except Exception as e:
                print(f"[Firebase] Error parseando JSON de FIREBASE_CREDENTIALS: {e}")

        # 2. Ruta a archivo especificada por variable
        elif FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)

        # 3. Archivo firebase-key.json local
        else:
            local_key = CURRENT_DIR / "firebase-key.json"
            if local_key.exists():
                cred = credentials.Certificate(str(local_key))

        if cred:
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            firestore_db = firestore.client()

            # Sincronizar personajes en Cloud Firestore
            col_ref = firestore_db.collection("characters")
            for item in SEED_CHARACTERS:
                char_id = str(item.get("character", {}).get("mal_id", "char"))
                col_ref.document(char_id).set(item, merge=True)
            print(f"[Firebase Firestore] Conectado y {len(SEED_CHARACTERS)} personajes sincronizados exitosamente.")

            db_backend = "firebase firestore"
            return True
    except Exception as e:
        print(f"[Firebase] Error al inicializar Firebase Firestore: {e}")

    return False


def init_mongodb():
    global mongo_collection, db_backend
    if not MONGO_URI:
        return False
    try:
        import pymongo
        print("[MongoDB] Conectando a MongoDB...")
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=4000)
        client.admin.command('ping')
        mongo_db = client.get_database("anime_db")
        mongo_collection = mongo_db["characters"]

        if mongo_collection.count_documents({}) == 0:
            mongo_collection.insert_many([dict(c) for c in SEED_CHARACTERS])
            print("[MongoDB] 10 personajes insertados exitosamente.")
        else:
            print("[MongoDB] Conectado exitosamente.")

        db_backend = "mongodb"
        return True
    except Exception as e:
        print(f"[MongoDB] Error al inicializar MongoDB: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Prioridad: Firebase Firestore -> MongoDB -> Memoria local
    if not init_firebase():
        if not init_mongodb():
            print("[Info] Usando almacenamiento en memoria local (fallback).")

    yield


app = FastAPI(
    title="API de Personajes de Anime - Microservicio Python",
    description="Microservicio desarrollado en Python con FastAPI para consultar los personajes de Death Note almacenados en la base de datos no relacional Firebase Cloud Firestore.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_all_characters_data() -> List[Dict[str, Any]]:
    if db_backend == "firebase firestore" and firestore_db:
        try:
            docs = firestore_db.collection("characters").stream()
            items = [doc.to_dict() for doc in docs]
            if items:
                return items
        except Exception as e:
            print(f"[Firestore] Error al leer documentos: {e}")

    elif db_backend == "mongodb" and mongo_collection is not None:
        try:
            docs = list(mongo_collection.find({}))
            for d in docs:
                if "_id" in d:
                    del d["_id"]
            if docs:
                return docs
        except Exception as e:
            print(f"[MongoDB] Error al leer documentos: {e}")

    return SEED_CHARACTERS


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get(
    "/api/health",
    tags=["Estado del Servidor"],
    summary="Verificar conexión",
    description="Permite comprobar que el servicio está activo y muestra a qué base de datos no relacional se conectó (Firebase Firestore).",
)
def health_check():
    return {
        "status": "ok",
        "database": f"conectado ({db_backend})",
    }


@app.get(
    "/api/characters",
    tags=["Personajes"],
    summary="Listar todos los personajes",
    description="Retorna la lista completa de todos los personajes de Death Note guardados en Firebase Cloud Firestore.",
)
def get_characters():
    characters = get_all_characters_data()
    return {"data": characters}


@app.get(
    "/api/characters/{query}",
    tags=["Personajes"],
    summary="Buscar un personaje",
    description="Busca un personaje específico por su posición numérica, por su ID de MyAnimeList (mal_id), o por parte de su nombre (por ejemplo: Lawliet, Yagami, Ryuk, Misa).",
)
def get_character_by_query(query: str):
    query_clean = query.strip().lower()
    characters = get_all_characters_data()

    if not characters:
        raise HTTPException(status_code=404, detail="No hay personajes disponibles en la base de datos")

    # Búsqueda por índice o mal_id numérico
    if query_clean.isdigit():
        num = int(query_clean)
        if 1 <= num <= len(characters):
            return {"data": characters[num - 1]}
        for c in characters:
            if c.get("character", {}).get("mal_id") == num:
                return {"data": c}

    # Búsqueda por nombre
    for c in characters:
        char_name = c.get("character", {}).get("name", "").lower()
        if query_clean in char_name:
            return {"data": c}

    raise HTTPException(status_code=404, detail=f"No se encontró el personaje '{query}' en la base de datos")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
