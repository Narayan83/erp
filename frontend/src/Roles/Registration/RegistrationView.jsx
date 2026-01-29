import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Skeleton from '@mui/material/Skeleton';
import { MdOutlineClear, MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { IoMdMail, IoMdPerson, IoMdCall } from "react-icons/io";
import './Registration.scss';
import { BASE_URL } from '../../config/Config';

const RegistrationView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/registration_view`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (userId) => {
    navigate(`/registration/${userId}?mode=view`);
  };

  const handleEdit = (userId) => {
    navigate(`/registration/${userId}?mode=edit`);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${BASE_URL}/registration/${userId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete user');
        }
        
        fetchUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <Skeleton variant="rectangular" width="100%" height={400} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-danger">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          <div className="table-container">
            <h2>User Records</h2>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/registration')}
              style={{ marginBottom: '20px' }}
            >
              Add New User
            </Button>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th><IoMdPerson /> First Name</th>
                    <th><IoMdPerson /> Last Name</th>
                    <th><IoMdMail /> Email</th>
                    <th><IoMdCall /> Mobile Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.firstname || '-'}</td>
                        <td>{user.lastname || '-'}</td>
                        <td>{user.email || '-'}</td>
                        <td>{user.mobile_number || '-'}</td>
                        <td>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small"
                            onClick={() => handleView(user.id)}
                            style={{ marginRight: '5px' }}
                          >
                            <MdVisibility /> View
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="secondary" 
                            size="small"
                            onClick={() => handleEdit(user.id)}
                            style={{ marginRight: '5px' }}
                          >
                            <MdEdit /> Edit
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            onClick={() => handleDelete(user.id)}
                          >
                            <MdDelete /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationView;