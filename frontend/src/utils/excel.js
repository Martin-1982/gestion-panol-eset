import * as XLSX from 'xlsx';

// Crear un workbook con fila de título, fila de fecha, fila en blanco, encabezados y filas de datos.
export function createWorkbookFromRows(title = 'Informe', columns = [], rows = []) {
  const wsData = [];
  // Líneas de cabecera para emular el encabezado del PDF
  wsData.push(['PAÑOL']);
  wsData.push(['Escuela Secundaria Técnica']);
  wsData.push([]);

  const titleText = title.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
  wsData.push([titleText]);
  wsData.push([`Generado: ${new Date().toLocaleString()}`]);
  wsData.push([]);

  // encabezados (en mayúsculas para mayor visibilidad)
  wsData.push(columns.map(c => (c.header || '').toString().toUpperCase()));

  // cuerpo
  rows.forEach(r => {
    wsData.push(columns.map(c => (r[c.key] !== undefined ? r[c.key] : '')));
  });

  // fila de pie con contacto
  wsData.push([]);
  wsData.push(["Pañol - ESET - FCAL - UNER.", '', '', '', '']);
  wsData.push(["email: panol.eset.fcal@uner.edu.ar"]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // definir anchos de columna aproximados
  const colWidths = columns.map(c => ({ wch: Math.max(10, Math.min(30, (c.header || '').length + 8)) }));
  ws['!cols'] = [{ wch: 30 }, ...colWidths];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Informe');

  // escribir a arraybuffer
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return buffer;
}
