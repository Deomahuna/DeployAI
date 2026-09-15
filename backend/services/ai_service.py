"""
Service de diagnostic IA pour les déploiements échoués.
Utilise l'API Gemini (niveau gratuit) pour analyser une erreur de build/run
et produire une cause, une sévérité, un score de confiance et des solutions.
Un fallback heuristique garantit qu'un diagnostic existe toujours, même sans
clé API ou en cas de quota dépassé — un déploiement échoué n'est jamais bloqué
par un souci côté IA.

Migré vers le SDK `google-genai` (le package `google.generativeai` est
déprécié et ne reçoit plus de mises à jour).
"""

import json
import logging
import os
from typing import Optional

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

_client: Optional[genai.Client] = None
if GEMINI_API_KEY:
    _client = genai.Client(api_key=GEMINI_API_KEY)

DIAGNOSTIC_PROMPT = """Tu es un expert DevOps qui analyse les erreurs de déploiement d'applications web.

Voici le message d'erreur et les logs d'un déploiement qui a échoué :

--- MESSAGE D'ERREUR ---
{error_message}

--- LOGS (derniers 4000 caractères) ---
{logs}

--- CONTEXTE DU PROJET ---
Langage : {language}
Framework : {framework}

Analyse cette erreur et réponds UNIQUEMENT avec un objet JSON valide, sans texte
autour, avec exactement cette structure :

{{
  "cause": "explication claire et précise de la cause racine (2-3 phrases max)",
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": 0.0 à 1.0,
  "solutions": [
    {{"title": "solution concrète et actionnable", "command": "commande shell si applicable, sinon null"}}
  ]
}}

Règles :
- "severity": critical si l'app est totalement inutilisable, high si une fonctionnalité majeure est cassée,
  medium si c'est une erreur de config/dépendance courante, low si c'est mineur.
- "confidence": ta certitude sur le diagnostic (1.0 = certain, 0.3 = incertain, logs insuffisants).
- Propose 1 à 3 solutions, la plus probable en premier.
- Si les logs sont insuffisants pour conclure, dis-le dans "cause" et baisse "confidence"."""


def _fallback_diagnostic(error_message: str) -> dict:
    """Diagnostic heuristique basique si l'IA est indisponible (quota, panne, pas de clé)."""
    msg = (error_message or "").lower()

    if "modulenotfounderror" in msg or "no module named" in msg:
        return {
            "cause": "Une dépendance Python utilisée par le projet n'est pas installée dans l'environnement de build.",
            "severity": "medium",
            "confidence": 0.6,
            "solutions": [{"title": "Vérifier requirements.txt et ajouter la dépendance manquante", "command": None}],
        }
    if "econnrefused" in msg or "connection refused" in msg:
        return {
            "cause": "Le service n'a pas pu se connecter à une dépendance externe (base de données, cache, API).",
            "severity": "high",
            "confidence": 0.5,
            "solutions": [{"title": "Vérifier les variables d'environnement de connexion et que le service cible est bien démarré", "command": None}],
        }
    if "port" in msg and ("already in use" in msg or "eaddrinuse" in msg):
        return {
            "cause": "Le port utilisé par l'application est déjà occupé par un autre processus.",
            "severity": "medium",
            "confidence": 0.6,
            "solutions": [{"title": "Changer le port d'écoute ou libérer le port utilisé", "command": None}],
        }
    if "clonage" in msg or "clone" in msg or "repository not found" in msg:
        return {
            "cause": "Le dépôt Git n'a pas pu être cloné (URL invalide, dépôt privé sans accès, ou dépôt inexistant).",
            "severity": "high",
            "confidence": 0.5,
            "solutions": [{"title": "Vérifier l'URL du dépôt et que l'intégration GitHub/GitLab a bien accès au dépôt", "command": None}],
        }

    return {
        "cause": "Impossible d'analyser automatiquement l'erreur (diagnostic IA indisponible). Consulte les logs complets.",
        "severity": "medium",
        "confidence": 0.3,
        "solutions": [{"title": "Vérifier les logs complets du déploiement", "command": None}],
    }


def _parse_ai_response(raw_text: str) -> Optional[dict]:
    """Extrait et valide le JSON renvoyé par le modèle."""
    try:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        data = json.loads(cleaned.strip())

        assert data["severity"] in ("low", "medium", "high", "critical")
        assert 0.0 <= float(data["confidence"]) <= 1.0
        assert isinstance(data["solutions"], list) and len(data["solutions"]) > 0

        return data
    except Exception as e:
        logger.warning(f"Réponse IA invalide, fallback heuristique : {e}")
        return None


def analyze_deployment_error(
    error_message: str,
    logs: str = "",
    language: str = "inconnu",
    framework: str = "inconnu",
) -> dict:
    """
    Analyse une erreur de déploiement et retourne un diagnostic structuré.
    Retourne toujours un dict {cause, severity, confidence, solutions} —
    soit via Gemini, soit via le fallback heuristique.
    """
    if not _client:
        logger.warning("GEMINI_API_KEY absente, utilisation du fallback heuristique.")
        return _fallback_diagnostic(error_message)

    try:
        prompt = DIAGNOSTIC_PROMPT.format(
            error_message=(error_message or "")[:2000],
            logs=(logs or "")[-4000:],
            language=language or "inconnu",
            framework=framework or "inconnu",
        )
        response = _client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=2048,
            ),
        )

        raw_text = response.text or ""
        if not raw_text.strip():
            logger.warning(
                "Réponse Gemini vide (finish_reason=%s), fallback heuristique.",
                getattr(response.candidates[0], "finish_reason", "inconnu") if response.candidates else "aucun candidat",
            )
            return _fallback_diagnostic(error_message)

        parsed = _parse_ai_response(raw_text)
        if parsed:
            return parsed
        return _fallback_diagnostic(error_message)

    except Exception as e:
        logger.error(f"Erreur appel Gemini pour diagnostic IA : {type(e).__name__}: {e}")
        return _fallback_diagnostic(error_message)