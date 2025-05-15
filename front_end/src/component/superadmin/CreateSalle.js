import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import PageHeader from "./PageHeader";
import { AlertCircle, Plus, Minus } from "lucide-react";

export default function CreateSalle() {
  const [formData, setFormData] = useState({
    name: "",
    secteurs: [""], // Initialize with one empty secteur input
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Handle changes to name or secteur inputs
  const handleChange = (e, index) => {
    const { name, value } = e.target;
    if (name === "name") {
      setFormData((prev) => ({ ...prev, name: value }));
    } else if (name === "secteur") {
      setFormData((prev) => {
        const newSecteurs = [...prev.secteurs];
        newSecteurs[index] = value;
        return { ...prev, secteurs: newSecteurs };
      });
    }
  };

  // Add a new secteur input
  const handleAddSecteur = () => {
    setFormData((prev) => ({
      ...prev,
      secteurs: [...prev.secteurs, ""],
    }));
  };

  // Remove a secteur input
  const handleRemoveSecteur = (index) => {
    setFormData((prev) => ({
      ...prev,
      secteurs: prev.secteurs.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setIsSubmitting(false);
      navigate("/");
      return;
    }

    // Filter out empty secteurs and validate
    const validSecteurs = formData.secteurs.filter((secteur) => secteur.trim());
    if (validSecteurs.length === 0) {
      setError("Veuillez ajouter au moins un secteur valide.");
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      console.log("Posting to:", `${apiUrl}/api/salles`);

      // Submit secteurs as an array
      const formattedData = {
        name: formData.name,
        secteur: validSecteurs,
      };

      await axios.post(`${apiUrl}/api/salles`, formattedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      navigate("/SalleManagement");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Échec de la création de la salle : ${errorMessage}`);
      console.error("Erreur de création de la salle :", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Créer une salle" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de la salle <span className="text-[#004AAD]">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange(e)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
                required
                maxLength={50}
                placeholder="Ex: Salle A101"
              />
            </div>
            {/* Secteurs */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Secteurs <span className="text-[#004AAD]">*</span>
              </label>
              {formData.secteurs.map((secteur, index) => (
                <div key={index} className="flex items-center space-x-2 mt-1">
                  <input
                    type="text"
                    name="secteur"
                    value={secteur}
                    onChange={(e) => handleChange(e, index)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
                    placeholder={`Ex: ${index === 0 ? "Informatique" : "Mathématiques"}`}
                  />
                  <button
                    type="button"
                    onClick={handleAddSecteur}
                    className="p-2 text-[#004AAD] hover:text-[#222222] focus:outline-none"
                    title="Ajouter un secteur"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  {formData.secteurs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSecteur(index)}
                      className="p-2 text-[#004AAD] hover:text-[#222222] focus:outline-none"
                      title="Supprimer ce secteur"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#004AAD] text-white py-3 rounded-lg hover:bg-[#222222] transition-all flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Création...
                </>
              ) : (
                "Créer la salle"
              )}
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
}