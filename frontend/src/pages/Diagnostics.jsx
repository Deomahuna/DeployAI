// =====================================================
// Page de diagnostic IA - DeployAI
// =====================================================

import { useState } from "react";


function Diagnostics() {

    const [erreur, setErreur] = useState("");

    const [resultat, setResultat] = useState(null);


    // =====================================================
    // Analyse de l'erreur
    // =====================================================

    function analyserErreur(event) {

        event.preventDefault();


        if (!erreur.trim()) {

            alert("Veuillez saisir une erreur.");

            return;

        }


        let diagnostic;


        // Erreur de dépendance

        if (
            erreur.includes("ModuleNotFoundError")
        ) {

            diagnostic = {

                type: "Dépendance manquante",

                gravite: "MOYENNE",

                solution:
                    "Installer le module Python manquant avec pip."

            };

        }


        // Erreur de permission

        else if (
            erreur.includes("Permission denied")
        ) {

            diagnostic = {

                type: "Erreur de permission",

                gravite: "ÉLEVÉE",

                solution:
                    "Vérifier les droits d'accès."

            };

        }


        // Erreur réseau

        else if (
            erreur.toLowerCase()
                .includes("connection refused")
        ) {

            diagnostic = {

                type: "Erreur réseau",

                gravite: "CRITIQUE",

                solution:
                    "Vérifier le serveur et la connexion réseau."

            };

        }


        // Erreur de syntaxe

        else if (
            erreur.includes("SyntaxError")
        ) {

            diagnostic = {

                type: "Erreur de syntaxe Python",

                gravite: "MOYENNE",

                solution:
                    "Corriger le code source."

            };

        }


        // Erreur inconnue

        else {

            diagnostic = {

                type: "Erreur inconnue",

                gravite: "FAIBLE",

                solution:
                    "Une analyse approfondie est nécessaire."

            };

        }


        setResultat(diagnostic);

    }


    return (

        <div
            style={{
                padding: "30px"
            }}
        >

            {/* =================================================
                TITRE
            ================================================= */}

            <h1>
                🤖 Diagnostic IA
            </h1>


            <p>
                Analyse automatique des erreurs
                de déploiement.
            </p>


            <hr />


            {/* =================================================
                FORMULAIRE
            ================================================= */}

            <h2>
                Analyser une erreur
            </h2>


            <form
                onSubmit={analyserErreur}
            >

                <textarea
                    value={erreur}
                    onChange={(event) =>
                        setErreur(
                            event.target.value
                        )
                    }
                    placeholder="Collez ici l'erreur de déploiement..."
                    rows="8"
                    style={{
                        width: "100%",
                        maxWidth: "700px",
                        padding: "10px"
                    }}
                />


                <br />
                <br />


                <button
                    type="submit"
                    style={{
                        padding: "10px 20px"
                    }}
                >

                    🔍 Analyser l'erreur

                </button>

            </form>


            {/* =================================================
                RÉSULTAT
            ================================================= */}

            {resultat && (

                <div
                    style={{
                        marginTop: "30px",
                        padding: "20px",
                        border: "1px solid #ccc"
                    }}
                >

                    <h2>
                        📋 Résultat du diagnostic
                    </h2>


                    <p>

                        <strong>
                            Erreur :
                        </strong>

                        <br />

                        {erreur}

                    </p>


                    <p>

                        <strong>
                            Type :
                        </strong>{" "}

                        {resultat.type}

                    </p>


                    <p>

                        <strong>
                            Gravité :
                        </strong>{" "}

                        {resultat.gravite}

                    </p>


                    <p>

                        <strong>
                            Solution :
                        </strong>{" "}

                        {resultat.solution}

                    </p>

                </div>

            )}

        </div>

    );

}


export default Diagnostics;