import { useState } from "react";
import "./LoginPage.css";

type RoleType = "Y" | "N";

type LoginForm = {
  host: string;
  username: string;
  password: string;
  token: string;
};

type LoginPageProps = {
  onLoginSuccess: (role: RoleType) => void;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [form, setForm] = useState<LoginForm>({
    host: "",
    username: "",
    password: "",
    token: "logintoken",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    const { host, username, password } = form;

    if (!host || !username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getAuth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();
      console.log("Login Response:", data);
      switch (data?.message) {
        case "Invalid credentials":
          setError("Wrong password. Please try again.");
          break;
        case "Internal server error":
          setError("Invalid host. Please check and try again.");
          break;
        default:
          if (data?.role === "X") {
            setError("Username does not exist. Please try again.");
          } else if (response.status === 200 && (data.role === "Y" || data.role === "N")) {
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("loginBranch", data.branch);
            localStorage.setItem("uniqueUserToken", data.userToken);
            localStorage.setItem("host", form.host);
            localStorage.setItem("loginUsername", form.username);
            localStorage.setItem("branchDetails", data.branchdetails);
            localStorage.setItem("branchmap", data.branchmap);
            localStorage.setItem("userGeo", data.geo);

            onLoginSuccess(data.role);
          } else {
            setError("Unexpected response from server.");
          }
          break;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className="App">
      <section className="login-section">
        <div className="login-container">
          <div className="form-container">
            <p className="logoName">Welcome to FinBook</p>

            <form className="login-form" autoComplete="off" onSubmit={handleFormSubmit}>
              <input
                type="text"
                name="host"
                placeholder="Host Name"
                value={form.host}
                onChange={handleChange}
                disabled={loading}
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                disabled={loading}
              />

              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="eye-toggle-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="gray"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 
                      1.66-2.043C4.12 4.668 5.88 3.5 
                      8 3.5c2.12 0 3.879 1.168 
                      5.168 2.457A13.133 13.133 0 0 
                      1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 
                      1.12-1.465 1.755C11.879 
                      11.332 10.119 12.5 8 
                      12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 
                      13.134 0 0 1 1.172 8z" />
                    <path d="M8 5.5a2.5 2.5 0 1 0 
                      0 5 2.5 2.5 0 0 0 0-5zM4.5 
                      8a3.5 3.5 0 1 1 7 0 3.5 
                      3.5 0 0 1-7 0z" />
                  </svg>
                </button>
              </div>

              {error && <p className="error-message">{error}</p>}

              <button
                className="login-button"
                type="submit"
                disabled={loading || !form.host || !form.username || !form.password}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          <div className="image-container">
            <div className="login-image">
              <img
                src="fblogo2502.png"
                alt="FinBook Logo"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

