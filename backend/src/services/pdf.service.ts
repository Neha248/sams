import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface AttendanceRow {
  date: string;
  subject: string;
  status: string;
  remarks?: string;
}

interface StudentReportData {
  studentName: string;
  rollNumber: string;
  department: string;
  semester: number;
  section: string;
  period: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  records: AttendanceRow[];
}

export const generateStudentPDF = (data: StudentReportData, res: Response): void => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="attendance_${data.rollNumber}.pdf"`);
  doc.pipe(res);

  // Header bar
  doc.rect(0, 0, 595, 80).fill('#0e1322');
  doc.fillColor('#00D4FF').fontSize(22).text('SAMS', 50, 20, { align: 'left' });
  doc.fillColor('#dee1f7').fontSize(11).text('Smart Attendance Management System', 50, 48);
  doc.fillColor('#8896A9').fontSize(9).text('OFFICIAL ATTENDANCE REPORT', 50, 63);

  doc.fillColor('#333').fontSize(10);
  let y = 100;

  // Student Info Box
  doc.rect(50, y, 495, 110).fillAndStroke('#f8fafc', '#e2e8f0');
  doc.fillColor('#0e1322').fontSize(13).font('Helvetica-Bold').text('STUDENT INFORMATION', 65, y + 10);
  doc.font('Helvetica').fontSize(10);

  const infoLeft = [
    ['Student Name', data.studentName],
    ['Roll Number', data.rollNumber],
    ['Department', data.department],
  ];
  const infoRight = [
    ['Semester', `Semester ${data.semester}`],
    ['Section', `Section ${data.section}`],
    ['Report Period', data.period],
  ];

  infoLeft.forEach(([label, value], i) => {
    doc.fillColor('#6b7280').text(label + ':', 65, y + 30 + i * 22);
    doc.fillColor('#111827').text(value, 200, y + 30 + i * 22);
  });
  infoRight.forEach(([label, value], i) => {
    doc.fillColor('#6b7280').text(label + ':', 330, y + 30 + i * 22);
    doc.fillColor('#111827').text(value, 450, y + 30 + i * 22);
  });
  y += 125;

  // Attendance Summary
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0e1322').text('ATTENDANCE SUMMARY', 50, y);
  y += 20;

  const summaryData = [
    { label: 'Total Classes', value: data.totalClasses, color: '#0e1322' },
    { label: 'Present', value: data.present, color: '#059669' },
    { label: 'Absent', value: data.absent, color: '#dc2626' },
    { label: 'Late', value: data.late, color: '#d97706' },
    { label: 'Attendance %', value: `${data.percentage}%`, color: data.percentage >= 75 ? '#059669' : '#dc2626' },
  ];

  const cardW = 90;
  summaryData.forEach((item, i) => {
    const x = 50 + i * 100;
    doc.rect(x, y, cardW, 55).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor(item.color).fontSize(18).font('Helvetica-Bold').text(String(item.value), x, y + 10, { width: cardW, align: 'center' });
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(item.label, x, y + 35, { width: cardW, align: 'center' });
  });
  y += 75;

  // Progress bar
  const barW = 495;
  const fillW = Math.round((data.percentage / 100) * barW);
  doc.rect(50, y, barW, 12).fill('#e5e7eb');
  doc.rect(50, y, fillW, 12).fill(data.percentage >= 75 ? '#00D4FF' : '#FF4B6E');
  doc.fillColor('#374151').fontSize(9).text(`${data.percentage}% Overall Attendance`, 50, y + 16);
  y += 40;

  // Status message
  if (data.percentage >= 75) {
    doc.rect(50, y, 495, 28).fill('#d1fae5');
    doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold').text('✓ Attendance is SATISFACTORY — Above the 75% requirement.', 65, y + 8);
  } else {
    doc.rect(50, y, 495, 28).fill('#fee2e2');
    doc.fillColor('#991b1b').fontSize(10).font('Helvetica-Bold').text(`⚠ Attendance is BELOW 75% — Immediate improvement required.`, 65, y + 8);
  }
  y += 45;

  // Table
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0e1322').text('ATTENDANCE RECORDS', 50, y);
  y += 18;

  // Table header
  doc.rect(50, y, 495, 22).fill('#0e1322');
  doc.fillColor('#00D4FF').fontSize(9).font('Helvetica-Bold');
  const cols = [50, 140, 270, 380, 460];
  const headers = ['Date', 'Subject', 'Status', 'Remarks'];
  headers.forEach((h, i) => doc.text(h, cols[i] + 5, y + 7));
  y += 22;

  // Table rows
  doc.font('Helvetica').fontSize(9);
  data.records.forEach((row, idx) => {
    const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(50, y, 495, 20).fill(rowBg);
    doc.fillColor('#374151').text(row.date, cols[0] + 5, y + 6);
    doc.text(row.subject, cols[1] + 5, y + 6, { width: 120 });
    const statusColor = row.status === 'present' ? '#059669' : row.status === 'absent' ? '#dc2626' : '#d97706';
    doc.fillColor(statusColor).font('Helvetica-Bold').text(row.status.toUpperCase(), cols[2] + 5, y + 6);
    doc.fillColor('#6b7280').font('Helvetica').text(row.remarks || '—', cols[3] + 5, y + 6, { width: 100 });
    y += 20;
    if (y > 750) { doc.addPage(); y = 50; }
  });

  // Footer
  doc.rect(0, 800, 595, 42).fill('#0e1322');
  doc.fillColor('#8896A9').fontSize(8).text(
    `Generated by SAMS • Smart Attendance Management System • ${new Date().toLocaleDateString('en-IN')}`,
    50, 812, { align: 'center', width: 495 }
  );

  doc.end();
};

interface TeacherRow {
  date: string;
  student: string;
  subject: string;
  status: string;
}

interface TeacherReportData {
  teacherName: string;
  period: string;
  rows: TeacherRow[];
}

export const generateTeacherPDF = (data: TeacherReportData, res: Response): void => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="teacher_report.pdf"`);
  doc.pipe(res);

  doc.rect(0, 0, 595, 80).fill('#0e1322');
  doc.fillColor('#00D4FF').fontSize(22).text('SAMS', 50, 20, { align: 'left' });
  doc.fillColor('#dee1f7').fontSize(11).text('Teacher Attendance Report', 50, 48);
  doc.fillColor('#8896A9').fontSize(9).text(`Period: ${data.period}`, 50, 63);

  doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(`Teacher: ${data.teacherName}`, 50, 100);

  let y = 130;
  doc.rect(50, y, 495, 22).fill('#0e1322');
  doc.fillColor('#00D4FF').fontSize(9).font('Helvetica-Bold');
  doc.text('Date', 55, y + 7);
  doc.text('Student', 140, y + 7);
  doc.text('Subject', 310, y + 7);
  doc.text('Status', 470, y + 7);
  y += 22;

  doc.font('Helvetica').fontSize(9);
  data.rows.forEach((r, idx) => {
    const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(50, y, 495, 20).fill(rowBg);
    doc.fillColor('#374151').text(r.date, 55, y + 6);
    doc.text(r.student, 140, y + 6, { width: 160 });
    doc.text(r.subject, 310, y + 6, { width: 150 });
    const statusColor = r.status === 'present' ? '#059669' : r.status === 'absent' ? '#dc2626' : '#d97706';
    doc.fillColor(statusColor).font('Helvetica-Bold').text(r.status.toUpperCase(), 470, y + 6);
    doc.font('Helvetica');
    y += 20;
    if (y > 750) { doc.addPage(); y = 50; }
  });

  doc.end();
};
