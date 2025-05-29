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

export default function ImportProfs() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [postStatus, setPostStatus] = useState(null);

  // Handle file upload and parsing
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
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

    // Dynamic import fallback if static import failed
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
        const headers = jsonData[0].map((header) => header.toString().trim());
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

        // Process formateurs
        const formateurs = processFormateurs(cleanedData);
        if (formateurs.length > 0) {
          await postFormateurs(formateurs);
        } else {
          throw new Error("Aucun formateur valide à envoyer.");
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setData([]);
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier");
      setData([]);
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
            cleanedRow[header] = "";
          } else if (header === "phoneNumber") {
            cleanedRow[header] = value.replace(/\D/g, ''); // Remove non-digits
          } else {
            cleanedRow[header] = value;
          }
        });
        return cleanedRow;
      });
  };

  // Process formateurs
  const processFormateurs = (data) => {
    const formateursMap = new Map();
    data.forEach((row) => {
      const matricule = row["matricule"]?.trim();
      const email = row["email"]?.trim();
      if (!matricule || !email || matricule === "N/A" || email === "N/A") return;

      const formateur = {
        matricule,
        name: row["name"]?.trim() || "",
        email,
        phoneNumber: row["phoneNumber"]?.trim() || "",
        address: row["address"]?.trim() || "",
        role: row["role"]?.trim() || "Formateur",
      };

      // Validate required fields and email format
      if (!formateur.name) return;
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formateur.email)) return;
      if (formateur.role && !["Superadmin", "Formateur"].includes(formateur.role)) {
        formateur.role = "Formateur";
      }

      // Use matricule as key to avoid duplicates
      if (!formateursMap.has(matricule)) {
        formateursMap.set(matricule, formateur);
      }
    });

    return Array.from(formateursMap.values());
  };

  // Post formateurs to backend
  const postFormateurs = async (formateurs) => {
    const token = localStorage.getItem("token");
    const apiUrl = process.env.REACT_APP_API_URL;
    const skippedFormateurs = [];
    const successfulFormateurs = [];

    for (const formateur of formateurs) {
      try {
        console.log("Posting formateur:", formateur);
        const response = await axios.post(`${apiUrl}/api/formateurs`, formateur, {
          headers: {
            Authorization: `Bearer ${token}`,
            role: localStorage.getItem("role") || "superadmin",
            "Content-Type": "application/json",
          },
        });
        if (response.data.message && response.data.message.includes("existe déjà")) {
          skippedFormateurs.push(formateur.name);
        } else {
          successfulFormateurs.push(formateur.name);
        }
      } catch (err) {
        if (err.response?.data?.message?.includes("existe déjà")) {
          skippedFormateurs.push(formateur.name);
        } else {
          console.error(`Erreur pour le formateur ${formateur.name}: ${err.response?.data?.message || err.message}`);
          // Continue to next formateur without throwing
        }
      }
    }

    let message = "";
    if (successfulFormateurs.length > 0) {
      message += `Formateurs importés avec succès : ${successfulFormateurs.join(', ')}. `;
    }
    if (skippedFormateurs.length > 0) {
      message += `Formateurs déjà existants, ignorés : ${skippedFormateurs.join(', ')}.`;
    }
    if (!message) {
      message = "Aucun formateur importé.";
    }

    setPostStatus({
      type: successfulFormateurs.length > 0 ? "success" : "warning",
      message: message.trim(),
    });
    setData([]);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Importer Formateurs</h1>
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
        {!loading && !error && data.length > 0 && !postStatus && (
          <div className="text-center text-gray-600">
            Données prêtes à être envoyées. Veuillez attendre la confirmation.
          </div>
        )}
        {!loading && !error && data.length === 0 && !postStatus && (
          <div className="text-center text-gray-600">
            Veuillez uploader un fichier Excel pour afficher les données.
          </div>
        )}
      </div>
    </Layout>
  );
}