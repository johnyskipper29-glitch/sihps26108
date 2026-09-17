import { SearchHistoryItem, Recommendation } from '../src/types.js';

export class ReportService {
  // Generate RFC-compliant CSV report
  generateCSV(search: SearchHistoryItem, recommendations: Recommendation[]): string {
    const escapeCsv = (str: any) => {
      const s = String(str || '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines: string[] = [];

    // Header metadata
    lines.push('INDIAN STANDARDS PROCUREMENT RECOMMENDATION REPORT');
    lines.push(`Report ID,${escapeCsv(search.id)}`);
    lines.push(`Date Generated,${escapeCsv(new Date().toISOString())}`);
    lines.push(`Procurement Query,${escapeCsv(search.query)}`);
    lines.push(`Product Category,${escapeCsv(search.extracted_requirements.category)}`);
    lines.push(`Identified Product,${escapeCsv(search.extracted_requirements.product)}`);
    lines.push(`Application / Scope,${escapeCsv(search.extracted_requirements.application)}`);
    lines.push(`Operational Environment,${escapeCsv(search.extracted_requirements.environment)}`);
    lines.push(`AI Analysis Mode,${escapeCsv(search.ai_mode)}`);
    lines.push('');

    // Table of standards
    lines.push([
      'Rank',
      'Standard Number',
      'Standard Title',
      'Category',
      'Applicability Type',
      'Relevance Score (%)',
      'Confidence Score',
      'Human Review Status',
      'Recommendation Reason',
      'Matched Requirements',
      'Evidence Document',
      'Evidence Section',
      'Evidence Page',
      'Evidence Snippet'
    ].map(escapeCsv).join(','));

    recommendations.forEach((rec, idx) => {
      const std = rec.standard;
      const primaryEvidence = rec.evidence && rec.evidence.length > 0 ? rec.evidence[0] : null;

      lines.push([
        idx + 1,
        std?.is_number || rec.standard_id,
        std?.title || '',
        std?.category || '',
        rec.applicability_type,
        rec.relevance_score,
        rec.confidence_score,
        rec.review_status,
        rec.reason,
        rec.matched_requirements.join('; '),
        primaryEvidence?.document || '',
        primaryEvidence?.section || '',
        primaryEvidence?.page || '',
        primaryEvidence?.snippet || ''
      ].map(escapeCsv).join(','));
    });

    lines.push('');
    lines.push('LEGAL & COMPLIANCE DISCLAIMER');
    lines.push(escapeCsv(
      'AI-generated recommendations are intended to assist procurement review. Final applicability and compliance decisions must be verified by the authorized procurement/standards authority (Bureau of Indian Standards).'
    ));

    return lines.join('\r\n');
  }

  // Generate clean HTML printable report that can be saved directly or printed to PDF
  generatePrintableHtml(search: SearchHistoryItem, recommendations: Recommendation[]): string {
    const ext = search.extracted_requirements;
    const dateStr = new Date(search.created_at).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const recsHtml = recommendations.map((rec, idx) => {
      const std = rec.standard;
      const ev = rec.evidence?.[0];
      const badgeClass =
        rec.applicability_type === 'HIGHLY_APPLICABLE' ? 'background: #dcfce7; color: #166534; border: 1px solid #86efac;' :
        rec.applicability_type === 'STRONG_CANDIDATE' ? 'background: #e0f2fe; color: #075985; border: 1px solid #7dd3fc;' :
        'background: #fef9c3; color: #854d0e; border: 1px solid #fde047;';

      return `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; page-break-inside: avoid; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <span style="font-size: 13px; font-weight: 700; color: #475569;">RECOMMENDATION #${idx + 1}</span>
            <h3 style="margin: 4px 0; font-size: 18px; color: #0f172a;">${std?.is_number || rec.standard_id}</h3>
            <div style="font-size: 15px; color: #1e293b; font-weight: 500;">${std?.title}</div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; ${badgeClass}">
              ${rec.applicability_type.replace('_', ' ')}
            </span>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${rec.relevance_score}% <span style="font-size: 12px; font-weight: 400; color: #64748b;">relevance</span></div>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 12px 0; border-left: 3px solid #2563eb;">
          <div style="font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase;">Why Recommended:</div>
          <div style="font-size: 13px; color: #334155; margin-top: 4px; line-height: 1.5;">${rec.reason}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; font-size: 13px;">
          <div>
            <div style="font-weight: 700; color: #475569; margin-bottom: 6px;">Matched Requirements:</div>
            <ul style="margin: 0; padding-left: 20px; color: #334155;">
              ${rec.matched_requirements.map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
          <div>
            <div style="font-weight: 700; color: #475569; margin-bottom: 6px;">Supporting Evidence:</div>
            ${ev ? `
              <div style="background: #f1f5f9; padding: 8px 10px; border-radius: 4px; font-size: 12px; color: #475569;">
                <div><strong>Source:</strong> ${ev.document} (Page ${ev.page}, ${ev.section})</div>
                <div style="font-style: italic; margin-top: 4px; color: #1e293b;">"${ev.snippet}"</div>
              </div>
            ` : '<div style="color: #94a3b8;">No direct chunk evidence</div>'}
          </div>
        </div>
      </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Indian Standards Procurement Recommendation Report</title>
  <style>
    @media print {
      body { margin: 0; padding: 15mm; }
      @page { size: A4 portrait; margin: 10mm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 30px;
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
    }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
    <div>
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.05em; color: #2563eb; text-transform: uppercase;">Bureau of Indian Standards • Recommendation Report</div>
      <h1 style="margin: 4px 0 0 0; font-size: 24px; color: #0f172a;">Indian Standards Recommendation Report</h1>
      <div style="font-size: 13px; color: #64748b;">Automated Standards Matching for Public & Enterprise Procurement Specifications</div>
    </div>
    <div style="text-align: right; font-size: 12px; color: #64748b;">
      <div><strong>Report Ref:</strong> ${search.id.slice(0, 12)}</div>
      <div><strong>Generated:</strong> ${dateStr}</div>
      <div><strong>Analysis Mode:</strong> ${search.ai_mode}</div>
    </div>
  </div>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em;">Procurement Specification Entered</h2>
    <div style="font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height: 1.6; font-style: italic;">"${search.query}"</div>
  </div>

  <div style="margin-bottom: 28px;">
    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Extracted Technical Requirements</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr>
        <td style="padding: 6px 12px; font-weight: 700; width: 25%; background: #f1f5f9; border: 1px solid #e2e8f0;">Product Identified:</td>
        <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${ext.product || 'N/A'}</td>
        <td style="padding: 6px 12px; font-weight: 700; width: 25%; background: #f1f5f9; border: 1px solid #e2e8f0;">Category:</td>
        <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${ext.category || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; font-weight: 700; background: #f1f5f9; border: 1px solid #e2e8f0;">Intended Application:</td>
        <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${ext.application || 'N/A'}</td>
        <td style="padding: 6px 12px; font-weight: 700; background: #f1f5f9; border: 1px solid #e2e8f0;">Environment:</td>
        <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${ext.environment || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; font-weight: 700; background: #f1f5f9; border: 1px solid #e2e8f0;">Quantity & Capacity:</td>
        <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${ext.quantity} ${ext.power ? `(${ext.power})` : ''}</td>
        <td style="padding: 6px 12px; font-weight: 700; background: #f1f5f9; border: 1px solid #e2e8f0;">Material:</td>
        <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${ext.material || 'Standard Grade'}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; font-weight: 700; background: #f1f5f9; border: 1px solid #e2e8f0;">Technical Specs:</td>
        <td colspan="3" style="padding: 6px 12px; border: 1px solid #e2e8f0;">${(ext.technical_specifications || []).join(', ') || 'Standard test protocols'}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; font-weight: 700; background: #f1f5f9; border: 1px solid #e2e8f0;">Safety Requirements:</td>
        <td colspan="3" style="padding: 6px 12px; border: 1px solid #e2e8f0;">${(ext.safety_requirements || []).join(', ') || 'Standard industrial safety'}</td>
      </tr>
    </table>
  </div>

  <div>
    <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Recommended Indian Standards (${recommendations.length} identified)</h2>
    ${recsHtml}
  </div>

  <div style="margin-top: 36px; padding: 16px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.5;">
    <strong>OFFICIAL COMPLIANCE & LEGAL DISCLAIMER:</strong><br>
    AI-generated recommendations are intended strictly to assist procurement officers and technical evaluation committees in identifying candidate standards. This system does NOT make a legally binding compliance determination or replace formal technical verification by the authorized procurement / standards authority (Bureau of Indian Standards - BIS).
  </div>
</body>
</html>`;
  }
}

export const reportService = new ReportService();
