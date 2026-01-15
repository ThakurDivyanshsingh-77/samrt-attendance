
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { parse } = require('json2csv');

exports.exportToCSV = async (data, fields) => {
  try {
    const csv = parse(data, { fields });
    return csv;
  } catch (error) {
    throw new Error('Error generating CSV: ' + error.message);
  }
};

exports.exportToExcel = async (data, filename) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // Add headers
    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key.toUpperCase(),
        key: key,
        width: 20
      }));

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      // Add data
      data.forEach(row => {
        worksheet.addRow(row);
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw new Error('Error generating Excel: ' + error.message);
  }
};

exports.exportToPDF = async (data, title) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add title
      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown();

      // Add date
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, {
        align: 'right'
      });
      doc.moveDown();

      if (data.length > 0) {
        // Add table headers
        const headers = Object.keys(data[0]);
        const colWidth = 500 / headers.length;

        doc.fontSize(12).font('Helvetica-Bold');
        let x = 50;
        headers.forEach(header => {
          doc.text(header.toUpperCase(), x, doc.y, {
            width: colWidth,
            continued: header !== headers[headers.length - 1]
          });
          x += colWidth;
        });

        doc.moveDown();
        doc.font('Helvetica').fontSize(10);

        // Add data rows
        data.forEach(row => {
          x = 50;
          headers.forEach(header => {
            const value = row[header]?.toString() || '';
            doc.text(value, x, doc.y, {
              width: colWidth,
              continued: header !== headers[headers.length - 1]
            });
            x += colWidth;
          });
          doc.moveDown(0.5);
        });
      } else {
        doc.text('No data available');
      }

      doc.end();
    } catch (error) {
      reject(new Error('Error generating PDF: ' + error.message));
    }
  });
};