import axios from "axios";

import { BASE_URL } from "../../config/Config";

export const getOrgUnits = (params) =>
  axios.get(`${BASE_URL}/api/organization-units`, { params });

export const getOrgUnit = (id) =>
  axios.get(`${BASE_URL}/api/organization-units/${id}`);

export const createOrgUnit = (data) =>
  axios.post(`${BASE_URL}/api/organization-units`, data);

export const updateOrgUnit = (id, data) =>
  axios.put(`${BASE_URL}/api/organization-units/${id}`, data);

export const deleteOrgUnit = (id) =>
  axios.delete(`${BASE_URL}/api/organization-units/${id}`);
