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
      const canvas = await html2canvas(hiddenDiv, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm'
      });
      pdf.setFont('helvetica', 'normal');

      // PDF页面尺寸（A4）
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 图片尺寸（保持比例）
      const imgRatio = canvas.width / canvas.height;
      let imgWidth = pageWidth - 20; // 左右留白10mm
      let imgHeight = imgWidth / imgRatio;

      // 多页处理
      let position = 0;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        // 添加新页（第一页除外）
        if (position > 0) {
          pdf.addPage();
        }

        // 当前页可显示的高度
        const viewportHeight = Math.min(remainingHeight, pageHeight - 20);

        pdf.addImage(
          imgData,
          'PNG',
          10, // x坐标（左留白）
          position > 0 ? 10 : position + 10, // y坐标
          imgWidth,
          viewportHeight,
          undefined,
          'FAST' // 渲染模式
        );

        remainingHeight -= viewportHeight;
        position += viewportHeight;
      }

      pdf.save('My-IP-Report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(hiddenDiv);
    }
  };

  return { downloadPDF };
};
