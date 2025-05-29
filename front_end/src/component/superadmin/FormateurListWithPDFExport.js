"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Download, AlertCircle, X, User, Mail, Loader2, Calendar, MessageCircle } from "lucide-react";
import { debounce } from "lodash";
import Layout from "./Layout";

// Custom Button Component
const Button = ({ children, onClick, className = "", variant = "default", size = "default", disabled = false }) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles = {
    default: "bg-[#004AAD] text-white hover:bg-[#003A8C] shadow-sm",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    ghost: "bg-transparent hover:bg-gray-100",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    whatsapp: "bg-[#25D366] text-white hover:bg-[#20B758] shadow-sm",
  };

  const sizeStyles = {
    default: "h-10 py-2 px-4 text-sm",
    sm: "h-9 px-3 rounded-md text-xs",
    lg: "h-11 px-8 rounded-md text-base",
    icon: "h-10 w-10",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Custom Input Component
const Input = ({ type = "text", placeholder, value, onChange, className = "" }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004AAD] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
};

// Custom Card Components
const Card = ({ children, className = "" }) => {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white text-gray-950 shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }) => {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
};

const CardTitle = ({ children, className = "" }) => {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
};

const CardContent = ({ children, className = "" }) => {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
};

// Custom Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline: "text-[#004AAD] border-[#A3CFFA] hover:bg-[#E6F0FA]",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    destructive: "bg-red-100 text-red-800 hover:bg-red-200",
    success: "bg-green-100 text-green-800 hover:bg-green-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Custom Alert Components
const Alert = ({ children, variant = "default", className = "" }) => {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    destructive: "bg-red-50 text-red-800 border-red-200",
    success: "bg-green-50 text-green-800 border-green-200",
  };

  return (
    <div className={`relative w-full rounded-lg border p-4 ${variantStyles[variant]} ${className}`} role="alert">
      {children}
    </div>
  );
};

const AlertDescription = ({ children, className = "" }) => {
  return <div className={`text-sm ${className}`}>{children}</div>;
};

function FormateurListWithPDFExport() {
  const [formateurs, setFormateurs] = useState([]);
  const [filteredFormateurs, setFilteredFormateurs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isSendingAllWhatsApp, setIsSendingAllWhatsApp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pdfLoading, setPdfLoading] = useState({});
  const navigate = useNavigate();

  const fetchFormateurs = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setIsLoading(false);
      navigate("/");
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL;
    if (!apiUrl) {
      setError("Configuration API manquante.");
      setIsLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/api/formateurs`, { headers });
      const formateurData = Array.isArray(response.data.data)
        ? response.data.data
            .filter((user) => user.role === "Formateur")
            .map((user) => ({ ...user, id: user._id }))
        : [];
      setFormateurs(formateurData);
      setFilteredFormateurs(formateurData);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Échec du chargement des formateurs : ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFormateurs();
  }, [navigate]);

  const debouncedSearch = useCallback(
    debounce((term) => {
      const filtered = formateurs.filter((formateur) =>
        formateur.name.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredFormateurs(filtered);
    }, 300),
    [formateurs]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleExportPDF = async (formateurId) => {
    if (!formateurId) {
      setError("Identifiant du formateur manquant.");
      setTimeout(() => setError(""), 8000);
      return;
    }

    const token = localStorage.getItem("token");
    const apiUrl = process.env.REACT_APP_API_URL;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setPdfLoading((prev) => ({ ...prev, [formateurId]: true }));
      const response = await axios.get(`${apiUrl}/api/schedules/formateurs/${formateurId}/pdf`, {
        headers,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `formateur-schedule-${formateurId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      if (error.response?.status === 404 && errorMessage.includes("Formateur non trouvé")) {
        setError("Le formateur demandé n'existe pas.");
      } else {
        setError(`Échec de l'exportation du PDF : ${errorMessage}`);
      }
      setTimeout(() => setError(""), 8000);
    } finally {
      setPdfLoading((prev) => ({ ...prev, [formateurId]: false }));
    }
  };

  const handleShowPDF = async (formateurId) => {
    if (!formateurId) {
      setError("Identifiant du formateur manquant.");
      setTimeout(() => setError(""), 8000);
      return;
    }

    const token = localStorage.getItem("token");
    const apiUrl = process.env.REACT_APP_API_URL;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setPdfLoading((prev) => ({ ...prev, [formateurId]: true }));
      const response = await axios.get(`${apiUrl}/api/schedules/formateurs/${formateurId}/pdf`, {
        headers,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      window.open(url, "_blank");
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      if (error.response?.status === 404 && errorMessage.includes("Formateur non trouvé")) {
        setError("Le formateur demandé n'existe pas.");
      } else {
        setError(`Échec de l'affichage du PDF : ${errorMessage}`);
      }
      setTimeout(() => setError(""), 8000);
    } finally {
      setPdfLoading((prev) => ({ ...prev, [formateurId]: false }));
    }
  };

  const handleSendWhatsApp = async (formateur) => {
    if (!formateur.id) {
      setError("Identifiant du formateur manquant.");
      setTimeout(() => setError(""), 8000);
      return;
    }

    if (!formateur.phoneNumber || !/^\+?\d{10,15}$/.test(formateur.phoneNumber)) {
      setError(`Numéro de téléphone invalide pour ${formateur.name}.`);
      setTimeout(() => setError(""), 8000);
      return;
    }

    const token = localStorage.getItem("token");
    const apiUrl = process.env.REACT_APP_API_URL;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setPdfLoading((prev) => ({ ...prev, [formateur.id]: true }));
      await axios.post(`${apiUrl}/api/whatsapp/send-whatsapp/${formateur.id}`, {}, { headers });
      setSuccess(`PDF envoyé à ${formateur.name} via WhatsApp.`);
      setTimeout(() => setSuccess(""), 8000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Échec de l'envoi à ${formateur.name} : ${errorMessage}`);
      setTimeout(() => setError(""), 8000);
    } finally {
      setPdfLoading((prev) => ({ ...prev, [formateur.id]: false }));
    }
  };

  const handleSendAllWhatsApp = async () => {
    if (filteredFormateurs.length === 0) {
      setError("Aucun formateur à envoyer.");
      setTimeout(() => setError(""), 8000);
      return;
    }

    if (!window.confirm(`Envoyer les PDFs à ${filteredFormateurs.length} formateurs via WhatsApp ?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    const apiUrl = process.env.REACT_APP_API_URL;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    setIsSendingAllWhatsApp(true);
    let successCount = 0;
    let errorMessages = [];

    for (const formateur of filteredFormateurs) {
      if (!formateur.phoneNumber || !/^\+?\d{10,15}$/.test(formateur.phoneNumber)) {
        errorMessages.push(`Numéro de téléphone invalide pour ${formateur.name}`);
        continue;
      }

      try {
        await axios.post(`${apiUrl}/api/whatsapp/send-whatsapp/${formateur.id}`, {}, { headers });
        successCount++;
        setSuccess(`Envoyé ${successCount}/${filteredFormateurs.length} PDFs...`);
      } catch (error) {
        errorMessages.push(`Échec pour ${formateur.name} : ${error.response?.data?.message || error.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsSendingAllWhatsApp(false);

    if (successCount > 0) {
      setSuccess(`${successCount} PDF${successCount > 1 ? "s" : ""} envoyé${successCount > 1 ? "s" : ""} via WhatsApp.`);
      setTimeout(() => setSuccess(""), 8000);
    }

    if (errorMessages.length > 0) {
      setError(errorMessages.join("; "));
      setTimeout(() => setError(""), 10000);
    }
  };

  const handleExportAllSchedulesPDF = async () => {
    const token = localStorage.getItem("token");
    const apiUrl = process.env.REACT_APP_API_URL;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setIsExportingAll(true);
      const response = await axios.get(`${apiUrl}/api/schedules/export/pdf`, {
        headers,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `all-schedules-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Échec de l'exportation de tous les plannings : ${errorMessage}`);
      setTimeout(() => setError(""), 8000);
    } finally {
      setIsExportingAll(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <Card className="w-full">
          <CardHeader className="bg-gradient-to-r mb-5 from-[#004AAD] to-[#0066FF] text-white rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <User className="h-6 w-6" />
                Liste des Formateurs
              </CardTitle>
              <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                {filteredFormateurs.length} formateur{filteredFormateurs.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-5 duration-300">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                  <AlertDescription className="flex items-center justify-between w-full">
                    {error}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setError("")}
                      className="h-6 w-6 rounded-full p-0 ml-2 text-red-600 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </div>
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mb-6 animate-in fade-in slide-in-from-top-5 duration-300">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-green-600" />
                  <AlertDescription className="flex items-center justify-between w-full">
                    {success}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSuccess("")}
                      className="h-6 w-6 rounded-full p-0 ml-2 text-green-600 hover:bg-green-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="relative w-full sm:w-1/2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Rechercher un formateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-2 border-gray-300 focus:ring-[#004AAD] focus:border-[#004AAD]"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleExportAllSchedulesPDF}
                  variant="default"
                  disabled={isExportingAll || isSendingAllWhatsApp}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#004AAD] to-[#0066FF] hover:from-[#003A8C] hover:to-[#0055DD]"
                >
                  {isExportingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Exporter tous
                </Button>
                <Button
                  onClick={handleSendAllWhatsApp}
                  variant="whatsapp"
                  disabled={isSendingAllWhatsApp || isExportingAll}
                  className="w-full sm:w-auto"
                >
                  {isSendingAllWhatsApp ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Envoyer tous WhatsApp
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 text-[#004AAD] animate-spin" />
                <p className="text-gray-600 text-lg font-medium mt-6">Chargement des formateurs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFormateurs.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">Aucun formateur trouvé</p>
                    <p className="text-gray-400 text-sm">Essayez de modifier votre recherche ou vérifiez les données.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <div className="grid grid-cols-12 bg-gray-100 p-4 font-medium text-gray-700 border-b border-gray-200">
                      <div className="col-span-6 sm:col-span-7">Formateur</div>
                      <div className="col-span-6 sm:col-span-5 text-right">Actions</div>
                    </div>
                    {filteredFormateurs.map((formateur, index) => (
                      <div
                        key={formateur.id}
                        className={`grid grid-cols-12 p-4 hover:bg-gray-100 transition-colors ${
                          index !== filteredFormateurs.length - 1 ? "border-b border-gray-200" : ""
                        }`}
                      >
                        <div className="col-span-6 sm:col-span-7 flex items-start gap-3">
                          <div className="hidden sm:flex h-10 w-10 rounded-full bg-[#E6F0FA] text-[#004AAD] items-center justify-center flex-shrink-0">
                            {formateur.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{formateur.name}</h3>
                            <div className="flex items-center text-gray-500 mt-1">
                              <Mail className="h-4 w-4 mr-1" />
                              <span className="text-sm truncate">{formateur.email}</span>
                            </div>
                            <Badge variant="outline" className="mt-2 bg-[#E6F0FA] text-[#004AAD] border-[#A3CFFA]">
                              Formateur
                            </Badge>
                          </div>
                        </div>
                        <div className="col-span-6 sm:col-span-5 flex flex-col sm:flex-row gap-2 sm:items-center justify-end flex-wrap">
                          <Button
                            onClick={() => handleShowPDF(formateur.id)}
                            disabled={pdfLoading[formateur.id] || !formateur.id}
                            className="w-full sm:w-auto bg-[#004AAD] hover:bg-[#003A8C] transition-all duration-200"
                          >
                            {pdfLoading[formateur.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <FileText className="h-4 w-4 mr-2" />
                            )}
                            Afficher
                          </Button>
                          <Button
                            onClick={() => handleExportPDF(formateur.id)}
                            variant="outline"
                            disabled={pdfLoading[formateur.id] || !formateur.id}
                            className="w-full sm:w-auto border-[#004AAD] text-[#004AAD] hover:bg-[#E6F0FA]"
                          >
                            {pdfLoading[formateur.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            Exporter
                          </Button>
                          <Button
                            onClick={() => handleSendWhatsApp(formateur)}
                            variant="whatsapp"
                            disabled={pdfLoading[formateur.id] || !formateur.id || !formateur.phoneNumber}
                            className="w-full sm:w-auto"
                          >
                            {pdfLoading[formateur.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <MessageCircle className="h-4 w-4 mr-2" />
                            )}
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default FormateurListWithPDFExport;