import React, { useState } from "react";
import { MdOutlineClear } from "react-icons/md";
import { IoMdLock, IoMdMail } from "react-icons/io";
import { AiOutlineDatabase } from 'react-icons/ai';
import { FaUsers } from 'react-icons/fa';
import { FiBarChart2 } from 'react-icons/fi';
import { GiGears } from 'react-icons/gi';
import { useNavigate } from "react-router-dom";
import { BASE_URL } from '../../../config/Config';
import './Login.scss';


function LoginPage() {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Basic validation
      if (!loginData.email || !loginData.password) {
        throw new Error("Please fill in all fields");
      }

      // Email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Make API call to login endpoint
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store the token in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");
      
      // Redirect to dashboard
      navigate("/dashboard");
      
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLoginData({ email: "", password: "" });
    setError("");
  };

  return (
    <div className="login-page">
      <div className="left-panel">
        <div className="marketing-wrap">
          <h1 className="app-title">Enterprise Resource Planning</h1>
          <p className="app-sub">Streamline your business operations with our comprehensive ERP solution</p>

          <ul className="features-list">
            <li>
              <span className="feature-icon"><AiOutlineDatabase /></span>
              <div>
                <h4>Centralized Data Management</h4>
                <p>All your business data in one secure location</p>
              </div>
            </li>
            <li>
              <span className="feature-icon"><FaUsers /></span>
              <div>
                <h4>Human Resources</h4>
                <p>Efficient employee management and payroll processing</p>
              </div>
            </li>
            <li>
              <span className="feature-icon"><FiBarChart2 /></span>
              <div>
                <h4>Real-time Analytics</h4>
                <p>Make data-driven decisions with powerful insights</p>
              </div>
            </li>
            <li>
              <span className="feature-icon"><GiGears /></span>
              <div>
                <h4>Process Automation</h4>
                <p>Automate routine tasks and improve efficiency</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="right-panel">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Please enter your credentials to login</p>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <label className="label">Email Address</label>
            <div className="input-with-icon">
              <IoMdMail className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <label className="label">Password</label>
            <div className="input-with-icon">
              <IoMdLock className="input-icon" />
              <input
                type="password"
                placeholder="Enter your password"
                name="password"
                value={loginData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={isLoading}
                className={`btn-login ${isLoading ? 'loading' : ''}`}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span className="ml-8">Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-reset"
              >
                <span className="icon"><MdOutlineClear /></span>
                Reset
              </button>
            </div>

            <div className="login-footer">
              <p>Don't have an account? <a href="/register">Sign up</a></p>
              <p><a href="/forgot-password">Forgot password?</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;