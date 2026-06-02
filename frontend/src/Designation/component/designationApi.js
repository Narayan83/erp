import axios from "axios";

import { BASE_URL } from "../../config/Config";

export const getDesignations = (params) =>
  axios.get(`${BASE_URL}/api/designations`, { params });

export const getDesignation = (id) =>
  axios.get(`${BASE_URL}/api/designations/${id}`);

export const createDesignation = (data) =>
  axios.post(`${BASE_URL}/api/designations`, data);

export const updateDesignation = (id, data) =>
  axios.put(`${BASE_URL}/api/designations/${id}`, data);

export const deleteDesignation = (id) =>
  axios.delete(`${BASE_URL}/api/designations/${id}`);
