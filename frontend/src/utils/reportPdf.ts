import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report } from '../types';

export function downloadReportPdf(report: Report) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ==================== HEADER ====================
  // Purple banner
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CMS Ethiopia', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Crime Management System — Official Report', 14, 22);

  // ==================== TITLE SECTION ====================
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Crime Report', 14, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const refNumber = report.id.slice(0, 8).toUpperCase();
  doc.text(`Reference: RPT-${refNumber}`, 14, 52);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth - 14,
    52,
    { align: 'right' }
  );

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 56, pageWidth - 14, 56);

  // ==================== STATUS BADGES ====================
  const statusColors: Record<string, [number, number, number]> = {
    pending: [245, 158, 11],       // amber
    under_review: [59, 130, 246],  // blue
    escalated: [239, 68, 68],      // red
    resolved: [34, 197, 94],       // green
    rejected: [107, 114, 128],     // gray
  };

  const urgencyColors: Record<string, [number, number, number]> = {
    low: [16, 185, 129],
    medium: [59, 130, 246],
    high: [245, 158, 11],
    critical: [239, 68, 68],
  };

  // Status pill
  const statusColor = statusColors[report.status] || [107, 114, 128];
  doc.setFillColor(...statusColor);
  doc.roundedRect(14, 62, 45, 8, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    report.status.replace('_', ' ').toUpperCase(),
    36.5,
    67.5,
    { align: 'center' }
  );

  // Urgency pill
  const urgencyColor = urgencyColors[report.urgency] || [107, 114, 128];
  doc.setFillColor(...urgencyColor);
  doc.roundedRect(64, 62, 45, 8, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(report.urgency.toUpperCase(), 86.5, 67.5, { align: 'center' });

  // Anonymous badge
  if (report.is_anonymous) {
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(114, 62, 40, 8, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('ANONYMOUS', 134, 67.5, { align: 'center' });
  }

  // ==================== REPORT DETAILS TABLE ====================
  const detailsData: [string, string][] = [
    ['Crime Type', report.crime_type],
    ['Location', report.location],
  ];

  if (report.latitude && report.longitude) {
    detailsData.push([
      'GPS Coordinates',
      `${Number(report.latitude).toFixed(6)}, ${Number(
        report.longitude
      ).toFixed(6)}`,
    ]);
  }

  detailsData.push([
    'Submitted At',
    new Date(report.createdAt).toLocaleString(),
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['Field', 'Value']],
    body: detailsData,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  // ==================== DESCRIPTION ====================
  const yAfterTable = (doc as any).lastAutoTable.finalY + 10;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 14, yAfterTable);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const descriptionLines = doc.splitTextToSize(
    report.description,
    pageWidth - 28
  );
  doc.text(descriptionLines, 14, yAfterTable + 7);

  // ==================== REPORTER INFO ====================
  const reporterY = yAfterTable + 7 + descriptionLines.length * 5 + 10;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporter Information', 14, reporterY);

  if (report.is_anonymous || !report.reporter) {
    doc.setFillColor(254, 243, 199); // light yellow
    doc.roundedRect(14, reporterY + 4, pageWidth - 28, 14, 3, 3, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'This report was submitted anonymously. No reporter information available.',
      18,
      reporterY + 13
    );
  } else {
    autoTable(doc, {
      startY: reporterY + 4,
      head: [['Name', 'Email', 'Phone']],
      body: [
        [
          report.reporter.full_name,
          report.reporter.email,
          report.reporter.phone || '—',
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });
  }

  // ==================== OFFICER NOTES AREA ====================
  const notesY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 15
    : reporterY + 25;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Officer Notes', 14, notesY);

  doc.setDrawColor(220, 220, 220);
  doc.setLineDashPattern([2, 2], 0);
  for (let i = 0; i < 5; i++) {
    doc.line(14, notesY + 8 + i * 8, pageWidth - 14, notesY + 8 + i * 8);
  }
  doc.setLineDashPattern([], 0);

  // ==================== FOOTER ====================
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 285, pageWidth, 12, 'F');

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'CMS Ethiopia · Confidential Police Document',
      14,
      291
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      291,
      { align: 'right' }
    );
  }

  // ==================== SAVE ====================
  const filename = `report-${refNumber}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}