//import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ReactDOM from 'react-dom/client';
//import { renderToString } from 'react-dom/server';

export const useMarkdownToPDF = () => {
  const downloadPDF = async (markdownText: string) => {
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.width = '210mm';
    hiddenDiv.style.padding = '20mm';
    hiddenDiv.style.background = 'white';
    hiddenDiv.style.fontFamily = "'Arial', sans-serif";
    hiddenDiv.style.fontSize = '12pt';
    hiddenDiv.style.lineHeight = '1.6';
    hiddenDiv.style.boxSizing = 'border-box';
    hiddenDiv.style.position = 'fixed';
    hiddenDiv.style.left = '-9999px';
    document.body.appendChild(hiddenDiv);

    const root = ReactDOM.createRoot(hiddenDiv);
    root.render(<ReactMarkdown>{markdownText}</ReactMarkdown>);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const fullCanvas = await html2canvas(hiddenDiv, {
        scale: 1.5, // 降低scale
        useCORS: true
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidthMm = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();
      const marginX = 10;
      const marginY = 10;
      const pxPerMm = fullCanvas.width / pageWidthMm;

      // 每页的像素高度
      const rawPageHeightPx = (pageHeightMm - marginY * 2) * pxPerMm;

      // 计算行高（像素）
      const lineHeightPx = parseInt(window.getComputedStyle(hiddenDiv).lineHeight, 10) || 20;

      let position = 0;
      let pageIndex = 0;

      while (position < fullCanvas.height) {
        // 按整行对齐
        let pageHeightPx = rawPageHeightPx;
        if (position + pageHeightPx < fullCanvas.height) {
          const overflow = pageHeightPx % lineHeightPx;
          if (overflow > 0) {
            pageHeightPx -= overflow; // 向下取整到整行
          }
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = fullCanvas.width;
        pageCanvas.height = Math.min(pageHeightPx, fullCanvas.height - position);

        const ctx = pageCanvas.getContext('2d');
        if (!ctx) throw new Error('无法获取 Canvas context');

        ctx.drawImage(
          fullCanvas,
          0, position, fullCanvas.width, pageCanvas.height,
          0, 0, pageCanvas.width, pageCanvas.height
        );

        // JPEG 压缩（0.8质量）
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.8);

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(
          imgData,
          'JPEG',
          marginX,
          marginY,
          pageWidthMm - marginX * 2,
          (pageCanvas.height / pxPerMm)
        );

        position += pageHeightPx;
        pageIndex++;
      }

      pdf.save('我的IP定位报告.pdf');
    } catch (error) {
      console.error('PDF 生成失败:', error);
    } finally {
      root.unmount();
      document.body.removeChild(hiddenDiv);
    }
  };

  return { downloadPDF };
};
