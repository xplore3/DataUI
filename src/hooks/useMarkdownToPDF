// hooks/useMarkdownToPDF.js
import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const useMarkdownToPDF = () => {
  const markdownRef = useRef(null);

  const downloadPDF = async (markdownText) => {
    // 创建一个隐藏的div来渲染Markdown
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'absolute';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.padding = '20px';
    hiddenDiv.style.width = '800px';
    hiddenDiv.style.background = 'white';
    
    document.body.appendChild(hiddenDiv);
    
    // 渲染Markdown
    hiddenDiv.innerHTML = '<div id="markdown-content"></div>';
    const container = hiddenDiv.querySelector('#markdown-content');
    
    // 使用ReactMarkdown渲染内容
    const root = document.createElement('div');
    document.body.appendChild(root);
    
    // 这里使用ReactDOM.render在React 18+中需要使用createRoot
    // 简化版使用innerHTML（注意XSS风险，确保markdownText是可信的）
    container.innerHTML = (
      <ReactMarkdown>{markdownText}</ReactMarkdown>
    ).props.children;
    
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
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('markdown-export.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(hiddenDiv);
      document.body.removeChild(root);
    }
  };

  return { downloadPDF };
};
