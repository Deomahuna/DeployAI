// =====================================================
// Page de gestion des déploiements - DeployAI
// =====================================================

import { useEffect, useState } from "react";

import {
    getDeployments,
    createDeployment
} from "../../services/deploymentService";

import { getProjects } from "../../services/projectService";


function Deployments() {

    // =====================================================
    // États
    // =====================================================

    const [projects, setProjects] = useState([]);

    const [deployments, setDeployments] = useState([]);

    const [projectId, setProjectId] = useState("");

    const [environnement, setEnvironnement] = useState("Docker");

    const [loading, setLoading] = useState(false);

    const [loadingData, setLoadingData] = useState(true);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");

    const [resultat, setResultat] = useState(null);


    // =====================================================
    // Chargement initial
    // =====================================================

    useEffect(() => {

        chargerDonnees();

    }, []);


    // =====================================================
    // Charger projets + déploiements
    // =====================================================

    async function chargerDonnees() {

        setLoadingData(true);

        setError("");

        try {

            const projets = await getProjects();

            const dep = await getDeployments();

            setProjects(
                Array.isArray(projets) ? projets : []
            );

            setDeployments(
                Array.isArray(dep) ? dep : []
            );

        } catch (err) {

            console.error(
                "Erreur de chargement :",
                err
            );

            setError(
                "Impossible de charger les données."
            );

        } finally {

            setLoadingData(false);

        }

    }


    // =====================================================
    // Lancer un déploiement
    // =====================================================

    async function handleDeploy(event) {

        event.preventDefault();

        setMessage("");

        setError("");

        setResultat(null);


        // Vérification du projet

        if (!projectId) {

            setError(
                "Veuillez sélectionner un projet."
            );

            return;

        }


        setLoading(true);


        try {

            const resultatDeployment =
                await createDeployment({

                    project_id: Number(projectId),

                    environnement:
                        environnement,

                    statut: "EN_ATTENTE"

                });


            console.log(
                "Résultat du déploiement :",
                resultatDeployment
            );


            // Conserver le résultat pour l'afficher

            setResultat(
                resultatDeployment
            );


            // Afficher le message du backend

            setMessage(

                resultatDeployment.message ||

                "Déploiement terminé."

            );


            // Recharger l'historique

            await chargerDonnees();


        } catch (err) {

            console.error(
                "Erreur de déploiement :",
                err
            );


            setError(
                err.message ||
                "Erreur lors du déploiement."
            );


        } finally {

            setLoading(false);

        }

    }


    // =====================================================
    // Récupérer le nom du projet
    // =====================================================

    function getProjectName(projectIdValue) {

        const project = projects.find(

            (item) =>
                Number(item.id) ===
                Number(projectIdValue)

        );


        if (!project) {

            return `Projet ${projectIdValue}`;

        }


        return project.nom_projet;

    }


    // =====================================================
    // Affichage
    // =====================================================

    return (

        <div
            style={{
                padding: "30px",
                marginTop: "30px"
            }}
        >

            {/* =================================================
                TITRE
            ================================================== */}

            <h1>
                🚀 Gestion des déploiements
            </h1>


            <p>
                Déployez une application et consultez
                son résultat.
            </p>


            {/* =================================================
                MESSAGE D'ERREUR
            ================================================== */}

            {error && (

                <div
                    style={{
                        padding: "15px",
                        marginBottom: "20px",
                        border: "1px solid red"
                    }}
                >

                    ❌ {error}

                </div>

            )}


            {/* =================================================
                MESSAGE DE SUCCÈS
            ================================================== */}

            {message && !error && (

                <div
                    style={{
                        padding: "15px",
                        marginBottom: "20px",
                        border: "1px solid green"
                    }}
                >

                    ✅ {message}

                </div>

            )}


            {/* =================================================
                FORMULAIRE
            ================================================== */}

            <section>

                <h2>
                    Nouveau déploiement
                </h2>


                <form
                    onSubmit={handleDeploy}
                >

                    {/* Projet */}

                    <div
                        style={{
                            marginBottom: "15px"
                        }}
                    >

                        <label>
                            <strong>
                                Projet
                            </strong>
                        </label>

                        <br />

                        <select
                            value={projectId}
                            onChange={(event) =>
                                setProjectId(
                                    event.target.value
                                )
                            }
                            style={{
                                padding: "8px",
                                minWidth: "250px"
                            }}
                        >

                            <option value="">
                                Sélectionner un projet
                            </option>


                            {projects.map(
                                (project) => (

                                    <option
                                        key={project.id}
                                        value={project.id}
                                    >

                                        {
                                            project.nom_projet
                                        }

                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* Environnement */}

                    <div
                        style={{
                            marginBottom: "15px"
                        }}
                    >

                        <label>
                            <strong>
                                Environnement
                            </strong>
                        </label>

                        <br />

                        <select
                            value={environnement}
                            onChange={(event) =>
                                setEnvironnement(
                                    event.target.value
                                )
                            }
                            style={{
                                padding: "8px",
                                minWidth: "250px"
                            }}
                        >

                            <option value="Docker">
                                Docker
                            </option>

                            <option value="Test">
                                Test
                            </option>

                            <option value="Production">
                                Production
                            </option>

                        </select>

                    </div>


                    {/* Bouton */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "10px 20px",
                            cursor: loading
                                ? "not-allowed"
                                : "pointer"
                        }}
                    >

                        {loading

                            ? "⏳ Déploiement en cours..."

                            : "🚀 Déployer"

                        }

                    </button>

                </form>

            </section>


            {/* =================================================
                RÉSULTAT DU DERNIER DÉPLOIEMENT
            ================================================== */}

            {resultat && (

                <section
                    style={{
                        marginTop: "30px",
                        padding: "20px",
                        border: "1px solid #ccc"
                    }}
                >

                    <h2>
                        Résultat du déploiement
                    </h2>


                    <p>

                        <strong>
                            Projet :
                        </strong>{" "}

                        {
                            resultat.projet ||
                            getProjectName(projectId)
                        }

                    </p>


                    <p>

                        <strong>
                            Statut :
                        </strong>{" "}

                        {
                            resultat.statut ||
                            "INCONNU"
                        }

                    </p>


                    <p>

                        <strong>
                            Message :
                        </strong>{" "}

                        {
                            resultat.message ||
                            "-"
                        }

                    </p>


                    {resultat.logs && (

                        <div>

                            <h3>
                                Logs
                            </h3>

                            <pre
                                style={{
                                    padding: "15px",
                                    overflowX: "auto"
                                }}
                            >
                                {resultat.logs}
                            </pre>

                        </div>

                    )}


                    {/* Diagnostic IA éventuel */}

                    {resultat.diagnostic && (

                        <div>

                            <h3>
                                🤖 Diagnostic IA
                            </h3>

                            <p>
                                <strong>
                                    Erreur :
                                </strong>{" "}

                                {
                                    resultat.diagnostic.erreur_detectee
                                }

                            </p>

                            <p>
                                <strong>
                                    Type :
                                </strong>{" "}

                                {
                                    resultat.diagnostic.type_erreur
                                }

                            </p>

                            <p>
                                <strong>
                                    Gravité :
                                </strong>{" "}

                                {
                                    resultat.diagnostic.gravite
                                }

                            </p>

                            <p>
                                <strong>
                                    Solution :
                                </strong>{" "}

                                {
                                    resultat.diagnostic.solution
                                }

                            </p>

                        </div>

                    )}

                </section>

            )}


            {/* =================================================
                HISTORIQUE
            ================================================== */}

            <section
                style={{
                    marginTop: "40px"
                }}
            >

                <h2>
                    Historique des déploiements
                </h2>


                <button
                    type="button"
                    onClick={chargerDonnees}
                    disabled={loadingData}
                    style={{
                        marginBottom: "20px",
                        padding: "8px 15px"
                    }}
                >

                    🔄 Actualiser

                </button>


                {loadingData ? (

                    <p>
                        Chargement...
                    </p>

                ) : deployments.length === 0 ? (

                    <p>
                        Aucun déploiement pour le moment.
                    </p>

                ) : (

                    <table
                        border="1"
                        cellPadding="10"
                        style={{
                            borderCollapse:
                                "collapse",
                            width: "100%"
                        }}
                    >

                        <thead>

                            <tr>

                                <th>
                                    ID
                                </th>

                                <th>
                                    Projet
                                </th>

                                <th>
                                    Environnement
                                </th>

                                <th>
                                    Statut
                                </th>

                                <th>
                                    Logs
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {deployments.map(
                                (deployment) => (

                                    <tr
                                        key={
                                            deployment.id
                                        }
                                    >

                                        <td>
                                            {
                                                deployment.id
                                            }
                                        </td>

                                        <td>
                                            {
                                                getProjectName(
                                                    deployment.project_id
                                                )
                                            }
                                        </td>

                                        <td>
                                            {
                                                deployment.environnement
                                            }
                                        </td>

                                        <td>
                                            {
                                                deployment.statut
                                            }
                                        </td>

                                        <td>

                                            {
                                                deployment.logs ||
                                                "-"
                                            }

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                )}

            </section>

        </div>

    );

}


export default Deployments;