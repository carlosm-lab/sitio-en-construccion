/**
 * Genera automáticamente en el navegador una versión comprimida con marca de agua
 * ("ArteDigital.click - Vista Previa") a partir de la fotografía original en alta resolución.
 */
export async function generateWatermarkedImageFile(
  originalFile: File
): Promise<{ previewFile: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 900;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);

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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
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
            resolve({ previewFile, dataUrl });
          },
          'image/jpeg',
          0.72
        );
      };
      img.onerror = () => reject(new Error('Archivo de imagen inválido.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(originalFile);
  });
}
