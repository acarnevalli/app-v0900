import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export const LoginScreen: React.FC = () => {
  const { login, signUp, isLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (mode === "login") {
      const { success, error } = await login(email, password);
      if (!success) {
        setError(error ?? "Falha ao fazer login.");
      }
    } else {
      const { success, error } = await signUp(email, password);
      if (success) {
        setSuccess("Usuário criado e logado com sucesso!");
      } else {
        setError(error ?? "Falha ao criar usuário.");
      }
    }
  };

  if (isAuthenticated) {
    return (
      <div style={styles.container}>
        <h2>Você já está autenticado ✅</h2>
        <p>Atualize a página ou vá para o dashboard.</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h1 style={styles.title}>
          {mode === "login" ? "Entrar" : "Criar Conta"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          style={styles.input}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          style={styles.input}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />

        {error && <p style={{ ...styles.message, color: "#ff4d4f" }}>❌ {error}</p>}
        {success && <p style={{ ...styles.message, color: "#52c41a" }}>✅ {success}</p>}

        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading
            ? "Carregando..."
            : mode === "login"
            ? "Entrar"
            : "Cadastrar"}
        </button>

        <p style={styles.switchText}>
          {mode === "login" ? (
            <>
              Não tem uma conta?{" "}
              <span
                role="button"
                style={styles.link}
                onClick={() => setMode("signup")}
              >
                Cadastre-se
              </span>
            </>
          ) : (
            <>
              Já tem uma conta?{" "}
              <span
                role="button"
                style={styles.link}
                onClick={() => setMode("login")}
              >
                Entrar
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Estilos inline simples e responsivos
// -----------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1e1e2f, #282A36)",
    fontFamily: "Inter, sans-serif",
    color: "#f8f8f2",
    padding: "1rem",
  },
  container: {
    textAlign: "center",
    color: "#fff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: "2rem",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    width: "100%",
    maxWidth: 380,
  },
  title: {
    fontSize: "1.6rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    color: "#f8f8f2",
  },
  input: {
    marginBottom: "1rem",
    padding: "0.75rem",
    borderRadius: 6,
    border: "1px solid #444",
    backgroundColor: "#1e1e2f",
    color: "#fff",
    outline: "none",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    border: "none",
    borderRadius: 6,
    backgroundColor: "#6272a4",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "0.5rem",
    transition: "background-color 0.2s ease",
  },
  message: {
    marginTop: "0.5rem",
    textAlign: "center",
    fontSize: "0.9rem",
  },
  switchText: {
    textAlign: "center",
    marginTop: "1rem",
    fontSize: "0.9rem",
  },
  link: {
    color: "#8be9fd",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default LoginScreen;
