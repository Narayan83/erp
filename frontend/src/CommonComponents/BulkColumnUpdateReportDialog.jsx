import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import './bulk_column_update_report_dialog.scss';

function LogRow({ entry }) {
  const [open, setOpen] = useState(false);
  const hasChanges = entry.changes && Object.keys(entry.changes).length > 0;
  const isSuccess = entry.status === 'success';

  const summary = isSuccess
    ? `Updated ${entry.column || ''} (${entry.table || ''})${entry.message ? ` — ${entry.message}` : ''}`
    : entry.message || 'Error';

  return (
    <>
      <TableRow sx={{ bgcolor: isSuccess ? 'rgba(46, 125, 50, 0.04)' : 'rgba(211, 47, 47, 0.04)' }}>
        <TableCell padding="checkbox">
          {hasChanges && (
            <IconButton size="small" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse' : 'Expand'}>
              {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>{entry.row}</TableCell>
        <TableCell>{entry.code}</TableCell>
        <TableCell>{entry.column || '—'}</TableCell>
        <TableCell>
          <Typography variant="body2" color={isSuccess ? 'success.main' : 'error.main'}>
            {isSuccess ? '✓' : '✗'} {summary}
          </Typography>
        </TableCell>
      </TableRow>
      {hasChanges && (
        <TableRow>
          <TableCell colSpan={5} sx={{ py: 0, border: 0 }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ py: 1.5, px: 2, bgcolor: '#f8fafc', fontFamily: 'monospace', fontSize: 12 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(entry.changes, null, 2)}
                </pre>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

LogRow.propTypes = {
  entry: PropTypes.object.isRequired,
};

export default function BulkColumnUpdateReportDialog({ open, onClose, report }) {
  if (!open || !report) return null;

  const logs = report.logs || [];
  const successCount = report.successCount ?? 0;
  const errorCount = report.errorCount ?? 0;
  const allOk = errorCount === 0 && successCount > 0;

  const doneMessage = allOk
    ? `Update completed successfully. ${successCount} product(s) updated.`
    : `Update finished. ${successCount} updated, ${errorCount} error(s).`;

  return (
    <div className="bulk-report-overlay" role="presentation">
      <div
        className="bulk-report-dialog import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-report-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="import-dialog-body">
          <div className="dialog-body-title">
            <h3 className="import-dialog-title" id="bulk-report-title">Bulk Column Update Report</h3>
            <div className="bulk-report-header-stats">
              <span className="bulk-report-stat-ok">✓ {successCount} Updated</span>
              <span className="bulk-report-stat-err">✗ {errorCount} Errors</span>
            </div>
          </div>

          <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">Column</Typography>
            <Typography variant="subtitle1">
              {report.column}{' '}
              <Typography component="span" variant="body2" color="textSecondary">
                ({report.table})
              </Typography>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Total rows: {report.totalRows}</Typography>
          </Box>

          {logs.length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 48 }} />
                    <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((entry, idx) => (
                    <LogRow key={`${entry.row}-${entry.code}-${idx}`} entry={entry} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="textSecondary">No log entries.</Typography>
          )}
        </div>

        <footer className="bulk-report-footer">
          <div className={`bulk-report-done-banner ${allOk ? '' : 'has-errors'}`}>
            {doneMessage}
          </div>
          <button type="button" className="bulk-report-close-btn" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

BulkColumnUpdateReportDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  report: PropTypes.object,
};
