import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import PageHeader from "./PageHeader";
import { Edit, Trash2, AlertCircle } from "lucide-react";

export default function EtablissementManagement() {
  const [etablissements, setEtablissements] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEtablissements();
  }, []);

  const fetchEtablissements = async () => {
    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setIsLoading(false);
      navigate("/");
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL ;
      console.log("Fetching from:", `${apiUrl}/api/etablissements`);

      const response = await axios.get(`${apiUrl}/api/etablissements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setEtablissements(response.data.data || response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else {
        setError(`Erreur lors de la récupération des établissements : ${errorMessage}`);
      }
      console.error("Erreur de récupération des établissements :", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet établissement ?")) {
      return;
    }

    setError("");
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      navigate("/");
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL ;
      console.log("Deleting from:", `${apiUrl}/api/etablissements/${id}`);

      await axios.delete(`${apiUrl}/api/etablissements/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setEtablissements(etablissements.filter((etablissement) => etablissement._id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else {
        setError(`Erreur lors de la suppression de l'établissement : ${errorMessage}`);
      }
      console.error("Erreur de suppression de l'établissement :", err);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Gestion des établissements"
        actionButton={{ label: "Créer un établissement", href: "/superadmin/etablissements/create" }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
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
          ) : error ? (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => {
                  setError("");
                  setIsLoading(true);
                  fetchEtablissements();
                }}
                className="ml-4 text-sm text-red-600 underline"
              >
                Réessayer
              </button>
            </div>
          ) : etablissements.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Aucun établissement trouvé.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {etablissements.map((etablissement) => (
                    <tr key={etablissement._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {etablissement.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {etablissement.salles.join(", ") || "Aucune salle"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/superadmin/etablissements/edit/${etablissement._id}`)}
                          className="text-[#004AAD] hover:text-[#222222] mr-4 inline-flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(etablissement._id)}
                          className="text-red-600 hover:text-red-800 inline-flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}