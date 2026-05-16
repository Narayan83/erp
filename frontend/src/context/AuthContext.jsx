import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    // Monitor token changes — keep axios default header in sync (login only updated localStorage before)
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchMenus();
        } else {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setMenus([]);
        }
    }, [token]);

    const fetchMenus = useCallback(async () => {
        try {
            // Must not rely on axios.defaults alone: after client-side login defaults were never set
            if (!localStorage.getItem('token')) return;

            const response = await axios.get(`${BASE_URL}/api/my-menus`);
            setMenus(response.data);
        } catch (error) {
            console.error("Failed to fetch menus", error);
        }
    }, []);

    useEffect(() => {
        const onMenusChanged = () => {
            fetchMenus();
        };
        window.addEventListener('menuCreated', onMenusChanged);
        window.addEventListener('menusUpdated', onMenusChanged);
        return () => {
            window.removeEventListener('menuCreated', onMenusChanged);
            window.removeEventListener('menusUpdated', onMenusChanged);
        };
    }, [fetchMenus]);

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

            navigate("/dashboard");
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
        localStorage.removeItem("token");
        localStorage.removeItem("isAuthenticated");
        delete axios.defaults.headers.common['Authorization'];
        navigate("/login");
    };

    const normalizePath = (p) => {
        if (p == null || typeof p !== 'string') return '';
        if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
        return p;
    };

    const getPermissions = (path) => {
        const needle = normalizePath(path);
        // flatten the menu tree to find the permission for the path
        let perms = null;
        const find = (items) => {
            for (const item of items) {
                if (normalizePath(item.url) === needle) {
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
        <AuthContext.Provider value={{ user, token, login, logout, menus, getPermissions, refetchMenus: fetchMenus, loading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
