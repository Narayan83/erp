import axios from "axios";

import { BASE_URL } from "../../config/Config";

//  Fetch all departments
export const fetchDepartments = async () => {
  const res = await axios.get(`${BASE_URL}/api/departments`);
  return res.data?.data ?? res.data;
};

//  Fetch all designations
export const fetchDesignations = async () => {
  const res = await axios.get(`${BASE_URL}/api/designations`);
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
