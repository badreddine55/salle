"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "./Layout";
import PageHeader from "./PageHeader";
import { AlertCircle, User, Mail, Phone, MapPin, Key, Save, Edit, X, Check, Loader2, Eye, EyeOff } from "lucide-react";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
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
      console.log("Fetching from:", `${apiUrl}/api/auth/me`);

      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const userData = response.data.user || response.data;
      if (!userData) {
        throw new Error("Données utilisateur manquantes dans la réponse");
      }

      setUser(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else if (typeof err.response?.data === "string" && err.response.data.includes("<!DOCTYPE")) {
        setError("Erreur serveur : Réponse HTML reçue au lieu de JSON. Vérifiez l'URL de l'API.");
        console.error("Réponse HTML reçue:", err.response.data.slice(0, 200));
      } else {
        setError(`Échec du chargement du profil : ${errorMessage}`);
      }
      console.error("Erreur de chargement du profil :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setSaving(false);
      navigate("/");
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL ;
      console.log("Updating at:", `${apiUrl}/api/auth/me`);

      const response = await axios.put(`${apiUrl}/api/auth/me`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setUser({
        ...user,
        ...formData,
      });

      setSuccessMessage("Profil mis à jour avec succès");
      setTimeout(() => setSuccessMessage(""), 3000);
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else if (typeof err.response?.data === "string" && err.response.data.includes("<!DOCTYPE")) {
        setError("Erreur serveur : Réponse HTML reçue au lieu de JSON. Vérifiez l'URL de l'API.");
        console.error("Réponse HTML reçue:", err.response.data.slice(0, 200));
      } else {
        setError(`Échec de la mise à jour du profil : ${errorMessage}`);
      }
      console.error("Erreur de mise à jour du profil :", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSavingPassword(true);

    if (!passwordData.currentPassword) {
      setError("Le mot de passe actuel est requis");
      setSavingPassword(false);
      return;
    }
    if (!passwordData.newPassword) {
      setError("Le nouveau mot de passe est requis");
      setSavingPassword(false);
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      setSavingPassword(false);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setSavingPassword(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setSavingPassword(false);
      navigate("/");
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL ;
      console.log("Updating password at:", `${apiUrl}/api/auth/change-password`);

      await axios.put(
        `${apiUrl}/api/auth/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccessMessage("Mot de passe modifié avec succès");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      } else if (typeof err.response?.data === "string" && err.response.data.includes("<!DOCTYPE")) {
        setError("Erreur serveur : Réponse HTML reçue au lieu de JSON. Vérifiez l'URL de l'API.");
        console.error("Réponse HTML reçue:", err.response.data.slice(0, 200));
      } else {
        setError(`Échec du changement de mot de passe : ${errorMessage}`);
      }
      console.error("Erreur de changement de mot de passe :", err);
    } finally {
      setSavingPassword(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      address: user?.address || "",
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader title="Paramètres du profil" />
        <div className="flex justify-center items-center py-20">
          <svg
            className="animate-spin h-8 w-8 text-[#004AAD]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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

  return (
    <Layout>
      <PageHeader title="Paramètres du profil" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-[#004AAD] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                  <User className="h-8 w-8 text-[#004AAD]" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
                  <p className="text-red-100">{user?.role}</p>
                </div>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white text-[#004AAD] rounded-md hover:bg-gray-100 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-white text-[#004AAD] rounded-md hover:bg-gray-100 flex items-center"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Enregistrer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  {isEditing ? (
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#004AAD] focus:border-[#004AAD]"
                        placeholder="Votre nom"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user?.name}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#004AAD] focus:border-[#004AAD]"
                        placeholder="Votre email"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user?.email}</span>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  {isEditing ? (
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#004AAD] focus:border-[#004AAD]"
                        placeholder="Votre numéro de téléphone"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user?.phoneNumber || "Non renseigné"}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  {isEditing ? (
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#004AAD] focus:border-[#004AAD]"
                        placeholder="Votre adresse"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user?.address || "Non renseignée"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* API Keys Section (for User role) */}
              {user?.role === "User" && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Clés API Supabase</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL Supabase</label>
                      <div className="flex items-center">
                        <div className="flex-1 bg-white border border-gray-300 rounded-md p-2 overflow-x-auto">
                          <code className="text-sm text-gray-800">{user?.url_supabase || "Non configuré"}</code>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clé Anonyme Supabase</label>
                      <div className="flex items-center">
                        <div className="flex-1 bg-white border border-gray-300 rounded-md p-2 overflow-x-auto">
                          <code className="text-sm text-gray-800">
                            {user?.anon_key_supabase
                              ? `${user.anon_key_supabase.substring(0, 8)}...${user.anon_key_supabase.substring(
                                  user.anon_key_supabase.length - 8
                                )}`
                              : "Non configurée"}
                          </code>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Ces clés sont gérées par l'administrateur et ne peuvent pas être modifiées ici.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Password Change Section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h3>
              <form onSubmit={handlePasswordSubmit}>
                {/* Current Password */}
                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe actuel
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#004AAD] focus:border-[#004AAD]"
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#004AAD] focus:border-[#004AAD]"
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Le mot de passe doit contenir au moins 8 caractères.</p>
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#004AAD] focus:border-[#004AAD]"
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#004AAD] text-white rounded-md hover:bg-[#cc0029] focus:outline-none flex items-center"
                    disabled={savingPassword}
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Changer le mot de passe
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}