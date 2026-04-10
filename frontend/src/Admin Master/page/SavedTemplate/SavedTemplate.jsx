import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrashAlt, FaTimes } from 'react-icons/fa';
import { BASE_URL } from '../../../config/Config';
import './SavedTemplate.scss';

const SavedTemplate = ({ onClose, onSelect, showAction = true }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/api/quotation-templates`);
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await axios.delete(`${BASE_URL}/api/quotation-templates/${id}`);
            setTemplates(templates.filter(t => t.ID !== id));
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    };

    const handleSelect = (template) => {
        if (onSelect) {
            onSelect(template);
        }
    };

    return (
        <div className="document-templates-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Document Templates</h2>
                    <button className="close-x-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div className="loading">Loading...</div>
                    ) : templates.length === 0 ? (
                        <div className="no-data">No templates found</div>
                    ) : (
                                <div className="template-table-wrapper">
                                    <table className="template-table">
                                        <thead>
                                            <tr>
                                                <th>Doc Type</th>
                                                <th>Series</th>
                                                <th>Customer</th>
                                                <th>Amount (₹)</th>
                                                {showAction && <th>Action</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {templates.map((template) => {
                                                const grandTotal = template.qutation_table?.grand_total || 0;
                                                
                                                return (
                                                    <tr key={template.ID} onClick={() => handleSelect(template)}>
                                                        <td>{template.qutation_table?.document_type || template.qutation_table?.type || 'Quotation'}</td>
                                                        <td>{template.QutationTemplateName}</td>
                                                        <td>
                                                            {template.qutation_table?.customer?.company_name || 
                                                             `${template.qutation_table?.customer?.firstname || ''} ${template.qutation_table?.customer?.lastname || ''}`.trim() || 
                                                             'N/A'}
                                                        </td>
                                                        <td>{Number(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        {showAction && (
                                                            <td>
                                                                <button 
                                                                    className="delete-btn" 
                                                                    onClick={(e) => handleDelete(e, template.ID)}
                                                                    title="Delete Template"
                                                                >
                                                                    <FaTrashAlt />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SavedTemplate;
