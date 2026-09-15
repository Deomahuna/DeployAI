"""
Script de test isolé : vérifie que GEMINI_API_KEY fonctionne avec le nouveau
SDK google-genai, avant de toucher au code de l'application.
Usage : python test_gemini.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

from google import genai

api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if not api_key:
    print("ERREUR : GEMINI_API_KEY absente de l'environnement.")
    exit(1)

print(f"Clé détectée (début) : {api_key[:10]}...")
print(f"Modèle testé : {model_name}")
print("Appel à l'API Gemini en cours...")

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name,
        contents="Réponds juste par le mot OK.",
    )
    print("SUCCÈS")
    print("Réponse brute :", response.text)
except Exception as e:
    print("ÉCHEC")
    print(f"Type d'erreur : {type(e).__name__}")
    print(f"Détail : {e}")