import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Row, Col, Card, Button, Form, 
  Table, Badge, Spinner, Alert, Modal,
  Pagination
} from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const IndiaMartAPI = ({ apiKey }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    contacted: 0,
    pending: 0
  });
  const [pagination, setPagination] = useState({
    start: 0,
    rows: 50,
    totalRecords: 0
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // API Configuration
  const BASE_URL = 'https://www.indiamart.com/icrm/rest/contacts/v1';

  const fetchLeads = async (start = 0) => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/fetch?GLUSK=${apiKey}&start=${start}&rows=${pagination.rows}`;
      
      console.log('Fetching from URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      if (response.data.STATUS === 'SUCCESS') {
        const fetchedLeads = response.data.DATA || [];
        setLeads(fetchedLeads);
        setPagination(prev => ({
          ...prev,
          start,
          totalRecords: response.data.TOTAL_RECORDS || fetchedLeads.length
        }));
        
        // Calculate statistics
        calculateStats(fetchedLeads);
        
        toast.success(`Fetched ${fetchedLeads.length} leads successfully`);
      } else {
        toast.error(response.data.MESSAGE || 'Failed to fetch leads');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      let errorMessage = 'Failed to connect to IndiaMART API';
      
      if (error.response) {
        errorMessage = `API Error: ${error.response.status} - ${error.response.data?.MESSAGE || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leadsData) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLeads = leadsData.filter(lead => 
      lead.QUERY_TIME && lead.QUERY_TIME.includes(today)
    ).length;
    
    // Mock data for demonstration
    setStats({
      total: leadsData.length,
      today: todayLeads,
      contacted: Math.floor(leadsData.length * 0.3),
      pending: Math.floor(leadsData.length * 0.7)
    });
  };

  const updateLeadStatus = async (leadId, status, remark = '') => {
    try {
      const payload = {
        GLUSK: apiKey,
        UNIQUE_QUERY_ID: leadId,
        CALL_STATUS: status,
        REMARK: remark
      };

      const response = await axios.post(`${BASE_URL}/update`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.STATUS === 'SUCCESS') {
        // Update local state
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.UNIQUE_QUERY_ID === leadId 
              ? { ...lead, STATUS: status, REMARK: remark }
              : lead
          )
        );
        toast.success('Lead status updated successfully');
      } else {
        toast.error('Failed to update lead status');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Error updating lead status');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Time', 'Name', 'Mobile', 'Email', 'Product', 'Message', 'Status'];
    const csvData = leads.map(lead => [
      lead.UNIQUE_QUERY_ID || '',
      lead.QUERY_TIME || '',
      lead.SENDER_NAME || '',
      lead.SENDER_MOBILE || '',
      lead.SENDER_EMAIL || '',
      lead.QUERY_PRODUCT_NAME || '',
      lead.QUERY_MESSAGE || '',
      lead.STATUS || 'New'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indiamart-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'INTERESTED': 'success',
      'NOT_INTERESTED': 'danger',
      'FOLLOW_UP': 'warning',
      'CONTACTED': 'info',
      'NEW': 'primary'
    };
    
    const color = statusMap[status] || 'secondary';
    return <Badge bg={color}>{status || 'NEW'}</Badge>;
  };

  const handleStatusUpdate = (leadId, status) => {
    const remark = prompt('Enter remark (optional):');
    if (remark !== null) {
      updateLeadStatus(leadId, status, remark);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchLeads(0);
    }
  }, [apiKey]);

  return (
    <Container fluid className="py-3">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-primary border-2">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Leads</h6>
                  <h2 className="mb-0">{stats.total}</h2>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-tag text-primary fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Today's Leads</h6>
                  <h2 className="mb-0 text-success">{stats.today}</h2>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-calendar text-success fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Contacted</h6>
                  <h2 className="mb-0 text-info">{stats.contacted}</h2>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-telephone text-info fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Pending</h6>
                  <h2 className="mb-0 text-warning">{stats.pending}</h2>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-clock text-warning fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Show Records</Form.Label>
                <Form.Select 
                  value={pagination.rows}
                  onChange={(e) => {
                    setPagination(prev => ({...prev, rows: parseInt(e.target.value)}));
                    fetchLeads(0);
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={8} className="text-end">
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => fetchLeads(pagination.start)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh Leads
                  </>
                )}
              </Button>
              
              <Button 
                variant="success"
                onClick={exportToCSV}
                disabled={leads.length === 0}
              >
                <i className="bi bi-download me-2"></i>
                Export CSV
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Leads Table */}
      <Card>
        <Card.Header className="bg-light">
          <h5 className="mb-0">IndiaMART Leads</h5>
          <small className="text-muted">
            Showing {leads.length} of {pagination.totalRecords} records
          </small>
        </Card.Header>
        
        <Card.Body className="p-0">
          {loading && leads.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Fetching leads from IndiaMART...</p>
            </div>
          ) : leads.length === 0 ? (
            <Alert variant="info" className="m-3">
              No leads found. Try refreshing or check your API key.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr key={lead.UNIQUE_QUERY_ID || index}>
                      <td>
                        <small className="text-muted">
                          {lead.UNIQUE_QUERY_ID ? lead.UNIQUE_QUERY_ID.substring(0, 8) + '...' : 'N/A'}
                        </small>
                      </td>
                      <td>
                        <small>
                          {lead.QUERY_TIME ? 
                            new Date(lead.QUERY_TIME).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 
                            'N/A'
                          }
                        </small>
                      </td>
                      <td>
                        <strong>{lead.SENDER_NAME || 'Unknown'}</strong>
                        <br />
                        <small className="text-muted">
                          {lead.SENDER_COMPANY || 'No company'}
                        </small>
                      </td>
                      <td>
                        <div>
                          <i className="bi bi-telephone text-success me-1"></i>
                          <small>{lead.SENDER_MOBILE || 'N/A'}</small>
                        </div>
                        <div>
                          <i className="bi bi-envelope text-primary me-1"></i>
                          <small>{lead.SENDER_EMAIL || 'N/A'}</small>
                        </div>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          {lead.QUERY_PRODUCT_NAME || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(lead.STATUS)}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-1 mb-1"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowModal(true);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        
                        <div className="d-flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => handleStatusUpdate(lead.UNIQUE_QUERY_ID, 'INTERESTED')}
                          >
                            Interested
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-warning"
                            onClick={() => handleStatusUpdate(lead.UNIQUE_QUERY_ID, 'FOLLOW_UP')}
                          >
                            Follow Up
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleStatusUpdate(lead.UNIQUE_QUERY_ID, 'NOT_INTERESTED')}
                          >
                            Not Interested
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Lead Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Lead Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLead && (
            <Row>
              <Col md={6}>
                <h6>Customer Information</h6>
                <p><strong>Name:</strong> {selectedLead.SENDER_NAME}</p>
                <p><strong>Company:</strong> {selectedLead.SENDER_COMPANY || 'N/A'}</p>
                <p><strong>Mobile:</strong> {selectedLead.SENDER_MOBILE}</p>
                <p><strong>Email:</strong> {selectedLead.SENDER_EMAIL}</p>
                <p><strong>City:</strong> {selectedLead.SENDER_CITY || 'N/A'}</p>
                <p><strong>State:</strong> {selectedLead.SENDER_STATE || 'N/A'}</p>
              </Col>
              
              <Col md={6}>
                <h6>Lead Information</h6>
                <p><strong>Query ID:</strong> {selectedLead.UNIQUE_QUERY_ID}</p>
                <p><strong>Time:</strong> {selectedLead.QUERY_TIME}</p>
                <p><strong>Product:</strong> {selectedLead.QUERY_PRODUCT_NAME}</p>
                <p><strong>Category:</strong> {selectedLead.QUERY_CATEGORY_NAME || 'N/A'}</p>
                
                <h6 className="mt-3">Message</h6>
                <div className="border rounded p-3 bg-light">
                  {selectedLead.QUERY_MESSAGE || 'No message provided'}
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              if (selectedLead.SENDER_MOBILE) {
                window.open(`tel:${selectedLead.SENDER_MOBILE}`, '_blank');
              }
            }}
            disabled={!selectedLead?.SENDER_MOBILE}
          >
            <i className="bi bi-telephone me-2"></i>
            Call Customer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* API Info */}
      <Alert variant="info" className="mt-4">
        <h6>API Information</h6>
        <small>
          <strong>Base URL:</strong> {BASE_URL}<br />
          <strong>API Key:</strong> {apiKey.substring(0, 10)}...<br />
          <strong>Last Updated:</strong> {new Date().toLocaleString()}
        </small>
      </Alert>
    </Container>
  );
};

export default IndiaMartAPI;