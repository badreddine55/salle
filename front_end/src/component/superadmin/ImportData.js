import React, { useState } from "react";
import axios from "axios";
import Layout from "./Layout";

// Static import with validation
let XLSX;
try {
  XLSX = require("xlsx");
  if (!XLSX.read) {
    throw new Error("XLSX.read is not a function");
  }
} catch (error) {
  console.error("Failed to load xlsx statically:", error.message);
}

export default function ImportData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [postStatus, setPostStatus] = useState(null);
  const [pendingFilieres, setPendingFilieres] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [selectedEtablissement, setSelectedEtablissement] = useState("");

  // Normalize column names for flexibility
  const normalizeColumnName = (header) => {
    const normalized = header.toLowerCase().trim();
    if (normalized.includes("filiere") || normalized.includes("filière")) return "filière";
    if (normalized.includes("niveau")) return "Niveau";
    if (normalized.includes("année") || normalized.includes("annee")) return "Année de formation";
    if (normalized.includes("effectif")) return "Effectif Groupe";
    if (normalized.includes("module")) return "Module";
    if (normalized.includes("mode")) return "Mode";
    if (normalized.includes("etablissement") || normalized.includes("établissement")) return "Etablissement";
    if (normalized.includes("groupe") || normalized.includes("groupes")) return "Groupes";
    return header;
  };

  // Handle file upload and parsing
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Veuillez uploader un fichier Excel (.xlsx ou .xls)");
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    setPostStatus(null);
    setPendingFilieres([]);
    setSelectedEtablissement("");

    let xlsxLib = XLSX;
    if (!xlsxLib) {
      try {
        xlsxLib = await import("xlsx");
        console.log("Dynamically imported xlsx");
      } catch (err) {
        setError("Erreur lors du chargement de la bibliothèque Excel: " + err.message);
        setData([]);
        setLoading(false);
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        if (!xlsxLib.read) {
          throw new Error("xlsxLib.read is not a function");
        }
        const workbook = xlsxLib.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsxLib.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        // Process headers and rows
        const headers = jsonData[0].map((header) => normalizeColumnName(header.toString()));
        const rows = jsonData.slice(1).filter((row) =>
          row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
        );
        const processedData = rows.map((row) => {
          const rowData = {};
          headers.forEach((header, index) => {
            let value = row[index] ?? "";
            rowData[header] = value.toString().trim();
          });
          return rowData;
        });

        // Clean and validate data
        const cleanedData = processAndCleanData(processedData, headers);
        setData(cleanedData);

        // Fetch etablissements
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentification requise. Veuillez vous connecter.");
        }
        const apiUrl = process.env.REACT_APP_API_URL;
        const etabResponse = await axios.get(`${apiUrl}/api/etablissements`, {
          headers: {
            Authorization: `Bearer ${token}`,
            role: localStorage.getItem("role") || "superadmin",
          },
        });
        const etabs = etabResponse.data.data || [];
        if (etabs.length === 0) {
          throw new Error("Aucun établissement trouvé dans la base de données. Veuillez ajouter des établissements.");
        }
        setEtablissements(etabs);

        // Process filieres
        const { validFilieres, pending, rejected } = processFilieres(cleanedData, etabs);
        if (validFilieres.length > 0) {
          await postFilieres(validFilieres);
        }
        if (pending.length > 0) {
          setPendingFilieres(pending);
        }
        if (validFilieres.length === 0 && pending.length === 0) {
          let errorMessage = "Aucune filière valide à envoyer.";
          if (rejected.length > 0) {
            errorMessage += ` Filières rejetées : ${rejected.map(r => `${r.name} (${r.reason})`).join(', ')}.`;
          }
          throw new Error(errorMessage);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setData([]);
        setPendingFilieres([]);
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier");
      setData([]);
      setPendingFilieres([]);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Process and clean the data
  const processAndCleanData = (rawData, headers) => {
    return rawData
      .filter((row) => Object.values(row).some((val) => val !== "" && val !== "N/A"))
      .map((row) => {
        const cleanedRow = {};
        headers.forEach((header) => {
          let value = row[header] || "";
          if (value === "" || value === null || value === undefined) {
            cleanedRow[header] = "N/A";
          } else if (header === "Effectif Groupe") {
            const numValue = parseInt(value);
            cleanedRow[header] = isNaN(numValue) ? "0" : numValue.toString();
          } else {
            cleanedRow[header] = value;
          }
        });
        return cleanedRow;
      });
  };

  // Process filieres and separate valid from pending
  const processFilieres = (data, etablissements) => {
    const filieresMap = new Map();
    const rejected = [];

    data.forEach((row, index) => {
      const filiereName = row["filière"]?.trim();
      if (!filiereName || filiereName === "N/A") {
        console.warn(`Row ${index + 2}: Skipping row: Invalid filière name - ${filiereName || "empty"}`);
        rejected.push({ name: filiereName || "unknown", reason: "Nom de filière invalide ou vide" });
        return;
      }

      if (!filieresMap.has(filiereName)) {
        filieresMap.set(filiereName, {
          name: filiereName,
          groups: new Map(),
          modules: new Map(),
          etablissement: null,
          originalEtablissement: row["Etablissement"] || "N/A",
        });
      }

      const filiere = filieresMap.get(filiereName);

      // Add group
      let groupNames = [];
      if (row["Groupes"] && row["Groupes"] !== "N/A") {
        groupNames = row["Groupes"].split(',').map(g => g.trim()).filter(g => g);
      } else if (row["Niveau"] && row["Année de formation"] && row["Niveau"] !== "N/A" && row["Année de formation"] !== "N/A") {
        const groupName = `${row["Niveau"].trim()}-${row["Année de formation"].trim()}`;
        groupNames = [groupName];
      }

      if (groupNames.length === 0) {
        // Add default group to ensure filière is not rejected
        const defaultGroup = `Groupe-${filiereName}-${index + 2}`;
        groupNames = [defaultGroup];
        console.warn(`Row ${index + 2}: No valid groups for filière ${filiereName}, using default group: ${defaultGroup}`);
      }

      groupNames.forEach((groupName) => {
        if (!filiere.groups.has(groupName)) {
          filiere.groups.set(groupName, {
            name: groupName,
            effectif: parseInt(row["Effectif Groupe"]) || 0,
          });
        }
      });

      // Add module
      let moduleNames = [];
      if (row["Module"] && row["Module"] !== "N/A") {
        moduleNames = row["Module"].split(',').map(m => m.trim()).filter(m => m);
      }

      const moduleMode = row["Mode"]?.trim() || "N/A";
      moduleNames.forEach((moduleName) => {
        const moduleKey = `${moduleName}-${moduleMode}`;
        if (moduleName && !filiere.modules.has(moduleKey)) {
          filiere.modules.set(moduleKey, {
            name: moduleName,
            mode: moduleMode,
          });
        }
      });

      // Map Etablissement
      if (row["Etablissement"] && row["Etablissement"] !== "N/A") {
        const etab = etablissements.find((e) => e.name.toLowerCase() === row["Etablissement"].toLowerCase());
        if (etab) {
          filiere.etablissement = etab._id;
        }
      }
    });

    const validFilieres = [];
    const pending = [];
    filieresMap.forEach((filiere) => {
      if (!filiere.name) {
        console.warn(`Skipping filière ${filiere.name || "unknown"}: Invalid name`);
        rejected.push({ name: filiere.name || "unknown", reason: "Nom de filière invalide" });
        return;
      }
      const filiereData = {
        name: filiere.name,
        groups: Array.from(filiere.groups.values()),
        modules: Array.from(filiere.modules.values()),
        etablissement: filiere.etablissement,
      };
      if (filiere.etablissement) {
        validFilieres.push(filiereData);
      } else {
        pending.push({ ...filiereData, originalEtablissement: filiere.originalEtablissement });
        console.log(`Filière ${filiere.name} added to pending: Etablissement ${filiere.originalEtablissement} not found`);
      }
    });

    return { validFilieres, pending, rejected };
  };

  // Submit pending filieres with selected etablissement
  const handleSubmitPendingFilieres = async () => {
    try {
      setLoading(true);
      setPostStatus(null);

      if (!selectedEtablissement) {
        throw new Error("Veuillez sélectionner un établissement pour les filières.");
      }

      const filieres = pendingFilieres.map((filiere) => ({
        ...filiere,
        etablissement: selectedEtablissement,
      }));

      await postFilieres(filieres);
    } catch (err) {
      setPostStatus({
        type: "error",
        message: `Erreur lors de l'envoi des données: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Post filieres to backend
  const postFilieres = async (filieres) => {
    const token = localStorage.getItem("token");
    const apiUrl = process.env.REACT_APP_API_URL;
    const skippedFilieres = [];
    const successfulFilieres = [];
    const failedFilieres = [];

    for (const filiere of filieres) {
      try {
        console.log("Posting filière:", filiere);
        const response = await axios.post(`${apiUrl}/api/filieres`, filiere, {
          headers: {
            Authorization: `Bearer ${token}`,
            role: localStorage.getItem("role") || "superadmin",
            "Content-Type": "application/json",
          },
        });
        if (response.data.message && response.data.message.includes("existe déjà")) {
          skippedFilieres.push(filiere.name);
        } else {
          successfulFilieres.push(filiere.name);
        }
      } catch (err) {
        if (err.response?.data?.message?.includes("existe déjà")) {
          skippedFilieres.push(filiere.name);
        } else {
          const errorMessage = err.response?.data?.message || err.message;
          console.error(`Erreur pour la filière ${filiere.name}: ${errorMessage}`);
          failedFilieres.push({ name: filiere.name, reason: errorMessage });
        }
      }
    }

    let message = "";
    if (successfulFilieres.length > 0) {
      message += `Filières importées avec succès : ${successfulFilieres.join(', ')}. `;
    }
    if (skippedFilieres.length > 0) {
      message += `Filières déjà existantes, ignorées : ${skippedFilieres.join(', ')}. `;
    }
    if (failedFilieres.length > 0) {
      message += `Filières non importées : ${failedFilieres.map(f => `${f.name} (${f.reason})`).join(', ')}.`;
    }
    if (!message) {
      message = "Aucune filière importée.";
    }

    setPostStatus({
      type: successfulFilieres.length > 0 ? "success" : failedFilieres.length > 0 ? "error" : "warning",
      message: message.trim(),
    });
    setData([]);
    setPendingFilieres([]);
    setSelectedEtablissement("");
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Importer Données</h1>
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Uploader un fichier Excel
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#004AAD] file:text-white hover:file:bg-[#003a8c]"
          />
        </div>
        {loading && (
          <div className="text-center text-gray-600">Chargement des données...</div>
        )}
        {error && (
          <div className="text-center text-red-600">{error}</div>
        )}
        {postStatus && (
          <div
            className={`text-center mb-4 ${
              postStatus.type === "success" ? "text-green-600" : postStatus.type === "warning" ? "text-yellow-600" : "text-red-600"
            }`}
          >
            {postStatus.message}
          </div>
        )}
        {pendingFilieres.length > 0 && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Sélectionner un établissement pour les filières suivantes
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Les filières suivantes ont des établissements invalides ou non spécifiés :</p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                {pendingFilieres.map((filiere) => (
                  <li key={filiere.name}>
                    {filiere.name} (Établissement dans Excel : {filiere.originalEtablissement})
                  </li>
                ))}
              </ul>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitPendingFilieres(); }} className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="block text-sm font-medium text-gray-700">
                  Établissement
                </label>
                <select
                  value={selectedEtablissement}
                  onChange={(e) => setSelectedEtablissement(e.target.value)}
                  className="mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#004AAD] focus:border-[#004AAD] focus:outline-none"
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
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#004AAD] hover:bg-[#003a8c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004AAD] disabled:opacity-50"
              >
                {loading ? "Envoi en cours..." : "Envoyer les filières"}
              </button>
            </form>
          </div>
        )}
        {!loading && !error && data.length > 0 && pendingFilieres.length === 0 && !postStatus && (
          <div className="text-center text-gray-600">
            Données prêtes à être envoyées. Veuillez attendre la confirmation.
          </div>
        )}
        {!loading && !error && data.length === 0 && !postStatus && pendingFilieres.length === 0 && (
          <div className="text-center text-gray-600">
            Veuillez uploader un fichier Excel pour afficher les données.
          </div>
        )}
      </div>
    </Layout>
  );
}