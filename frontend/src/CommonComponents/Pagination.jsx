import React from 'react';
import './Pagination.scss';

const Pagination = ({ 
  page, 
  total, 
  rowsPerPage, 
  onPageChange, 
  onRowsPerPageChange,
  isZeroBased = true 
}) => {
  const currentPage = isZeroBased ? page : page - 1;
  const totalPages = Math.ceil(total / rowsPerPage);

  const handlePageClick = (p) => {
    if (p >= 0 && p < totalPages) {
      onPageChange(isZeroBased ? p : p + 1);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible + 2) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(
          <button 
            key={i} 
            className={`page-btn ${currentPage === i ? 'active' : ''}`}
            onClick={() => handlePageClick(i)}
            type="button"
          >
            {i + 1}
          </button>
        );
      }
    } else {
      // Always show first page
      pages.push(
        <button 
          key={0} 
          className={`page-btn ${currentPage === 0 ? 'active' : ''}`} 
          onClick={() => handlePageClick(0)}
          type="button"
        >
          1
        </button>
      );

      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages - 2, currentPage + 2);

      if (currentPage < 4) {
        end = 5;
      } else if (currentPage > totalPages - 5) {
        start = totalPages - 6;
      }

      if (start > 1) {
        pages.push(<span key="ellipsis-start" className="ellipsis">...</span>);
      }

      for (let i = start; i <= end; i++) {
        pages.push(
          <button 
            key={i} 
            className={`page-btn ${currentPage === i ? 'active' : ''}`} 
            onClick={() => handlePageClick(i)}
            type="button"
          >
            {i + 1}
          </button>
        );
      }

      if (end < totalPages - 2) {
        pages.push(<span key="ellipsis-end" className="ellipsis">...</span>);
      }

      // Always show last page
      pages.push(
        <button 
          key={totalPages - 1} 
          className={`page-btn ${currentPage === totalPages - 1 ? 'active' : ''}`} 
          onClick={() => handlePageClick(totalPages - 1)}
          type="button"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="custom-pagination">
      <div className="rows-per-page">
        {[10, 25, 50, 100].map((rows) => (
          <button
            key={rows}
            className={`rows-btn ${rowsPerPage === rows ? 'active' : ''}`}
            onClick={() => onRowsPerPageChange(rows)}
            type="button"
          >
            {rows}
          </button>
        ))}
      </div>
      <div className="page-navigation">
        <button 
          className="nav-btn" 
          disabled={currentPage === 0} 
          onClick={() => handlePageClick(currentPage - 1)}
          type="button"
        >
          &laquo;
        </button>
        {renderPageNumbers()}
        <button 
          className="nav-btn" 
          disabled={currentPage >= totalPages - 1} 
          onClick={() => handlePageClick(currentPage + 1)}
          type="button"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
};

export default Pagination;
