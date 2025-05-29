"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"
import logo from "../../assets/logo1.png"
import backgroundImage from "../../assets/imageleft.jpeg" // Static import

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Load saved credentials if "Remember Me" was enabled
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail")
    const savedPassword = localStorage.getItem("rememberedPassword")
    const savedRememberMe = localStorage.getItem("rememberMe") === "true"

    if (savedRememberMe && savedEmail && savedPassword) {
      setEmail(savedEmail)
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Client-side validation
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError("Veuillez remplir tous les champs.")
      setIsSubmitting(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError("Veuillez entrer une adresse e-mail valide.")
      setIsSubmitting(false)
      return
    }

    try {
      const controller = new AbortController();
      const apiUrl = process.env.REACT_APP_API_URL;
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", trimmedEmail);
          localStorage.setItem("rememberedPassword", password);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
          localStorage.setItem("rememberMe", "false");
        }

        window.location.href = getRedirectPath(data.role);
      } else {
        setError(
          data.message === "Invalid credentials"
            ? "Email ou mot de passe incorrect."
            : data.message || "Échec de la connexion. Veuillez réessayer."
        );
      }
    } catch (error) {
      setError(
        error.name === "AbortError"
          ? "La requête a expiré. Veuillez réessayer."
          : "Erreur réseau. Veuillez vérifier votre connexion et réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRedirectPath = (role) => {
    switch (role) {
      case "Superadmin":
        return "/FormateurManagement"
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-1/2 bg-gradient-to-b from-[#1E3A8A/10] to-[#F8F8F8] shadow-lg px-4 sm:px-6 pt-0 pb-8"
        >
          <div className="w-full max-w-md mx-auto">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-4 sm:mb-4 text-center"
            >
              <div className="w-32 h-28 sm:w-40 sm:h-36 mx-auto drop-shadow-md hover:scale-105 transition-transform duration-300">
                <img src={logo || "/images/logo.png"} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A8A] mt-4 sm:mt-6 mb-2 sm:mb-3">
                Connectez-vous à votre compte
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xs mx-auto">
                Entrez vos identifiants pour accéder à votre compte.
              </p>
            </motion.div>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-4 sm:space-y-6 bg-white p-4 sm:p-6 rounded-2xl shadow-md"
              onSubmit={handleLogin}
            >
              {/* Email Field */}
              <div className="space-y-1 sm:space-y-2">
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-[#1E3A8A] mb-1">
                  Adresse e-mail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 sm:py-3 border-2 border-[#1E3A8A/20] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all duration-300 pl-10 text-sm"
                    placeholder="Entrez votre e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E3A8A] absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1 sm:space-y-2">
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-[#1E3A8A] mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="w-full px-4 py-2 sm:py-3 border-2 border-[#1E3A8A/20] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all duration-300 pl-10 pr-10 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E3A8A] absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E3A8A] hover:text-[#FBBF24] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 sm:p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs sm:text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Remember Me */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-1 sm:pt-2 gap-3 sm:gap-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3 w-3 sm:h-4 sm:w-4 rounded border-[#1E3A8A/20] text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-xs sm:text-sm text-gray-600">
                    Se souvenir de moi
                  </label>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] text-white py-2.5 sm:py-3 px-4 rounded-xl hover:from-[#1E3A8A] hover:to-[#FBBF24] transition-all duration-300 font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex justify-center items-center mt-3 sm:mt-4"
              >
                {isSubmitting ? (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : null}
                {isSubmitting ? "Connexion en cours..." : "Se connecter"}
              </button>
            </motion.form>
          </div>
        </motion.div>

        {/* Right Side - Background Image with Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="hidden lg:block lg:w-1/2 relative overflow-hidden"
        >
          {/* Background Image */}
          <img
            src={backgroundImage || "/placeholder.svg"}
            alt="Background Image"
            className="w-full h-full object-cover"
          />

          {/* Quote Overlay at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-white/60"
          >
            <div className="relative">
              <div className="absolute -left-4 -top-4 text-[#FBBF24] opacity-20 text-5xl font-serif">"</div>
              <h2 className="text-[#1E3A8A] text-lg sm:text-xl md:text-2xl font-semibold italic text-center leading-relaxed drop-shadow-md">
                Avec l'OFPPT, chaque étape vous rapproche de la réussite professionnelle qui vous attend !
              </h2>
              <div className="absolute -right-4 -bottom-4 text-[#FBBF24] opacity-20 text-5xl font-serif">"</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}