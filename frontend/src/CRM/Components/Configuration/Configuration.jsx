import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaTag, FaBox, FaCity, FaPlus, FaTimesCircle, FaThumbsDown } from 'react-icons/fa';
import PrintHeader from '../../../Admin Master/page/PrintHeader/PrintHeader';
import Sources from './Sources/Sources';
import Tags from './Tags/Tags';
import RejectionReasons from './RejectionReasons/RejectionReasons';
import './configuration.scss';

const Configuration = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const [showSources, setShowSources] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showRejectionReasons, setShowRejectionReasons] = useState(false);

  // Configuration cards data
  const configurationCards = [
    {
      id: 'sources',
      title: 'Sources',
      description: 'Add all the different sources from where your leads are coming.',
      icon: FaUsers,
      color: 'sources-card'
    },
    {
      id: 'tags',
      title: 'Tags',
      description: 'Manage the master entries of tags used for prospects & connections.',
      icon: FaTag,
      color: 'tags-card'
    },
    {
      id: 'rejection-reasons',
      title: 'Rejection Reasons',
      description: 'List reasons why a prospect may reject your appointment request.',
      icon: FaThumbsDown,
      color: 'rejection-reasons-card'
    },
    {
        id: 'inactive-reasons',
        title: 'Inactive Reasons',
        description: 'List reasons why a lead or prospect may become inactive.',
        icon: FaTimesCircle,
        color: 'inactive-reasons-card'
    },
    {
      id: 'products',
      title: 'Product List',
      description: 'Add products or services provided by you.',
      icon: FaBox,
      color: 'products-card'
    },
    {
      id: 'cities',
      title: 'City List',
      description: 'Manage the master entries of cities used for leads & connections.',
      icon: FaCity,
      color: 'cities-card'
    }
  ];

  const handleCardClick = (cardId) => {
    // Open inline modals for some cards, otherwise navigate
    if (cardId === 'sources') {
      setShowSources(true);
      return;
    }
    if (cardId === 'tags') {
      setShowTags(true);
      return;
    }
    if (cardId === 'rejection-reasons') {
      setShowRejectionReasons(true);
      return;
    }
    navigate(`/configuration/${cardId}`);
  };

  return (
    <div className="configuration-container">
      {/* Header Section */}
      <div className="config-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          <FaArrowLeft /> Back
        </button>
        <h1>Sales Configuration</h1>
      </div>

      {/* Main Content */}
      <div className="configuration-content">
        {/* CRM Section Header */}
        <div className="section-header">
          <div className="section-title">CRM (Leads & Prospects)</div>
          <p className="section-description">Set up your CRM to manage leads and prospects effectively.</p>
        </div>

        {/* Configuration Cards Grid */}
        <div className="cards-grid">
          {configurationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className={`config-card ${card.color}`}
                onClick={() => handleCardClick(card.id)}
              >
                <div className="card-icon">
                  <IconComponent />
                </div>
                <div className="card-content">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources / Tags / Rejection Reasons Modals */}
      <Sources isOpen={showSources} onClose={() => setShowSources(false)} />
      <Tags isOpen={showTags} onClose={() => setShowTags(false)} />
      <RejectionReasons isOpen={showRejectionReasons} onClose={() => setShowRejectionReasons(false)} />
  {/* Print Header page/modal when route is /configuration/header */}
  {type === 'header' && (
    <PrintHeader
      show={true}
      onClose={() => navigate('/configuration')}
      onSave={(data) => {
        // TODO: call API to save header; for now just navigate back
        // console.log('Saved header', data);
        navigate('/configuration');
      }}
    />
  )}

    </div>
  );
};

export default Configuration;
