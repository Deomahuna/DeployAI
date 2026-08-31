// =====================================================
// DeployAI - Importation d'une application
// Fichier : ImportRepository.jsx
// Rôle : sélectionner et importer une application
//        vers le backend FastAPI
// =====================================================


// =====================================================
// IMPORTS
// =====================================================

// useState permet de gérer les données du composant React
import { useState } from "react";

// Fonction qui communique avec le backend FastAPI
import { importApplication } from "../../services/importService";


// =====================================================
// COMPOSANT PRINCIPAL
// =====================================================

function ImportRepository() {


    // =================================================
    // Fichier sélectionné par l'utilisateur
    // =================================================

    const [selectedFile, setSelectedFile] = useState(null);


    // =================================================
    // Indique si une importation est en cours
    // =================================================

    const [loading, setLoading] = useState(false);


    // =================================================
    // Message affiché à l'utilisateur
    // =================================================

    const [message, setMessage] = useState("");


    // =================================================
    // Gestion du choix du fichier
    // =================================================

    function handleFileChange(event) {

        // Récupérer le premier fichier sélectionné
        const file = event.target.files[0];

        // Enregistrer le fichier dans l'état React
        setSelectedFile(file);

        // Effacer l'ancien message
        setMessage("");

    }


    // =================================================
    // Gestion du bouton "Importer"
    // =================================================

    async function handleImport() {


        // Vérifier qu'un fichier a été sélectionné
        if (!selectedFile) {

            setMessage(
                "Veuillez sélectionner un fichier."
            );

            return;
        }


        // Indiquer que l'importation commence
        setLoading(true);

        setMessage(
            "Importation en cours..."
        );


        try {

            // Envoyer le fichier au backend
            const result = await importApplication(
                selectedFile
            );


            // Afficher la réponse du backend
            setMessage(
                result.message ||
                "Application importée avec succès."
            );


            // Réinitialiser le fichier sélectionné
            setSelectedFile(null);


        } catch (error) {

            // Afficher l'erreur dans la console
            console.error(
                "Erreur d'importation :",
                error
            );


            // Message visible par l'utilisateur
            setMessage(
                "Erreur lors de l'importation."
            );


        } finally {

            // Fin du chargement
            setLoading(false);

        }

    }


    // =================================================
    // INTERFACE
    // =================================================

    return (

        <div
            style={{
                padding: "30px"
            }}
        >

            {/* =========================================
                TITRE
            ========================================= */}

            <h2>
                📥 Importer une application
            </h2>


            <p>
                Sélectionnez une application à importer
                dans DeployAI.
            </p>


            {/* =========================================
                SÉLECTION DU FICHIER
            ========================================= */}

            <input
                type="file"
                onChange={handleFileChange}
            />


            {/* =========================================
                AFFICHAGE DU FICHIER SÉLECTIONNÉ
            ========================================= */}

            {selectedFile && (

                <p>
                    Fichier sélectionné :{" "}
                    <strong>
                        {selectedFile.name}
                    </strong>
                </p>

            )}


            {/* =========================================
                BOUTON IMPORTER
            ========================================= */}

            <button
                onClick={handleImport}
                disabled={loading}
                style={{
                    marginTop: "10px",
                    marginLeft: "10px",
                    padding: "8px 15px"
                }}
            >

                {loading
                    ? "Importation en cours..."
                    : "Importer"
                }

            </button>


            {/* =========================================
                MESSAGE
            ========================================= */}

            {message && (

                <p
                    style={{
                        marginTop: "15px"
                    }}
                >
                    {message}
                </p>

            )}

        </div>

    );

}


// =====================================================
// EXPORT
// =====================================================

export default ImportRepository;