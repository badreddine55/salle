import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import PageHeader from "./PageHeader";
import { AlertCircle, Plus, X } from "lucide-react";

export default function CreateFiliere() {
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
  const navigate = useNavigate();

  // Fetch etablissements
  useEffect(() => {
    const fetchEtablissements = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentification requise. Veuillez vous connecter.");
          navigate("/");
          return;
        }
        const apiUrl = process.env.REACT_APP_API_URL ;
        const response = await axios.get(`${apiUrl}/api/etablissements`, {
          headers: {
            Authorization: `Bearer ${token}`,
            role: localStorage.getItem("role") || "superadmin",
          },
        });
        setEtablissements(response.data.data || []);
      } catch (err) {
        setError("Erreur lors de la récupération des établissements");
        console.error("Erreur de récupération des établissements :", err);
      }
    };
    fetchEtablissements();
  }, [navigate]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
  };

  // Handle new group input
  const handleGroupChange = (e) => {
    setNewGroup(e.target.value);
  };

  // Add group to list
  const handleAddGroup = () => {
    const groupName = newGroup.trim();
    if (!groupName) {
      setError("Le nom du groupe est requis.");
      return;
    }
    if (formData.groups.some((g) => g.name === groupName)) {
      setError("Ce groupe existe déjà dans la liste.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      groups: [...prev.groups, { name: groupName }],
    }));
    setNewGroup("");
    setError("");
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
    const moduleName = newModule.trim();
    if (!moduleName) {
      setError("Le nom du module est requis.");
      return;
    }
    if (formData.modules.some((m) => m.name === moduleName)) {
      setError("Ce module existe déjà dans la liste.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      modules: [...prev.modules, { name: moduleName }],
    }));
    setNewModule("");
    setError("");
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
      await axios.post(`${apiUrl}/api/filieres`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          role: localStorage.getItem("role") || "superadmin",
        },
      });
      navigate("/superadmin/filieres");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Une erreur est survenue";
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else {
        setError(`Échec de la création de la filière : ${errorMessage}`);
      }
      console.error("Erreur de création de la filière :", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Créer une filière" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de la filière <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
                required
                maxLength={50}
                placeholder="Ex: Informatique"
              />
            </div>
            {/* Etablissement */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Établissement <span className="text-blue-600">*</span>
              </label>
              <select
                name="etablissement"
                value={formData.etablissement}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
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
              <label className="block text-sm font-medium text-gray-700">Groupes</label>
              <div className="flex items-center mt-1 space-x-2">
                <input
                  type="text"
                  value={newGroup}
                  onChange={handleGroupChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
                  placeholder="Ex: Groupe A"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.groups.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {formData.groups.map((group, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-100 p-2 rounded-lg"
                    >
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
              <label className="block text-sm font-medium text-gray-700">Modules</label>
              <div className="flex items-center mt-1 space-x-2">
                <input
                  type="text"
                  value={newModule}
                  onChange={handleModuleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
                  placeholder="Ex: Programmation"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.modules.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {formData.modules.map((module, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-100 p-2 rounded-lg"
                    >
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
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-gray-800 transition-all flex justify-center items-center disabled:bg-gray-400"
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
                "Créer la filière"
              )}
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
}