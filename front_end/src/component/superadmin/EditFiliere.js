// C:\react projects\salle\front-end\src\components\EditFiliere.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import PageHeader from "./PageHeader";
import { AlertCircle, Plus, X } from "lucide-react";

export default function EditFiliere() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    groups: [], // Array of objects: [{ name: "Groupe A" }, ...]
    modules: [], // Array of objects: [{ name: "Programmation" }, ...]
    etablissement: "",
  });
  const [newGroup, setNewGroup] = useState("");
  const [newModule, setNewModule] = useState("");
  const [etablissements, setEtablissements] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch filiere and etablissements
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
        // Fetch filiere
        const filiereResponse = await axios.get(`${apiUrl}/api/filieres/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            role: localStorage.getItem("role") || "superadmin",
          },
        });
        const filiereData = filiereResponse.data.data;
        console.log("Filiere response:", filiereData); // Debug

        // Ensure groups and modules are arrays of objects
        const groups = Array.isArray(filiereData.groups)
          ? filiereData.groups.map((group) => ({
              name: typeof group === "string" ? group : group.name,
            }))
          : [];
        const modules = Array.isArray(filiereData.modules)
          ? filiereData.modules.map((module) => ({
              name: typeof module === "string" ? module : module.name,
            }))
          : [];

        setFormData({
          name: filiereData.name || "",
          groups,
          modules,
          etablissement: filiereData.etablissement?._id || "",
        });

        // Fetch etablissements
        const etabResponse = await axios.get(`${apiUrl}/api/etablissements`, {
          headers: {
            Authorization: `Bearer ${token}`,
            role: localStorage.getItem("role") || "superadmin",
          },
        });
        setEtablissements(etabResponse.data.data || []);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        if (err.response?.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/");
        } else if (err.response?.status === 404) {
          setError("Filière non trouvée");
        } else {
          setError(`Échec du chargement de la filière : ${errorMessage}`);
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

  // Handle new group input
  const handleGroupChange = (e) => {
    setNewGroup(e.target.value);
  };

  // Add group to list
  const handleAddGroup = () => {
    if (newGroup.trim() && !formData.groups.some((g) => g.name === newGroup.trim())) {
      setFormData((prev) => ({
        ...prev,
        groups: [...prev.groups, { name: newGroup.trim() }],
      }));
      setNewGroup("");
    }
  };

  // Remove group from list
  const handleRemoveGroup = (groupName) => {
    setFormData((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.name !== groupName),
    }));
  };

  // Handle new module input
  const handleModuleChange = (e) => {
    setNewModule(e.target.value);
  };

  // Add module to list
  const handleAddModule = () => {
    if (newModule.trim() && !formData.modules.some((m) => m.name === newModule.trim())) {
      setFormData((prev) => ({
        ...prev,
        modules: [...prev.modules, { name: newModule.trim() }],
      }));
      setNewModule("");
    }
  };

  // Remove module from list
  const handleRemoveModule = (moduleName) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.name !== moduleName),
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
      setError("Le nom de la filière est requis.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.etablissement) {
      setError("L'établissement est requis.");
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL ;
      console.log("Updating at:", `${apiUrl}/api/filieres/${id}`, formData);

      // Fetch existing groups for this filiere
      const existingGroupsResponse = await axios.get(`${apiUrl}/api/groupes?filiere=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          role: localStorage.getItem("role") || "superadmin",
        },
      });
      const existingGroups = existingGroupsResponse.data.data || [];

      // Check for duplicate groups in other filieres
      const allGroupsResponse = await axios.get(`${apiUrl}/api/groupes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          role: localStorage.getItem("role") || "superadmin",
        },
      });
      const allGroups = allGroupsResponse.data.data || [];
      const duplicateGroups = formData.groups.filter((group) =>
        allGroups.some((g) => g.name === group.name && g.filiere.toString() !== id)
      );
      if (duplicateGroups.length > 0) {
        setError(`Les groupes suivants existent déjà dans une autre filière : ${duplicateGroups.map(g => g.name).join(", ")}`);
        setIsSubmitting(false);
        return;
      }

      // Update filiere
      await axios.put(`${apiUrl}/api/filieres/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          role: localStorage.getItem("role") || "superadmin",
        },
      });

      // Sync groups in Groupe collection
      const currentGroupNames = formData.groups.map(g => g.name);
      const existingGroupNames = existingGroups.map(g => g.name);

      // Delete groups that were removed
      for (const existingGroup of existingGroups) {
        if (!currentGroupNames.includes(existingGroup.name)) {
          await axios.delete(`${apiUrl}/api/groupes/${existingGroup._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              role: localStorage.getItem("role") || "superadmin",
            },
          });
        }
      }

      // Add new groups
      for (const group of formData.groups) {
        if (!existingGroupNames.includes(group.name)) {
          await axios.post(
            `${apiUrl}/api/groupes`,
            { name: group.name, filiere: id, effectif: 0 },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                role: localStorage.getItem("role") || "superadmin",
              },
            }
          );
        }
      }

      navigate("/superadmin/filieres");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else if (err.response?.status === 400 && errorMessage.includes("filière avec ce nom existe")) {
        setError("Une filière avec ce nom existe déjà. Veuillez choisir un autre nom.");
      } else {
        setError(`Échec de la mise à jour de la filière : ${errorMessage}`);
      }
      console.error("Erreur de mise à jour de la filière :", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader title="Modifier la filière" />
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

  if (error === "Filière non trouvée") {
    return (
      <Layout>
        <PageHeader title="Modifier la filière" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Filière non trouvée.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Modifier la filière" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de la filière <span className="text-[#004AAD]">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
                required
                maxLength={50}
                placeholder="Ex: Informatique"
              />
            </div>
            {/* Etablissement */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Établissement <span className="text-[#004AAD]">*</span>
              </label>
              <select
                name="etablissement"
                value={formData.etablissement}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
                required
              >
                <option value="">Sélectionnez un établissement</option>
                {etablissements.map((etab) => (
                  <option key={etab._id} value={etab._id}>
                    {etab.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Groups */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Groupes
              </label>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={newGroup}
                  onChange={handleGroupChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
                  placeholder="Ex: Groupe A"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="ml-2 p-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#222222]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.groups.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {formData.groups.map((group, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                      <span>{group.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(group.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Modules */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Modules
              </label>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={newModule}
                  onChange={handleModuleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
                  placeholder="Ex: Programmation"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="ml-2 p-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#222222]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.modules.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {formData.modules.map((module, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                      <span>{module.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(module.name)}
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
                "Mettre à jour la filière"
              )}
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
}