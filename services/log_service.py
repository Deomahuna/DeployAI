# Service de gestion des logs


class LogService:

    def enregistrer_log(self, message):

        # Ici on simule l'enregistrement d'un log
        log = {
            "message": message,
            "statut": "ENREGISTRE"
        }

        return log


    def lire_logs(self):

        # Exemple de logs récupérés
        logs = [
            "Déploiement commencé",
            "Installation des dépendances",
            "Déploiement terminé"
        ]

        return logs