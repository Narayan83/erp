import React, { useState } from "react";
import Button from "@mui/material/Button";
import { MdOutlineClear } from "react-icons/md";
import { IoMdLock, IoMdMail } from "react-icons/io";
import Skeleton from '@mui/material/Skeleton';
import { useNavigate } from "react-router-dom";
import { BASE_URL } from '../../../Config';


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
      const response = await fetch(`${BASE_URL}/login`, {
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
    <div className="login-container">
      <section className="login-content">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Please enter your credentials to login</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="container">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-12">
                <div className="form-container">
                  <div className="form-items">
                    <label>Email Address</label>
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
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-12">
                <div className="form-container">
                  <div className="form-items">
                    <label>Password</label>
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
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-12">
                <div className="form-container">
                  <div className="form-buttons">
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={isLoading}
                      fullWidth
                    >
                      {isLoading ? (
                        <>
                          <Skeleton variant="circular" width={10} height={10} />
                          <span className="mr-4"> Logging in...</span>
                        </>
                      ) : (
                        <span>Login</span>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={handleReset}
                      fullWidth
                    >
                      <span className="icon">
                        <MdOutlineClear />
                      </span>
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="login-footer">
              <p>
                Don't have an account? <a href="/register">Sign up</a>
              </p>
              <p>
                <a href="/forgot-password">Forgot password?</a>
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;