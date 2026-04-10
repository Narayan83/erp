import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaTags, FaBalanceScale, FaBox, FaBoxes, FaBarcode, FaColumns, FaList } from 'react-icons/fa';
import './productconfig.scss';

export default function ProductConfig() {
  const navigate = useNavigate();

  const cards = [
    { key: 'category', title: 'Category', desc: 'Add and update categories for the inventory items.', icon: FaBoxes, route: '/ManageCategory' },
    { key: 'subcategory', title: 'Subcategory', desc: 'Add and manage subcategories under categories.', icon: FaList, route: '/ManageSubcategory' },
    { key: 'tag', title: 'Tag', desc: 'Add and manage tags for products.', icon: FaTags, route: '/ManageTag' },
    { key: 'store', title: 'Store', desc: 'Manage stores and stock locations.', icon: FaStore, route: '/ManageStore' },
    { key: 'unit', title: 'Unit', desc: 'Configure units and precision for inventory items.', icon: FaBox, route: '/ManageUnit' },
    { key: 'tax', title: 'Tax', desc: 'Configure tax rates and types.', icon: FaBalanceScale, route: '/ManageTax' },
    { key: 'hsn', title: 'HSN / SAC', desc: 'Add HSN/SAC codes for the inventory items.', icon: FaBarcode, route: '/ManageHSN' },
    { key: 'size', title: 'Size', desc: 'Add and manage size variants for products.', icon: FaColumns, route: '/ManageSize' },
  ];

  const handleClick = (card) => {
    if (card.route) navigate(card.route);
    else {
      // Placeholder action for items that don't have a dedicated route yet
      // Using alert for now; can be replaced with modal later
      window.alert(`${card.title} configuration is not implemented yet.`);
    }
  };

  return (
    <div className="product-config-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <div className="header-actions">
          <button className="btn btn-small btn-outline" onClick={() => navigate('/ProductMaster')}>BACK</button>
        </div>
      </div>

      <section className="section">
        <div className="section-ribbon blue">
          <div className="ribbon-title">Settings</div>
          <div className="ribbon-sub">Set up product-related configuration.</div>
        </div>

        <div className="cards-grid">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.key} className="config-card" onClick={() => handleClick(c)}>
                <div className="card-icon">{Icon ? <Icon /> : c.title.charAt(0)}</div>
                <div className="card-body">
                  <div className="card-title">{c.title}</div>
                  <div className="card-desc">{c.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
