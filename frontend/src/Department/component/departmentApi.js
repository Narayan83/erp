import axios from "axios";


import { BASE_URL } from "../../config/Config";

export const getDepartments = (params) =>
  axios.get(`${BASE_URL}/api/departments`, { params });

export const getDepartment = (id) =>
  axios.get(`${BASE_URL}/api/departments/${id}`);

export const createDepartment = (data) =>
  axios.post(`${BASE_URL}/api/departments`, data);

export const updateDepartment = (id, data) =>
  axios.put(`${BASE_URL}/api/departments/${id}`, data);

export const deleteDepartment = (id) =>
  axios.delete(`${BASE_URL}/api/departments/${id}`);
