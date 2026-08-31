# =====================================================
# Service IA de DeployAI
# Analyse automatique des erreurs de déploiement
# =====================================================


class AIService:

    # Constructeur de la classe
    def __init__(self):

        # Base de connaissances simple de notre IA
        # Plus tard cette partie pourra être remplacée
        # par un vrai modèle IA

        self.base_erreurs = {

            "ModuleNotFoundError": {
                "type": "Dépendance manquante",
                "gravite": "MOYENNE",
                "solution": "Installer le module Python avec pip"
            },


            "Permission denied": {
                "type": "Erreur de permission",
                "gravite": "ELEVEE",
                "solution": "Vérifier les droits d'accès"
            },


            "connection refused": {
                "type": "Erreur réseau",
                "gravite": "CRITIQUE",
                "solution": "Vérifier le serveur et la connexion"
            },


            "SyntaxError": {
                "type": "Erreur de syntaxe Python",
                "gravite": "MOYENNE",
                "solution": "Corriger le code source"
            }

        }



    # Méthode principale d'analyse
    def analyser_erreur(self, erreur):

        # On parcourt la base de connaissances

        for mot_cle, information in self.base_erreurs.items():

            # Si le mot clé existe dans l'erreur
            if mot_cle in erreur:

                return {

                    "erreur_detectee": erreur,

                    "type_erreur": information["type"],

                    "gravite": information["gravite"],

                    "solution": information["solution"]

                }


        # Si aucune règle ne correspond

        return {

            "erreur_detectee": erreur,

            "type_erreur": "Erreur inconnue",

            "gravite": "FAIBLE",

            "solution": "Une analyse approfondie est nécessaire"

        }



    # Génération d'un rapport complet
    def generer_rapport(self, erreur):

        resultat = self.analyser_erreur(erreur)


        rapport = {

            "rapport": "Diagnostic DeployAI",

            "details": resultat

        }


        return rapport