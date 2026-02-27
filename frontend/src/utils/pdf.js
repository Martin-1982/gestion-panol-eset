import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// createPdfFromRows: compatibilidad con componentes de informes
export async function createPdfFromRows(title = '', columns = [], rows = []) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;

  // header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  if (title) {
    try { doc.text(title, margin, 40); } catch (e) {}
  }

  // build table
  const head = [columns.map(c => c.header || c.key || '')];
  const body = (rows || []).map(r => columns.map(c => {
    const v = r[c.key];
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? '✅' : '-';
    return String(v);
  }));

  try {
    autoTable(doc, {
      startY: 60,
      margin: { left: margin, right: margin },
      head: head,
      body: body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [225, 225, 225], textColor: 0 },
      theme: 'grid',
      tableWidth: 'auto'
    });
  } catch (e) {
    // si falla autoTable, devolver doc vacio
  }

  return doc;
}


/**
 * generateQrDataUrl(text)
 * Helper para generar un dataUrl PNG de un QR usando api.qrserver.com (sin dependencia local).
 */
export async function generateQrDataUrl(text, options = { margin: 1, width: 200 }) {
  if (!text) return null;
  try {
    const size = (options.width || 200);
    const encoded = encodeURIComponent(String(text));
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Error generating QR via remote service', e);
    return null;
  }
}

// fetch any image (logo) and return dataURL or null
export async function generateImageDataUrl(url) {
  if (!url) return null;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}


/**
 * createRemitoPdf(remitoOrArray, opts)
 * remitoOrArray: either a single remito object or an array [leftRemito, rightRemito]
 * Each remito: { tipo: 'entrega'|'archivo', title, numero, fecha (dd/mm/yyyy), destino, responsables[], items[], qrUrl, qrDataUrl, logoDataUrl }
 */
export async function createRemitoPdf(remitoOrArray = {}, opts = {}) {
  // opts:
  //  - singlePage: true -> generar UN remito en A4 portrait (uso para preview/envío)
  //  - orientation: override orientation string for jsPDF
  const singlePage = !!opts.singlePage;
  const orientation = opts.orientation || (singlePage ? 'portrait' : 'landscape');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const halfW = pageW / 2;
  // columnWidth es el ancho útil para cada remito: si singlePage usamos todo el ancho
  const columnWidth = singlePage ? pageW : halfW;
  const mm2pt = mm => mm * 2.8346456693;
  const perforationMarginMm = (opts.perforationMarginMm || 23); // mm (ajustado a 23mm por solicitud)
  const leftPadding = mm2pt(perforationMarginMm);

  // dotted vertical line in the middle (cut/guillotine) - only for two-up layout
  if (!singlePage) {
    doc.setDrawColor(160);
    doc.setLineWidth(0.6);
    for (let y = 6; y < pageH - 6; y += 6) {
      doc.line(halfW, y, halfW, Math.min(y + 3, pageH - 6));
    }
  }

  async function renderOne(xOffset, remito) {
    remito = remito || {};
    const headerY = 18;
    // reducir margen izquierdo del contenido interno del remito en 3mm
    const contentLeftPad = Math.max(6, leftPadding - mm2pt(3));

  // draw vertical line marking perforation margin at left edge
  doc.setDrawColor(180);
  doc.setLineWidth(0.8);
  // mover también la línea de perforación junto con el contenido (3mm a la izquierda)
  const perforationX = xOffset + contentLeftPad - mm2pt(1.5);
  doc.line(perforationX, 6, perforationX, pageH - 6);

  // Logo left
  // aumentar el ancho máximo permitido para que el logo pueda mostrarse más grande
  // reducir el tamaño máximo del logo a 200pt y calcular la altura proporcional
  const logoMaxW = Math.max(leftPadding - 12, 200);
  // mantener una proporción agradable basada en el ancho
  const logoMaxH = Math.round(logoMaxW * 0.346);
  let logoData = remito.logoDataUrl || null;
  // variables para calcular el borde derecho del logo y centrar el QR
  let _logoX = null;
  let _logoW = 0;
    if (!logoData) {
      // intentar cargar desde paths públicos comunes
      const candidates = [
        '/remito_Panol_izquierdo.png',
        '/remito_Panol.png',
        '/logoRemito.png',
        '/logo-principal.png',
        './logoRemito.png',
        'logoRemito.png',
        '/static/media/logoRemito.png',
        '/static/media/remito_Panol_izquierdo.png'
      ];
      for (const p of candidates) {
        // intentamos fetch y convertimos a dataURL
        // no interrumpimos si falla
        // eslint-disable-next-line no-await-in-loop
        const d = await generateImageDataUrl(p);
        if (d) { logoData = d; break; }
      }
      if (!logoData) {
        // ayuda al debug en el cliente: imprime las rutas probadas
        try { console.warn('createRemitoPdf: no se encontró logo en las rutas probadas', candidates); } catch (e) {}
      }
    }
    
    
    if (logoData) {
      try {
        // detect MIME-based format (PNG / JPEG) from dataURL to pass correct format to jsPDF
        let format = 'PNG';
        try {
          const mime = String(logoData).split(';')[0].split(':')[1] || '';
          if (mime.toLowerCase().includes('jpeg') || mime.toLowerCase().includes('jpg')) format = 'JPEG';
          else if (mime.toLowerCase().includes('png')) format = 'PNG';
        } catch (e) {
          // fallback to PNG
        }
        try { console.info('createRemitoPdf: dibujando logo (format=' + format + ')'); } catch (e) {}

        // try to preserve aspect ratio: load into an Image to get natural size
        // start with the maximum allowed width/height; we'll compute a ratio
        // based on the image's natural size so the final dimensions respect
        // the `logoMaxW` and `logoMaxH` constraints.
  let logoW = logoMaxW;
  let logoH = logoMaxH;
        try {
          // eslint-disable-next-line no-await-in-loop
          const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = logoData;
          });
          const iw = img.width || img.naturalWidth || logoW;
          const ih = img.height || img.naturalHeight || logoH;
          // Preferir una altura fija (logoMaxH) para que ambos logos (izq/der)
          // se vean consistentes. Calculamos el ancho proporcional y si
          // excede logoMaxW lo recortamos.
          logoH = logoMaxH;
          logoW = Math.round(iw * (logoH / ih));
          if (logoW > logoMaxW) {
            logoW = logoMaxW;
            logoH = Math.round(ih * (logoW / iw));
          }
          try { console.info && console.info('createRemitoPdf: logo metrics', { tipo: remito.tipo, iw, ih, logoW, logoH, logoMaxW, logoMaxH }); } catch (e) {}
        } catch (e) {
          // if image load fails, fallback to default sizes
          logoW = logoMaxW;
          logoH = logoMaxH;
        }

        // place the logo inside the remito area (move 20pt a la izquierda según solicitud)
  let logoX = xOffset + contentLeftPad + 8 - 20; // mover 20pt a la izquierda
        // no permitir que el logo sobresalga la línea de perforación
        try {
          const minLogoX = perforationX + 6;
          if (logoX < minLogoX) logoX = minLogoX;
        } catch (e) {
          // si perforationX no existe por alguna razón, no hacemos clamp
        }
        doc.addImage(logoData, format, logoX, headerY - 4, logoW, logoH);
        // almacenar valores para uso al centrar el QR más adelante
        _logoX = logoX;
        _logoW = logoW;
        // header text position will use xOffset + leftPadding + 8 + logoW + 8 when drawing
      } catch (e) {
        try { console.error('createRemitoPdf: error al añadir logo con jsPDF:', e); } catch (err) {}
  try { doc.addImage(logoData, 'PNG', xOffset + contentLeftPad + 8, headerY - 4, Math.min(logoMaxW, 120), logoMaxH); } catch (e2) { /* ignore */ }
      }
    }
    // Si no se pasó un bloque ya compuesto, dibujamos a la derecha del logo
    // el texto institucional (nombre del pañol / facultad). Solo lo hacemos
    // cuando NO existe una imagen de logo (logoData == null) o cuando el
    // remito explícitamente pasa `remito.headerLines` y no hay imagen.
  if (!logoData) {
      try {
        const headerText = remito.headerLines || [
          'UNER',
          'Facultad de Ciencias',
          'de la Alimentación'
        ];
        // calculamos posición a la derecha del logo (espacio reservado)
  const logoW = Math.min(logoMaxW, 120);
  const textX = xOffset + contentLeftPad + 8 + logoW + 8;
        // línea base para las 3 líneas
        const line1Y = headerY + 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(headerText[0] || '', textX, line1Y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(headerText[1] || '', textX, line1Y + 14);
        doc.setFontSize(12);
        doc.text(headerText[2] || '', textX, line1Y + 28);
      } catch (e) { /* ignore */ }
    }

  // QR: dibujado posteriormente junto a las casillas de fecha para evitar solapamientos

  // Title block (se dibujará más abajo, centrado respecto del bloque FECHA / numeración)
  const titleLines = ['REMITO', 'DE', 'SALIDA'];
  const nro = remito.numero ? `N° ${remito.numero}` : '';

  // date boxes al lado derecho, alineados con el bloque
  const dateY = headerY + 54;
    const boxW = 16;
    const gap = 6;
    const totalDateW = 3 * boxW + 2 * gap;
    // anclar las casillas de fecha al rightLimit para evitar dependencias circulares
    const pageEdgePad = 8; // en puntos; ajustable según impresora
  // usar columnWidth para soportar singlePage (full width) o two-up (half width)
  const rightLimit = xOffset + columnWidth - pageEdgePad;
    // ancho util dentro del remito (desde contentLeftPad hasta rightLimit)
    const contentWidth = rightLimit - (xOffset + contentLeftPad);
    const dateXStart = rightLimit - totalDateW - 12;
    // fecha esperada en formato DD/MM/YYYY o variantes; mostrar año en dos dígitos (década)
    let dateParts = ['', '', ''];
    if (remito && remito.fecha) {
      const raw = String(remito.fecha).trim();
      // Extraer grupos de dígitos (p. ej. ['2025','11','12'] o ['12','11','2025'] o ['12','11','25'])
      const groups = raw.match(/\d{1,4}/g);
      if (groups && groups.length >= 3) {
        // si el primer grupo tiene 4 dígitos, asumimos YYYY-MM-DD o YYYY/MM/DD
        if (groups[0].length === 4) {
          const yyyy = groups[0];
          const mm = groups[1].padStart(2, '0');
          const dd = groups[2].padStart(2, '0');
          dateParts = [dd, mm, String(yyyy).slice(-2)];
        } else {
          // asumimos DD/MM/YYYY o DD-MM-YYYY o DD/MM/YY
          const dd = groups[0].padStart(2, '0');
          const mm = groups[1].padStart(2, '0');
          const yy = groups[2].slice(-2);
          dateParts = [dd, mm, yy];
        }
      } else {
        // si es timestamp numérico (ms), intentar parsear
        const numeric = raw.replace(/[^0-9]/g, '');
        if (numeric.length >= 9 && numeric.length <= 13) {
          // milisegundos o segundos
          let ts = Number(numeric);
          if (numeric.length === 10) ts = ts * 1000; // segundos -> ms
          const dt = new Date(ts);
          if (!isNaN(dt)) {
            dateParts = [String(dt.getDate()).padStart(2, '0'), String(dt.getMonth() + 1).padStart(2, '0'), String(dt.getFullYear()).slice(-2)];
          }
        }
        }
        // Validación: si el mes no está entre 1..12 intentamos permutar grupos para encontrar una combinación válida
        try {
          const tryFix = (parts, groupsArr) => {
            const asNum = parts.map(p => parseInt(String(p).replace(/[^0-9]/g, ''), 10));
            const d = asNum[0], m = asNum[1];
            if (!Number.isNaN(m) && m >= 1 && m <= 12 && !Number.isNaN(d) && d >= 1 && d <= 31) return parts;
            if (!groupsArr || groupsArr.length < 3) return null;
            // probar permutaciones de índices (0,1,2)
            const idxs = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
            for (const ids of idxs) {
              const p0 = String(groupsArr[ids[0]]).padStart(2, '0');
              const p1 = String(groupsArr[ids[1]]).padStart(2, '0');
              const p2 = String(groupsArr[ids[2]]).slice(-2);
              const nm = parseInt(p1, 10);
              const nd = parseInt(p0, 10);
              if (!Number.isNaN(nm) && nm >= 1 && nm <= 12 && !Number.isNaN(nd) && nd >= 1 && nd <= 31) {
                return [p0, p1, p2];
              }
            }
            return null;
          };
          const fixed = tryFix(dateParts, groups);
          if (fixed) dateParts = fixed;
        } catch (e) { /* ignore validation errors */ }
      }
    // Si no pudimos obtener partes de la fecha, antes de usar fallback loguear para diagnóstico
    if (remito && remito.fecha && !dateParts[0] && !dateParts[1] && !dateParts[2]) {
      try {
        // Warning temporal: incluirá el valor crudo para ayudar a diagnosticar formatos inesperados
        // eslint-disable-next-line no-console
        console.warn('createRemitoPdf: fecha no parseable para remito', remito.numero || '(sin-numero)', 'raw:', String(remito.fecha));
      } catch (e) { /* ignore */ }
    }
    // Log intermedio para diagnóstico: mostrar lo que se obtuvo del parseo
    try {
      // eslint-disable-next-line no-console
      console.info('createRemitoPdf: remito.fecha', remito.numero || '(sin-numero)', 'raw:', remito && remito.fecha, 'parsedParts:', dateParts);
    } catch (e) {}
    // Si no pudimos obtener partes de la fecha, usar fecha actual como fallback
    if (!dateParts[0] && !dateParts[1] && !dateParts[2]) {
      try {
        const now = new Date();
        dateParts[0] = String(now.getDate()).padStart(2, '0');
        dateParts[1] = String(now.getMonth() + 1).padStart(2, '0');
        dateParts[2] = String(now.getFullYear()).slice(-2);
      } catch (e) {
        dateParts = ['01', '01', '00'];
      }
    }
    // recuadro gris con texto FECHA al costado (izquierda) de las casillas
    // precompute para permitir centrar el título respecto de este bloque
    const labelW = 36;
    const labelX = dateXStart - labelW - 6;
    try {
      doc.setDrawColor(200);
      doc.setFillColor(230);
      doc.rect(labelX, dateY - 6, labelW, boxW, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(60);
      // centrar texto vertical y horizontal
      doc.text('FECHA', labelX + labelW / 2, dateY - 6 + boxW / 2 + 3, { align: 'center' });
      doc.setTextColor(0);
    } catch (e) { /* ignore */ }
    for (let i = 0; i < 3; i++) {
      const bx = dateXStart + i * (boxW + gap);
      doc.rect(bx, dateY - 6, boxW, boxW);
      doc.setFontSize(8);
      const txt = dateParts[i] || '';
      doc.text(txt, bx + boxW / 2, dateY - 6 + boxW / 2 + 3, { align: 'center' });
    }

  // Dibujar el QR al costado de las casillas de fecha (evitar solapamiento con título y número)
    try {
      const qrSize = mm2pt(18);
      const boxPad = 6;
    // colocar el QR centrado en el área disponible ENTRE el borde DERECHO del logo
      // y las casillas de fecha. Esto evita que el QR quede pegado al logo o a las casillas.
      const qrY = headerY - 4 + mm2pt(1); // bajar el bloque QR 1mm
      // límites del área disponible para el QR
      // el left disponible será el borde derecho del logo + padding si tenemos logo
      const safeLeft = (typeof _logoX === 'number' && _logoX !== null) ? (_logoX + _logoW + 6) : (xOffset + contentLeftPad + 4);
      const availableLeft = Math.max(xOffset + contentLeftPad + 4, safeLeft);
      const availableRight = dateXStart - 8 - boxPad; // dejar un pequeño padding antes de las casillas
      // centrar el QR dentro del ancho disponible
    let qrX = availableLeft + Math.max(0, (availableRight - availableLeft - qrSize) / 2);
      // si se solicita un desplazamiento adicional para correo, aplicarlo
      try {
        if (opts && typeof opts.emailQrOffsetMm === 'number' && opts.emailQrOffsetMm !== 0) {
          qrX += mm2pt(Number(opts.emailQrOffsetMm));
        }
      } catch (e) { /* ignore */ }
  // seguridad: clamp para no salirse del área disponible
  if (qrX < availableLeft) qrX = availableLeft;
  if (qrX + qrSize > availableRight) qrX = Math.max(availableLeft, availableRight - qrSize);
      // dibujar recuadro y QR (si existe)
      doc.setDrawColor(200);
      doc.setFillColor(255);
      doc.rect(qrX - boxPad, qrY - boxPad, qrSize + boxPad * 2, qrSize + boxPad * 2);
      if (remito.qrDataUrl) {
        try {
          let qformat = 'PNG';
          try { const qm = String(remito.qrDataUrl).split(';')[0].split(':')[1] || ''; if (qm.toLowerCase().includes('jpeg')) qformat = 'JPEG'; } catch (e) {}
          doc.addImage(remito.qrDataUrl, qformat, qrX, qrY, qrSize, qrSize);
        } catch (e) { try { console.error('createRemitoPdf: error al añadir QR con jsPDF:', e); } catch (err) {} }
      } else if (remito.qrUrl) {
        doc.setDrawColor(200);
        doc.rect(qrX, qrY, qrSize, qrSize);
      }
      // etiquetas debajo del QR
  const qrXcenter = qrX + qrSize / 2;
  // colocar 'Documento' y 'para' justo POR DEBAJO del cuadro que rodea el QR
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const labelStartY = qrY + qrSize + boxPad + 6;
  doc.text('Documento', qrXcenter, labelStartY, { align: 'center' });
  doc.text('para', qrXcenter, labelStartY + 8, { align: 'center' });
  // una línea en blanco y luego la etiqueta principal (ARCHIVAR/ENTREGAR)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  // subir ARCHIVAR/ENTREGAR una línea para quedar más cerca de 'Documento / para'
  doc.text(remito.tipo === 'archivo' ? 'ARCHIVAR' : 'ENTREGAR', qrXcenter, labelStartY + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
    } catch (e) { /* ignore QR drawing errors */ }

    // Dibujar título centrado respecto del bloque FECHA / numeración
    try {
      // título compuesto en 3 líneas: REMITO / DE / SALIDA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      // Querés el título en el margen superior: lo colocamos cerca de headerY
      const lineGap = 14; // espacio entre líneas del título
      const lines = titleLines.filter(Boolean);
      // situar el título en el margen superior (por encima del bloque FECHA)
      const titleTopY = headerY + 8; // ligeramente bajo el header, en el margen superior
      // Alineamos el título al margen superior derecho del remito
      // mover 3mm a la izquierda y 1mm hacia arriba según petición
  const titleRightX = rightLimit - 6 - mm2pt(3);
      const titleStartY = titleTopY - mm2pt(1);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i] || '', titleRightX, titleStartY + i * lineGap, { align: 'right' });
      }
      // número a la derecha: lo colocamos justo por encima de las casillas de FECHA
      if (nro) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
  const nroY = dateY - 10; // situar el N° arriba de las casillas (10pt por encima)
  // mover N° 3mm a la izquierda
  doc.text(nro, rightLimit - 6 - mm2pt(3), nroY, { align: 'right' });
      }
    } catch (e) { /* ignore title drawing errors */ }

  // Destino y Responsables - en negrita, tamaño ligeramente mayor, con separadores
  // mantener el margen superior original (no tocar)
  const fieldY = dateY + 28;
  // reservar una pequeña banda de seguridad en el borde derecho para evitar recortes
  // pageEdgePad, rightLimit y contentWidth están definidos arriba para permitir
  // centrar el título y anclar las casillas de fecha; aquí solo usamos innerPad
  const innerPad = 12; // padding interno usado en rectángulos
  // línea superior separadora: bajamos la línea para evitar que se solape
  // con las etiquetas del bloque QR (ARCHIVAR / ENTREGAR)
  doc.setDrawColor(0);
  doc.setLineWidth(1.2);
  // aumentar separación entre encabezado y bloque Destino/Responsables
  const topSeparatorY = fieldY + mm2pt(6); // aproximadamente +6mm hacia abajo
  doc.line(xOffset + contentLeftPad, topSeparatorY, rightLimit, topSeparatorY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  // dibujamos Label en negrita y valor en normal
  const destinoLabel = 'Destino: ';
  const respLabel = 'Responsables: ';
  // calcular un offset común para que los valores queden alineados
  const destinoLabelW = doc.getTextWidth(destinoLabel);
  const respLabelW = doc.getTextWidth(respLabel);
  const labelColWidth = Math.max(destinoLabelW, respLabelW);
  // reducir el espacio entre la etiqueta y el valor para acercar el texto al label
  const valueX = xOffset + contentLeftPad + labelColWidth + 4;

  // colocar destino y responsables DENTRO del bloque delimitado por las dos líneas
  const destinoY = topSeparatorY + 12;
  doc.setFont('helvetica', 'bold');
  doc.text(destinoLabel, xOffset + contentLeftPad, destinoY);
  doc.setFont('helvetica', 'normal');
  // dibujar el valor de Destino inmediatamente después de su etiqueta
  const destinoValueX = xOffset + contentLeftPad + destinoLabelW + 4; // pequeño gap
  doc.text(remito.destino || '', destinoValueX, destinoY);

  doc.setFont('helvetica', 'bold');
  const respY = destinoY + 18;
  doc.text(respLabel, xOffset + contentLeftPad, respY);
  doc.setFont('helvetica', 'normal');
  doc.text(Array.isArray(remito.responsables) ? remito.responsables.join(' ; ') : (remito.responsable || ''), valueX, respY);
  // (la línea inferior separadora se dibuja más abajo, después de colocar el texto informativo)

  // Informational paragraph: colocarlo ENTRE las dos líneas que delimitan
  // el bloque "Destino / Responsables". Reservamos espacio suficiente
  // debajo de 'Responsables' para evitar solapamientos.
  const infoY = respY + 18;
    const infoText = remito.infoText || 'Los agentes mencionados se hacen responsables del uso, administración y cuidado de las herramientas o los materiales y elementos de consumo / uso solicitados.';
    doc.setFontSize(9);
  const infoBoxWidth = contentWidth;
    // función auxiliar para dibujar texto justificado
    const drawJustified = (text, x, y, maxWidth, lineHeight) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      let curY = y;
      for (let li = 0; li < lines.length; li++) {
        const line = String(lines[li] || '').trim();
        // última línea no se justifica (alineamos a la izquierda)
        if (li === lines.length - 1) {
          doc.text(line, x, curY);
        } else {
          const words = line.split(/\s+/).filter(Boolean);
          if (words.length <= 1) {
            doc.text(line, x, curY);
          } else {
            // ancho total de palabras (sin espacios)
            let wordsW = 0;
            for (const w of words) wordsW += doc.getTextWidth(w);
            const extraTotal = Math.max(0, maxWidth - wordsW);
            const gap = extraTotal / (words.length - 1);
            let px = x;
            for (let wi = 0; wi < words.length; wi++) {
              const w = words[wi];
              doc.text(w, px, curY);
              px += doc.getTextWidth(w) + gap;
            }
          }
        }
        curY += lineHeight;
      }
      return lines.length;
    };
    // dibujar el párrafo justo debajo de "Responsables" (justificado)
  const infoLineH = 11; // altura de línea usada para el párrafo
  const infoLines = drawJustified(infoText, xOffset + contentLeftPad, infoY, infoBoxWidth, infoLineH);

  // ahora dibujamos la línea inferior separadora del bloque Destino/Responsables
  // usamos la cantidad de líneas que dibujamos para calcular altura
  const _fallbackInfoLines = doc.splitTextToSize(infoText, infoBoxWidth);
  // aumentar el padding inferior para separar mejor del bloque de la tabla
  const bottomSepY = infoY + (typeof infoLines === 'number' ? infoLines * infoLineH : _fallbackInfoLines.length * 9) + 18; // espacio extra para que no quede pegado
  // línea inferior también en negro y más gruesa
  doc.setDrawColor(0);
  doc.setLineWidth(1.2);
  doc.line(xOffset + contentLeftPad, bottomSepY, rightLimit, bottomSepY);

    // Table header (usamos autoTable para asegurar alineación de texto con las líneas)
  const tableY = bottomSepY + 8;
    // curY usado tanto en el camino "autoTable" como en el fallback manual;
    // lo inicializamos aquí para que exista en ambos casos y evitar no-undef.
    let curY = tableY;
    const colCantW = mm2pt(16); // columna cantidad un poco más angosta
  const tableMarginLeft = xOffset + contentLeftPad;
    // ocupar TODO el ancho disponible del remito (desde leftPadding hasta rightLimit)
    const tableWidth = contentWidth;
    try {
      // Asegurar que haya filas vacías suficientes para completar manualmente (al menos 12)
      const itemsForTable = (remito.items && remito.items.length) ? remito.items : Array.from({ length: 12 }).map(() => ({ cantidad: '', nombre: '' }));
      autoTable(doc, {
        startY: tableY,
  margin: { left: tableMarginLeft, right: pageEdgePad },
        head: [[ 'CANT.', 'PRODUCTOS / DESCRIPCIÓN / DETALLE' ]],
        body: itemsForTable.map(it => [ String(it.cantidad || ''), String(it.nombre || '') ]),
        styles: { fontSize: 9, cellPadding: 6, lineColor: [0,0,0], lineWidth: 0.3 },
        headStyles: { fillColor: [230,226,220], textColor: 0 },
        columnStyles: {
          0: { cellWidth: colCantW, halign: 'center' },
          1: { cellWidth: tableWidth - colCantW }
        },
        theme: 'grid',
        tableWidth: tableWidth
      });
    } catch (e) {
      // fallback: dibujar líneas manuales si autoTable falla
      const rowH = 14; // reducido para permitir entre 12 y 15 filas
      const rows = remito.items && remito.items.length ? remito.items : [];
      const maxRows = Math.max(12, rows.length);
      curY = tableY + rowH;
      doc.setLineWidth(0.3);
  for (let r = 0; r < maxRows; r++) {
  // trazar línea hasta el ancho de la tabla calculada
  doc.line(xOffset + contentLeftPad, curY, xOffset + contentLeftPad + tableWidth, curY);
        if (rows[r]) {
          // columna cantidad centrada
          doc.text(String(rows[r].cantidad || ''), xOffset + contentLeftPad + colCantW / 2, curY - rowH / 2 + 5, { align: 'center' });
          doc.text(String(rows[r].nombre || ''), xOffset + contentLeftPad + colCantW + 6, curY - rowH / 2 + 5);
        }
        curY += rowH;
      }
      // dibujar línea vertical separadora entre columnas
      const dividerX = xOffset + contentLeftPad + colCantW + 2;
      doc.setDrawColor(160);
      doc.setLineWidth(0.6);
      doc.line(dividerX, tableY, dividerX, curY - rowH);
    }

    // Si autoTable se ejecutó correctamente, `doc.lastAutoTable` contiene
    // la posición final (finalY). Aseguramos un valor de `curY` coherente
    // para los elementos que siguen (observación, firmas, etc.).
    if ((doc && doc.lastAutoTable && doc.lastAutoTable.finalY) && doc.lastAutoTable.finalY > curY) {
      curY = doc.lastAutoTable.finalY + 8;
    } else if (curY === tableY) {
      // si nada cambió, avanzar la posición por defecto (12 filas)
      curY = tableY + (18 * Math.max(12, (remito.items && remito.items.length) || 0));
    }

  // Observacion box y signature box: preferimos pegarlos al margen inferior
  // Definimos dimensiones deseadas y colocamos en el margen inferior si hay espacio
  const desiredSigH = 70;
  const desiredObsH = 50;
  const bottomMargin = 18;
  const desiredSigY = pageH - bottomMargin - desiredSigH;
  const desiredObsY = desiredSigY - desiredObsH - 6; // 6pt gap

  let obsFinalY = curY + 8;
  let sigY = desiredSigY;
  // si hay espacio suficiente (la tabla no llega hasta ahí), anclamos abajo
  if (desiredObsY > curY + 8) {
    obsFinalY = desiredObsY;
  } else {
    // fallback: mantener colocación basada en contenido (usar curY como referencia)
    // antes se refería a `obsY` (no definida) — usar curY + 8 para situar la caja de observación
  obsFinalY = curY + 8;
  // reducir espacio entre observación y firma en fallback
  sigY = obsFinalY + desiredObsH + 12;
  }

  // dibujar observación pegada arriba del recuadro de firma
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  // calculamos la posición del rectángulo y evitamos solapamiento con la firma
  let obsRectY = obsFinalY + 4; // inicio habitual (menos gap)
  const obsRectH = desiredObsH;
  // si el rectángulo quedaría solapado con el recuadro de firma, lo subimos
  if (obsRectY + obsRectH + 6 > sigY) {
    // subir lo justo, con un gap reducido
    obsRectY = Math.max(curY + 8, sigY - obsRectH - 6);
  }
  // dibujar rectángulo primero
  doc.setFont('helvetica', 'normal');
  // usar contentWidth menos un padding interior para no tocar el borde
  doc.rect(xOffset + contentLeftPad, obsRectY, Math.max(40, contentWidth - innerPad), obsRectH);
  // etiqueta 'Observación:' en negrita INSIDE el rectángulo, con padding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const obsLabelX = xOffset + contentLeftPad + 6;
  const obsLabelY = obsRectY + 12;
  doc.text('Observación:', obsLabelX, obsLabelY);

  // signature box unificado (en el margen inferior)
  const sigH = desiredSigH;
  const sigX = xOffset + contentLeftPad;
  const sigWTotal = Math.max(80, contentWidth - innerPad);
  // cuadro unico que ocupa todo el ancho del remito, pegado al margen inferior
  doc.rect(sigX, sigY, sigWTotal, sigH);
  doc.setFontSize(10);
  // mostrar las etiquetas alineadas a la izquierda y en negrita
  const primaryLabel = remito.tipo === 'entrega' ? 'Entregado por:' : 'Recibido por:';
  doc.setFont('helvetica', 'bold');
  doc.text(primaryLabel, sigX + 6, sigY + 14);
  doc.text('Fecha:', sigX + 6, sigY + 32);
  // línea de firma centrada horizontalmente, ubicada en la parte inferior del recuadro
  // acercar la línea de firma al borde inferior del recuadro (menos distancia)
  const signLineY = sigY + sigH - 18;
  const signLineX1 = sigX + sigWTotal * 0.25;
  const signLineX2 = sigX + sigWTotal * 0.75;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(signLineX1, signLineY, signLineX2, signLineY);
  // etiqueta 'Firma' centrada debajo de la línea
  doc.setFont('helvetica', 'normal');
  doc.text('Firma', sigX + sigWTotal / 2, signLineY + 10, { align: 'center' });

  }

  let leftRemito = null;
  let rightRemito = null;
  if (Array.isArray(remitoOrArray)) {
    leftRemito = remitoOrArray[0] || {};
    rightRemito = remitoOrArray[1] || {};
  } else {
    leftRemito = remitoOrArray;
    rightRemito = remitoOrArray;
  }

  // renderizar la(s) vista(s). Si singlePage=true renderizamos una sola vez en portrait/full-width
  await renderOne(0, leftRemito);
  if (!singlePage) {
    // desplazar todo el remito derecho 3mm a la izquierda para evitar cortes en impresoras
    await renderOne(columnWidth - mm2pt(3), rightRemito);
  }

  return doc;
}


