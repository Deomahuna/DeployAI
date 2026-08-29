// =====================================================
// Gestion des projets DeployAI
// =====================================================

import { useEffect, useState } from "react";

import {
    createProject,
    getProjects,
    updateProject,
    deleteProject
} from "../services/projectService";


function Projects() {

    // =====================================================
    // État du formulaire
    // =====================================================

    const [projet, setProjet] = useState({
        nom_projet: "",
        langage: "",
        framework: "",
        description: "",
        github_url: "",
        version: "",
        statut: "En attente",
        user_id: 1
    });


    // =====================================================
    // Liste des projets
    // =====================================================

    const [projets, setProjets] = useState([]);


    // =====================================================
    // Projet en cours de modification
    // =====================================================

    const [projetEnModification, setProjetEnModification] =
        useState(null);


    // =====================================================
    // Charger les projets
    // =====================================================

    const chargerProjets = async () => {

        try {

            const donnees = await getProjects();

            setProjets(donnees);

        } catch (error) {

            console.error(
                "Erreur lors du chargement des projets :",
                error
            );
        }
    };


    // =====================================================
    // Charger les projets au démarrage
    // =====================================================

    useEffect(() => {

        chargerProjets();

    }, []);


    // =====================================================
    // Modifier les champs du formulaire
    // =====================================================

    const handleChange = (event) => {

        const { name, value } = event.target;

        setProjet({
            ...projet,
            [name]: value
        });
    };


    // =====================================================
    // Créer ou modifier un projet
    // =====================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            // Modification
            if (projetEnModification !== null) {

                const projetModifie = await updateProject(
                    projetEnModification,
                    projet
                );

                console.log(
                    "Projet modifié :",
                    projetModifie
                );

                alert("Projet modifié avec succès !");

            }

            // Création
            else {

                const nouveauProjet =
                    await createProject(projet);

                console.log(
                    "Projet créé :",
                    nouveauProjet
                );

                alert("Projet créé avec succès !");
            }


            // Réinitialiser le formulaire
            setProjet({
                nom_projet: "",
                langage: "",
                framework: "",
                description: "",
                github_url: "",
                version: "",
                statut: "En attente",
                user_id: 1
            });


            // Quitter le mode modification
            setProjetEnModification(null);


            // Recharger la liste
            chargerProjets();

        } catch (error) {

            console.error(
                "Erreur :",
                error
            );

            alert(
                "Impossible d'enregistrer le projet."
            );
        }
    };


    // =====================================================
    // Préparer la modification
    // =====================================================

    const handleEdit = (projetSelectionne) => {

        setProjetEnModification(
            projetSelectionne.id
        );

        setProjet({
            nom_projet:
                projetSelectionne.nom_projet,

            langage:
                projetSelectionne.langage,

            framework:
                projetSelectionne.framework,

            description:
                projetSelectionne.description,

            github_url:
                projetSelectionne.github_url || "",

            version:
                projetSelectionne.version,

            statut:
                projetSelectionne.statut,

            user_id:
                projetSelectionne.user_id
        });
    };


    // =====================================================
    // Annuler la modification
    // =====================================================

    const handleCancelEdit = () => {

        setProjetEnModification(null);

        setProjet({
            nom_projet: "",
            langage: "",
            framework: "",
            description: "",
            github_url: "",
            version: "",
            statut: "En attente",
            user_id: 1
        });
    };


    // =====================================================
    // Supprimer un projet
    // =====================================================

    const handleDelete = async (projectId) => {

        const confirmation = window.confirm(
            "Voulez-vous vraiment supprimer ce projet ?"
        );

        if (!confirmation) {
            return;
        }

        try {

            await deleteProject(projectId);

            alert(
                "Projet supprimé avec succès !"
            );

            // Recharger la liste
            chargerProjets();

        } catch (error) {

            console.error(
                "Erreur lors de la suppression :",
                error
            );

            alert(
                "Impossible de supprimer le projet."
            );
        }
    };


    // =====================================================
    // Interface
    // =====================================================

    return (
        <div>

            <h1>Gestion des projets</h1>


            {/* =================================================
                Formulaire
            ================================================= */}

            <h2>
                {projetEnModification !== null
                    ? "Modifier le projet"
                    : "Créer un projet"}
            </h2>


            <form onSubmit={handleSubmit}>

                {/* Nom du projet */}

                <label>
                    Nom du projet
                </label>

                <input
                    type="text"
                    name="nom_projet"
                    value={projet.nom_projet}
                    onChange={handleChange}
                    placeholder="Nom du projet"
                    required
                />


                {/* Langage */}

                <label>
                    Langage
                </label>

                <input
                    type="text"
                    name="langage"
                    value={projet.langage}
                    onChange={handleChange}
                    placeholder="Ex : Python"
                    required
                />


                {/* Framework */}

                <label>
                    Framework
                </label>

                <input
                    type="text"
                    name="framework"
                    value={projet.framework}
                    onChange={handleChange}
                    placeholder="Ex : FastAPI"
                    required
                />


                {/* GitHub */}

                <label>
                    GitHub URL
                </label>

                <input
                    type="text"
                    name="github_url"
                    value={projet.github_url}
                    onChange={handleChange}
                    placeholder="Ex : https://github.com/utilisateur/projet"
                    required
                />


                {/* Description */}

                <label>
                    Description
                </label>

                <textarea
                    name="description"
                    value={projet.description}
                    onChange={handleChange}
                    placeholder="Description du projet"
                    required
                />


                {/* Version */}

                <label>
                    Version
                </label>

                <input
                    type="text"
                    name="version"
                    value={projet.version}
                    onChange={handleChange}
                    placeholder="Ex : 1.0"
                    required
                />


                {/* Statut */}

                <label>
                    Statut
                </label>

                <select
                    name="statut"
                    value={projet.statut}
                    onChange={handleChange}
                >

                    <option value="En attente">
                        En attente
                    </option>

                    <option value="Developpement">
                        Developpement
                    </option>

                    <option value="Terminé">
                        Terminé
                    </option>

                </select>


                {/* Bouton principal */}

                <button type="submit">

                    {projetEnModification !== null
                        ? "Modifier le projet"
                        : "Créer le projet"}

                </button>


                {/* Bouton annuler */}

                {projetEnModification !== null && (

                    <button
                        type="button"
                        onClick={handleCancelEdit}
                    >
                        Annuler
                    </button>

                )}

            </form>


            {/* =================================================
                Liste des projets
            ================================================= */}

            <h2>
                Mes projets
            </h2>


            {projets.length === 0 ? (

                <p>
                    Aucun projet enregistré.
                </p>

            ) : (

                projets.map((projet) => (

                    <div key={projet.id}>

                        <h3>
                            {projet.nom_projet}
                        </h3>


                        <p>
                            <strong>Langage :</strong>{" "}
                            {projet.langage}
                        </p>


                        <p>
                            <strong>Framework :</strong>{" "}
                            {projet.framework}
                        </p>


                        <p>
                            <strong>Version :</strong>{" "}
                            {projet.version}
                        </p>


                        <p>
                            <strong>Statut :</strong>{" "}
                            {projet.statut}
                        </p>


                        <p>
                            <strong>Description :</strong>{" "}
                            {projet.description}
                        </p>


                        <p>
                            <strong>GitHub :</strong>{" "}

                            {projet.github_url
                                ? projet.github_url
                                : "Non renseigné"}

                        </p>


                        {/* ================================
                            Bouton Modifier
                        ================================= */}

                        <button
                            type="button"
                            onClick={() =>
                                handleEdit(projet)
                            }
                        >
                            Modifier
                        </button>


                        {/* ================================
                            Bouton Supprimer
                        ================================= */}

                        <button
                            type="button"
                            onClick={() =>
                                handleDelete(projet.id)
                            }
                        >
                            Supprimer
                        </button>


                        <hr />

                    </div>

                ))

            )}

        </div>
    );
}


export default Projects;