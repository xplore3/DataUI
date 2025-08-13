//import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { renderToString } from 'react-dom/server';

export const useMarkdownToPDF = () => {
  const downloadPDF = async (markdownText: string) => {
    // 创建隐藏容器
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'absolute';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.padding = '20px';
    hiddenDiv.style.width = '800px';
    hiddenDiv.style.background = 'white';
    document.body.appendChild(hiddenDiv);

    // 使用renderToString将ReactMarkdown转为HTML字符串
    const markdownHTML = renderToString(
      <ReactMarkdown>{markdownText}</ReactMarkdown>
    );
    hiddenDiv.innerHTML = markdownHTML;

    try {
      const canvas = await html2canvas(hiddenDiv, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
      });

      const imgWidth = 210; // A4宽度(mm)
      const pageHeight = 295; // A4高度(mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('markdown-export.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(hiddenDiv);
    }
  };

  return { downloadPDF };
};
