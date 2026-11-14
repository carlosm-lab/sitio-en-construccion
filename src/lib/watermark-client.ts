function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function computeSimplifiedAspectRatio(width: number, height: number): string {
  if (!width || !height) return '1:1';

  const ratio = width / height;
  const standardRatios: Array<{ label: string; value: number }> = [
    { label: '1:1', value: 1 },
    { label: '4:5', value: 4 / 5 },
    { label: '5:4', value: 5 / 4 },
    { label: '3:4', value: 3 / 4 },
    { label: '4:3', value: 4 / 3 },
    { label: '2:3', value: 2 / 3 },
    { label: '3:2', value: 3 / 2 },
    { label: '9:16', value: 9 / 16 },
    { label: '16:9', value: 16 / 9 },
    { label: '21:9', value: 21 / 9 },
  ];

  for (const item of standardRatios) {
    if (Math.abs(ratio - item.value) < 0.025) {
      return item.label;
    }
  }

  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

/**
 * Genera automáticamente en el navegador una versión comprimida con marca de agua
 * ("ArteDigital.click - Vista Previa") y devuelve también las dimensiones reales
 * y la relación de aspecto real de la imagen master.
 */
export async function generateWatermarkedImageFile(
  originalFile: File
): Promise<{
  previewFile: File;
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        const aspectRatio = computeSimplifiedAspectRatio(naturalWidth, naturalHeight);

        const maxWidth = 900;
        const scale = naturalWidth > maxWidth ? maxWidth / naturalWidth : 1;
        const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
        const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el lienzo de marca de agua.'));
          return;
        }

        // Dibujar imagen escalada
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Retícula diagonal sutil
        ctx.save();
        ctx.translate(targetWidth / 2, targetHeight / 2);
        ctx.rotate((-28 * Math.PI) / 180);
        const fontSize = Math.max(18, Math.round(targetWidth / 26));
        ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = -targetHeight; y <= targetHeight; y += fontSize * 5) {
          for (let x = -targetWidth; x <= targetWidth; x += fontSize * 14) {
            ctx.fillStyle = 'rgba(22, 50, 79, 0.25)';
            ctx.fillText('ArteDigital.click - Vista Previa', x + 1, y + 1);
            ctx.fillStyle = 'rgba(234, 244, 251, 0.55)';
            ctx.fillText('ArteDigital.click - Vista Previa', x, y);
          }
        }
        ctx.restore();

        // Banda central semitransparente
        const badgeW = Math.min(targetWidth * 0.72, 420);
        const badgeH = 40;
        ctx.fillStyle = 'rgba(22, 50, 79, 0.55)';
        ctx.fillRect(
          (targetWidth - badgeW) / 2,
          (targetHeight - badgeH) / 2,
          badgeW,
          badgeH
        );
        ctx.fillStyle = '#EAF4FB';
        ctx.font = '700 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          'ARTEDIGITAL.CLICK - VISTA PREVIA',
          targetWidth / 2,
          targetHeight / 2
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo exportar la imagen con marca de agua.'));
              return;
            }
            const cleanBase = originalFile.name.replace(/\.[^.]+$/, '');
            const previewFile = new File([blob], `${cleanBase}-preview.jpg`, {
              type: 'image/jpeg',
            });
            resolve({
              previewFile,
              dataUrl,
              width: naturalWidth,
              height: naturalHeight,
              aspectRatio,
            });
          },
          'image/jpeg',
          0.75
        );
      };
      img.onerror = () => reject(new Error('Archivo de imagen inválido.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(originalFile);
  });
}

/**
 * Detecta el número real de páginas en un archivo PDF directamente en el navegador.
 */
export async function detectPdfPageCount(file: File): Promise<number | null> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Verificar cabecera %PDF-
    if (
      bytes.length < 5 ||
      bytes[0] !== 0x25 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x44 ||
      bytes[3] !== 0x46
    ) {
      return null;
    }
    const text = new TextDecoder('latin1').decode(bytes);
    const matches = text.match(/\/Type\s*\/Page\b/g);
    if (matches && matches.length > 0) {
      return matches.length;
    }
    return null;
  } catch {
    return null;
  }
}
