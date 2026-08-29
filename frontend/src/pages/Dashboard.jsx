// =====================================================
// Tableau de bord principal de DeployAI
// =====================================================

function Dashboard() {

    // Affichage de la page du tableau de bord
    return (
        <div>

            {/* Titre principal */}
            <h1>Tableau de bord DeployAI</h1>

            {/* Résumé des informations */}
            <div>

                {/* Nombre de projets */}
                <div>
                    <h2>Projets</h2>
                    <p>0</p>
                </div>

                {/* Nombre de déploiements */}
                <div>
                    <h2>Déploiements</h2>
                    <p>0</p>
                </div>

                {/* Déploiements réussis */}
                <div>
                    <h2>Succès</h2>
                    <p>0</p>
                </div>

                {/* Déploiements échoués */}
                <div>
                    <h2>Échecs</h2>
                    <p>0</p>
                </div>

            </div>

        </div>
    );
}


// Exportation du composant
export default Dashboard;