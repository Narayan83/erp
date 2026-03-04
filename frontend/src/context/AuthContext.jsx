import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../config/Config';

const AuthContext = createContext(null);

// Set initial axios header if token exists to catch early requests
const initialToken = localStorage.getItem('token');
if (initialToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Global axios interceptor for all outgoing requests
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Init auth state
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken) {
            setToken(storedToken);
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Failed to parse stored user", e);
                }
            }
            fetchMenus();
        }
        setLoading(false);
    }, []);

    // Monitor token changes
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            fetchMenus(); // Fetch menus when token changes/is set
        } else {
            localStorage.removeItem('token');
            setMenus([]);
        }
    }, [token]);

    const fetchMenus = async () => {
        try {
            // Avoid fetching if no token (though axios interceptor might handle it, better to be safe)
            if (!axios.defaults.headers.common['Authorization']) return;

            const response = await axios.get(`${BASE_URL}/api/my-menus`);
            setMenus(response.data);
        } catch (error) {
            console.error("Failed to fetch menus", error);
        }
    };

    const login = async (email, password) => {
        try {
            // Using fetch here because axios interceptor might not be set yet for the first request?
            // Actually, for login endpoint we don't need token.
            const response = await fetch(`${BASE_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Save user data
            localStorage.setItem("user", JSON.stringify(data.user));

            setToken(data.token);
            setUser(data.user);
            // fetchMenus will be triggered by token useEffect

            navigate("/home");
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setMenus([]);
        localStorage.removeItem("user");
        navigate("/login");
    };

    const getPermissions = (path) => {
        // flatten the menu tree to find the permission for the path
        let perms = null;
        const find = (items) => {
            for (const item of items) {
                if (item.url === path) {
                    perms = item.permissions;
                    return true;
                }
                if (item.children && item.children.length > 0) {
                    if (find(item.children)) return true;
                }
            }
            return false;
        };
        find(menus);
        return perms || { can_view: false, can_create: false, can_update: false, can_delete: false };
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, menus, getPermissions, loading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
