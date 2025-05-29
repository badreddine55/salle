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
  const [processingSummary, setProcessingSummary] = useState(null);

  // Normalize column names for flexibility
  const normalizeColumnName = (header) => {
    if (!header) return header;
    const normalized = header.toLowerCase().trim().replace(/[\s_]+/g, '');
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
    setProcessingSummary(null);

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

        // Validate row count and unique filieres
        if (processedData.length < 33) {
          console.warn(`Excel file contains ${processedData.length} rows, expected at least 33.`);
          setError(`Fichier Excel contient ${processedData.length} lignes, attendu au moins 33.`);
          setLoading(false);
          return;
        }
        const uniqueFilieres = new Set(processedData.map(row => row["filière"]?.trim()).filter(name => name && name !== "N/A"));
        if (uniqueFilieres.size < 33) {
          console.warn(`Excel file contains ${uniqueFilieres.size} unique filières, expected 33.`);
          setError(`Fichier Excel contient ${uniqueFilieres.size} filières uniques, attendu 33.`);
          setLoading(false);
          return;
        }

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
        console.log("Etablissements:", etabs);
        if (etabs.length === 0) {
          console.warn("No establishments found. All filières will be pending.");
        }
        setEtablissements(etabs);

        // Process filieres
        const { validFilieres, pending, rejected } = processFilieres(cleanedData, etabs);
        console.log("Processing results:", { validFilieres, pending, rejected });
        setProcessingSummary({ validFilieres, pending, rejected });

        if (validFilieres.length > 0) {
          await postFilieres(validFilieres);
        }
        if (pending.length > 0) {
          setPendingFilieres(pending);
          if (etabs.length > 0) {
            setSelectedEtablissement(etabs[0]._id);
            await handleSubmitPendingFilieres();
          }
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
        setProcessingSummary(null);
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier");
      setData([]);
      setPendingFilieres([]);
      setProcessingSummary(null);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Process and clean the data
  const processAndCleanData = (rawData, headers) => {
    return rawData.map((row) => {
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
    const filieresList = [];
    const rejected = [];
    const defaultEtablissement = etablissements[0]?._id;

    data.forEach((row, index) => {
      const filiereName = row["filière"]?.trim();
      if (!filiereName || filiereName === "N/A") {
        console.warn(`Row ${index + 2}: Skipping row: Invalid filière name - ${filiereName || "empty"}`);
        rejected.push({ name: filiereName || "unknown", reason: "Nom de filière invalide ou vide", row: index + 2, rawModule: row["Module"] });
        return;
      }

      const filiere = {
        name: filiereName,
        groups: [],
        modules: [],
        etablissement: null,
        originalEtablissement: row["Etablissement"] || "N/A",
        row: index + 2,
        rawModule: row["Module"],
      };

      // Add group
      let groupNames = [];
      if (row["Groupes"] && row["Groupes"] !== "N/A") {
        groupNames = row["Groupes"].split(',').map(g => g.trim()).filter(g => g);
      } else if (row["Niveau"] && row["Année de formation"] && row["Niveau"] !== "N/A" && row["Année de formation"] !== "N/A") {
        const groupName = `${row["Niveau"].trim()}-${row["Année de formation"].trim()}`;
        groupNames = [groupName];
      }

      if (groupNames.length === 0) {
        const defaultGroup = `Groupe-${filiereName}-${index + 2}`;
        groupNames = [defaultGroup];
        console.warn(`Row ${index + 2}: No valid groups for filière ${filiereName}, using default group: ${defaultGroup}`);
      }

      groupNames.forEach((groupName) => {
        filiere.groups.push({
          name: groupName,
          effectif: parseInt(row["Effectif Groupe"]) || 0,
        });
      });

      // Add modules
      let moduleNames = [];
      if (row["Module"] && row["Module"] !== "N/A") {
        console.log(`Row ${index + 2}: Raw Module value for ${filiereName}: "${row["Module"]}"`);
        // Split by semicolon only to preserve module names with commas
        moduleNames = row["Module"]
          .split(';')
          .map(m => m.trim())
          .filter(m => m && m !== "N/A");
      }

      const moduleMode = row["Mode"]?.trim() || "N/A";
      if (moduleNames.length === 0) {
        moduleNames = [`Module-${filiereName}-${index + 2}`];
        console.warn(`Row ${index + 2}: No valid modules for filière ${filiereName}, using default module: ${moduleNames[0]}`);
      } else {
        console.log(`Row ${index + 2}: Parsed modules for filière ${filiereName}: ${moduleNames.join(' | ')}`);
      }

      moduleNames.forEach((moduleName) => {
        filiere.modules.push({
          name: moduleName,
          mode: moduleMode,
        });
      });

      // Map Etablissement
      if (row["Etablissement"] && row["Etablissement"] !== "N/A") {
        const etab = etablissements.find((e) => e.name.toLowerCase() === row["Etablissement"].toLowerCase());
        if (etab) {
          filiere.etablissement = etab._id;
        }
      }
      if (!filiere.etablissement && defaultEtablissement) {
        filiere.etablissement = defaultEtablissement;
        console.log(`Row ${index + 2}: Assigned default establishment ${defaultEtablissement} for filière ${filiereName}`);
      }

      filieresList.push(filiere);
    });

    const validFilieres = [];
    const pending = [];
    filieresList.forEach((filiere) => {
      const filiereData = {
        name: filiere.name,
        groups: filiere.groups,
        modules: filiere.modules,
        etablissement: filiere.etablissement,
        row: filiere.row,
        rawModule: filiere.rawModule,
      };
      if (filiere.etablissement) {
        validFilieres.push(filiereData);
      } else {
        pending.push({ ...filiereData, originalEtablissement: filiere.originalEtablissement });
        console.log(`Row ${filiere.row}: Filière ${filiere.name} added to pending: Etablissement ${filiere.originalEtablissement} not found`);
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
        console.log(`Posting filière: ${filiere.name} with modules: ${filiere.modules.map(m => m.name).join(' | ')}`);
        const response = await axios.post(`${apiUrl}/api/filieres`, filiere, {
          headers: {
            Authorization: `Bearer ${token}`,
            role: localStorage.getItem("role") || "superadmin",
            "Content-Type": "application/json",
          },
        });
        if (response.data.message && response.data.message.includes("existe déjà")) {
          // Try updating instead
          try {
            await axios.put(`${apiUrl}/api/filieres/${encodeURIComponent(filiere.name)}`, filiere, {
              headers: {
                Authorization: `Bearer ${token}`,
                role: localStorage.getItem("role") || "superadmin",
                "Content-Type": "application/json",
              },
            });
            successfulFilieres.push(filiere.name);
          } catch (updateErr) {
            skippedFilieres.push(filiere.name);
            console.warn(`Failed to update filière ${filiere.name}: ${updateErr.message}`);
          }
        } else {
          successfulFilieres.push(filiere.name);
        }
      } catch (err) {
        if (err.response?.data?.message?.includes("existe déjà")) {
          // Try updating
          try {
            await axios.put(`${apiUrl}/api/filieres/${encodeURIComponent(filiere.name)}`, filiere, {
              headers: {
                Authorization: `Bearer ${token}`,
                role: localStorage.getItem("role") || "superadmin",
                "Content-Type": "application/json",
              },
            });
            successfulFilieres.push(filiere.name);
          } catch (updateErr) {
            skippedFilieres.push(filiere.name);
            console.warn(`Failed to update filière ${filiere.name}: ${updateErr.message}`);
          }
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
      message += `Filières non importées : ${failedFilieres.map(f => `${f.name} (${f.reason})`).join(', ')}. `;
    }
    if (pendingFilieres.length > 0) {
      message += `Filières en attente : ${pendingFilieres.map(f => f.name).join(', ')}. `;
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

  // Download summary as CSV
  const downloadSummary = () => {
    if (!processingSummary) return;
    const rows = [
      ['Filière', 'Ligne', 'Modules', 'Raw Module', 'Statut', 'Raison'],
      ...processingSummary.validFilieres.map(f => [
        f.name,
        f.row || '-',
        f.modules.map(m => m.name).join(';'),
        f.rawModule || 'N/A',
        'Valide',
        '-'
      ]),
      ...processingSummary.pending.map(f => [
        f.name,
        f.row,
        f.modules.map(m => m.name).join(';'),
        f.rawModule || 'N/A',
        'En attente',
        `Établissement: ${f.originalEtablissement}`
      ]),
      ...processingSummary.rejected.map(f => [
        f.name,
        f.row,
        'N/A',
        f.rawModule || 'N/A',
        'Rejeté',
        f.reason
      ]),
    ];
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'import_summary.csv');
    a.click();
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
        {processingSummary && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Résumé du traitement</h2>
              <button
                onClick={downloadSummary}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#004AAD] hover:bg-[#003a8c]"
              >
                Télécharger le résumé (CSV)
              </button>
            </div>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 text-left">Filière</th>
                  <th className="py-2 text-left">Ligne</th>
                  <th className="py-2 text-left">Modules</th>
                  <th className="py-2 text-left">Raw Module</th>
                  <th className="py-2 text-left">Statut</th>
                  <th className="py-2 text-left">Raison</th>
                </tr>
              </thead>
              <tbody>
                {processingSummary.validFilieres.map((f, idx) => (
                  <tr key={`valid-${idx}`}>
                    <td className="py-2">{f.name}</td>
                    <td className="py-2">{f.row || '-'}</td>
                    <td className="py-2">{f.modules.map(m => m.name).join('; ') || 'Aucun'}</td>
                    <td className="py-2">{f.rawModule || 'N/A'}</td>
                    <td className="py-2">Valide</td>
                    <td className="py-2">-</td>
                  </tr>
                ))}
                {processingSummary.pending.map((f, idx) => (
                  <tr key={`pending-${idx}`}>
                    <td className="py-2">{f.name}</td>
                    <td className="py-2">{f.row}</td>
                    <td className="py-2">{f.modules.map(m => m.name).join('; ') || 'Aucun'}</td>
                    <td className="py-2">{f.rawModule || 'N/A'}</td>
                    <td className="py-2">En attente</td>
                    <td className="py-2">Établissement: {f.originalEtablissement}</td>
                  </tr>
                ))}
                {processingSummary.rejected.map((f, idx) => (
                  <tr key={`rejected-${idx}`}>
                    <td className="py-2">{f.name}</td>
                    <td className="py-2">{f.row}</td>
                    <td className="py-2">N/A</td>
                    <td className="py-2">{f.rawModule || 'N/A'}</td>
                    <td className="py-2">Rejeté</td>
                    <td className="py-2">{f.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    {filiere.name} (Ligne: {filiere.row}, Modules: {filiere.modules.map(m => m.name).join('; ') || 'Aucun'}, Raw Module: {filiere.rawModule || 'N/A'}, Établissement: {filiere.originalEtablissement})
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