import axios from "axios";

import { BASE_URL } from "../../config/Config";

// Get all hierarchical users
export const getHierarchy = async (page = 1, limit = 10) => {
  const res = await axios.get(`${BASE_URL}/api/employee-hierarchy?page=${page}&limit=${limit}`);
  return res.data;
};

// Create hierarchy
export const createHierarchy = async (payload) => {
  const res = await axios.post(`${BASE_URL}/api/employee-hierarchy`, payload);
  return res.data;
};

// Update hierarchy
export const updateHierarchy = async (id, payload) => {
  const res = await axios.put(`${BASE_URL}/api/employee-hierarchy/${id}`, payload);
  return res.data;
};

// Delete hierarchy
export const deleteHierarchy = async (id) => {
  const res = await axios.delete(`${BASE_URL}/api/employee-hierarchy/${id}`);
  return res.data;
};
