import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import PageHeader from "./PageHeader";
import { AlertCircle, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

export default function CreateFormateur() {
  const [formData, setFormData] = useState({
    matricule: "",
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    role: "Formateur",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.matricule) newErrors.matricule = "Le matricule est requis";
    if (!formData.name) newErrors.name = "Le nom est requis";
    if (!formData.email) newErrors.email = "L'email est requis";
    else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (formData.phoneNumber && !/^\+?[\d\s-]{0,20}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Numéro de téléphone invalide";
    }
    if (formData.address && formData.address.length > 200) {
      newErrors.address = "L'adresse ne peut pas dépasser 200 caractères";
    }
    if (!["Superadmin", "Formateur"].includes(formData.role)) {
      newErrors.role = "Rôle invalide";
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setErrors({ global: "Authentification requise. Veuillez vous connecter." });
      setIsSubmitting(false);
      navigate("/");
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL ;
      await axios.post(`${apiUrl}/api/formateurs`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Formateur créé avec succès");
      setTimeout(() => navigate("/FormateurManagement"), 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setErrors({ global: "Session expirée. Veuillez vous reconnecter." });
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else {
        setErrors({ global: `Échec de la création du formateur : ${errorMessage}` });
      }
      console.error("Erreur de création du formateur :", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Créer un formateur" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Matricule */}
            <div>
              <label htmlFor="matricule" className="block text-sm font-medium text-gray-700">
                Matricule <span className="text-[#004AAD]">*</span>
              </label>
              <input
                id="matricule"
                type="text"
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border ${
                  errors.matricule ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none`}
                required
                aria-describedby={errors.matricule ? "matricule-error" : undefined}
              />
              {errors.matricule && (
                <p id="matricule-error" className="mt-1 text-sm text-red-600">
                  {errors.matricule}
                </p>
              )}
            </div>
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom <span className="text-[#004AAD]">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none`}
                required
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">
                  {errors.name}
                </p>
              )}
            </div>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-[#004AAD]">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none`}
                required
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>
            {/* Phone */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                id="phoneNumber"
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none`}
                aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
              />
              {errors.phoneNumber && (
                <p id="phoneNumber-error" className="mt-1 text-sm text-red-600">
                  {errors.phoneNumber}
                </p>
              )}
            </div>
            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border ${
                  errors.address ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none`}
                aria-describedby={errors.address ? "address-error" : undefined}
              />
              {errors.address && (
                <p id="address-error" className="mt-1 text-sm text-red-600">
                  {errors.address}
                </p>
              )}
            </div>
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rôle <span className="text-[#004AAD]">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border ${
                  errors.role ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none`}
                required
                aria-describedby={errors.role ? "role-error" : undefined}
              >
                <option value="Superadmin">Superadmin</option>
                <option value="Formateur">Formateur</option>
              </select>
              {errors.role && (
                <p id="role-error" className="mt-1 text-sm text-red-600">
                  {errors.role}
                </p>
              )}
            </div>
            {/* Global Error */}
            {errors.global && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.global}
              </div>
            )}
            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#004AAD] text-white py-3 rounded-lg hover:bg-[#222222] transition-all flex justify-center items-center disabled:opacity-50"
                aria-label="Créer le formateur"
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
                  "Créer le formateur"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/FormateurManagement")}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all flex justify-center items-center"
                aria-label="Annuler"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </button>
            </div>
          </form>
        </div>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </Layout>
  );
}