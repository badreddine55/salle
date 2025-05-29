import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import PageHeader from "./PageHeader";
import { AlertCircle, Plus, X } from "lucide-react";

export default function EditEtablissement() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    salles: [],
  });
  const [newSalle, setNewSalle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch etablissement
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentification requise. Veuillez vous connecter.");
        setLoading(false);
        navigate("/");
        return;
      }

      try {
        const apiUrl = process.env.REACT_APP_API_URL ;
        const response = await axios.get(`${apiUrl}/api/etablissements/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          name: response.data.data.name || "",
          salles: response.data.data.salles || [],
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        if (err.response?.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/");
        } else if (err.response?.status === 404) {
          setError("Établissement non trouvé");
        } else {
          setError(`Échec du chargement de l'établissement : ${errorMessage}`);
        }
        console.error("Erreur de chargement :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle new salle input
  const handleSalleChange = (e) => {
    setNewSalle(e.target.value);
  };

  // Add salle to list
  const handleAddSalle = () => {
    if (newSalle.trim() && !formData.salles.includes(newSalle.trim())) {
      setFormData((prev) => ({
        ...prev,
        salles: [...prev.salles, newSalle.trim()],
      }));
      setNewSalle("");
    }
  };

  // Remove salle from list
  const handleRemoveSalle = (salle) => {
    setFormData((prev) => ({
      ...prev,
      salles: prev.salles.filter((s) => s !== salle),
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

    if (!formData.name.trim()) {
      setError("Le nom de l'établissement est requis.");
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL ;
      console.log("Updating at:", `${apiUrl}/api/etablissements/${id}`, formData);

      await axios.put(`${apiUrl}/api/etablissements/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      navigate("/EtablissementManagement");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else {
        setError(`Échec de la mise à jour de l'établissement : ${errorMessage}`);
      }
      console.error("Erreur de mise à jour de l'établissement :", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader title="Modifier l'établissement" />
        <div className="flex justify-center items-center py-20">
          <svg
            className="animate-spin h-8 w-8 text-[#004AAD]"
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
        </div>
      </Layout>
    );
  }

  if (error === "Établissement non trouvé") {
    return (
      <Layout>
        <PageHeader title="Modifier l'établissement" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Établissement non trouvé.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Modifier l'établissement" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de l'établissement <span className="text-[#004AAD]">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
                required
                maxLength={50}
                placeholder="Ex: Lycée Victor Hugo"
              />
            </div>
            {/* Salles */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Salles
              </label>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={newSalle}
                  onChange={handleSalleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
                  placeholder="Ex: Salle 101"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={handleAddSalle}
                  className="ml-2 p-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#222222]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.salles.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {formData.salles.map((salle, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                      <span>{salle}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSalle(salle)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour l'établissement"
              )}
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
}