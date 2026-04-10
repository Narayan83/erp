import axios from "axios";

import { BASE_URL } from "../../config/Config";

// Fetch departments for dropdowns (API defaults to page=1, limit=10 — too few for selects)
export const fetchDepartments = async () => {
  const res = await axios.get(`${BASE_URL}/api/departments`, {
    params: { page: 1, limit: 2000 },
  });
  return res.data?.data ?? res.data;
};

// Fetch designations for dropdowns
export const fetchDesignations = async () => {
  const res = await axios.get(`${BASE_URL}/api/designations`, {
    params: { page: 1, limit: 2000 },
  });
  return res.data?.data ?? res.data;
};

//  Update employee job info
export const updateEmployee = async (id, payload) => {
  const res = await axios.put(`${BASE_URL}/api/employees/${id}`, payload);
  return res.data;
};




//  Update employee job info
export const fetchEmployee = async (id) => {
  const res = await axios.get(`${BASE_URL}/api/employees/${id}`);
  return res.data?.data ?? res.data; 
};
