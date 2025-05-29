import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import PageHeader from "./PageHeader";
import { Edit, Trash2, AlertCircle, RefreshCw, Search } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

export default function FormateurManagement() {
  const [formateurs, setFormateurs] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "matricule", order: "asc" });
  const navigate = useNavigate();

  const fetchFormateurs = useCallback(async () => {
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
      const response = await axios.get(`${apiUrl}/api/formateurs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search,
          sort: sort.field,
          order: sort.order,
        },
      });

      const formateursData = Array.isArray(response.data.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
      console.log("Formateurs Response:", formateursData); // Debug
      if (formateursData.length > 0 && !formateursData[0]._id && !formateursData[0].id) {
        console.error("No _id or id found in formateurs data");
      }
      setFormateurs(formateursData);
      setPagination(response.data.pagination || { page: 1, limit: 10, total: formateursData.length, totalPages: Math.ceil(formateursData.length / 10) });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else {
        setError(`Erreur lors de la récupération des formateurs : ${errorMessage}`);
      }
      console.error("Erreur de récupération des formateurs :", err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, pagination.page, pagination.limit, search, sort]);

  useEffect(() => {
    fetchFormateurs();
  }, [fetchFormateurs]);

  const handleDelete = async (id) => {
    if (!id) {
      setError("ID du formateur invalide pour la suppression");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce formateur ?")) {
      return;
    }

    setError("");
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL ;
      await axios.delete(`${apiUrl}/api/formateurs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setFormateurs(formateurs.filter((formateur) => (formateur._id || formateur.id) !== id));
      toast.success("Formateur supprimé avec succès");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else {
        setError(`Erreur lors de la suppression du formateur : ${errorMessage}`);
      }
      console.error("Erreur de suppression du formateur :", err);
    }
  };

  const handleEdit = (id) => {
    if (!id) {
      setError("ID du formateur invalide pour la modification");
      toast.error("Impossible de modifier : ID du formateur manquant");
      return;
    }
    navigate(`/superadmin/formateurs/edit/${id}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleSort = (field) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <Layout>
      <PageHeader
        title="Gestion des formateurs"
        actionButton={{ label: "Créer un formateur", href: "/superadmin/formateurs/create" }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {/* Search and Refresh */}
          <div className="flex justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou matricule"
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD]"
                aria-label="Rechercher des formateurs"
              />
            </div>
            <button
              onClick={fetchFormateurs}
              className="flex items-center px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#222222]"
              aria-label="Rafraîchir la liste des formateurs"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir
            </button>
          </div>

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
                  fetchFormateurs();
                }}
                className="ml-4 text-sm text-red-600 underline"
                aria-label="Réessayer de charger les formateurs"
              >
                Réessayer
              </button>
            </div>
          ) : formateurs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Aucun formateur trouvé.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Liste des formateurs">
                  <thead className="bg-gray-50">
                    <tr>
                      {["matricule", "name", "email", "role", "actions"].map((field) => (
                        <th
                          key={field}
                          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            field !== "actions" ? "cursor-pointer" : ""
                          }`}
                          onClick={() => field !== "actions" && handleSort(field)}
                          aria-sort={sort.field === field ? sort.order : "none"}
                        >
                          {field === "matricule" && "Matricule"}
                          {field === "name" && "Nom"}
                          {field === "email" && "Email"}
                          {field === "role" && "Rôle"}
                          {field === "actions" && "Actions"}
                          {field !== "actions" && (
                            <span className="ml-1">
                              {sort.field === field && sort.order === "asc" ? "↑" : sort.order === "desc" ? "↓" : "↕"}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formateurs.map((formateur) => (
                      <tr key={formateur._id || formateur.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formateur.matricule}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formateur.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formateur.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              formateur.role === "Superadmin"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {formateur.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(formateur._id || formateur.id)}
                            className="text-[#004AAD] hover:text-[#222222] mr-4 inline-flex items-center"
                            aria-label={`Modifier ${formateur.name}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(formateur._id || formateur.id)}
                            className="text-red-600 hover:text-red-800 inline-flex items-center"
                            aria-label={`Supprimer ${formateur.name}`}
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
              {/* Pagination */}
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Affichage de {(pagination.page - 1) * pagination.limit + 1} à{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} formateurs
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                    aria-label="Page précédente"
                  >
                    Précédent
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-4 py-2 border border-gray-300 rounded-lg ${
                        pagination.page === i + 1 ? "bg-[#004AAD] text-white" : ""
                      }`}
                      aria-label={`Page ${i + 1}`}
                      aria-current={pagination.page === i + 1 ? "page" : undefined}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                    aria-label="Page suivante"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </Layout>
  );
}