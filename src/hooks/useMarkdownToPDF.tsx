//import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { renderToString } from 'react-dom/server';

export const useMarkdownToPDF = () => {
  const downloadPDF = async (markdownText: string) => {
    // 创建隐藏容器并设置打印友好样式
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.width = '190mm'; // A4宽度减去边距
    hiddenDiv.style.padding = '25mm 20mm'; // 上下25mm，左右20mm边距
    hiddenDiv.style.background = 'white';
    hiddenDiv.style.fontFamily = "'Arial', sans-serif";
    hiddenDiv.style.fontSize = '12pt';
    hiddenDiv.style.lineHeight = '1.6';
    hiddenDiv.style.boxSizing = 'border-box';
    document.body.appendChild(hiddenDiv);

    // 渲染Markdown
    const markdownHTML = renderToString(
      <ReactMarkdown>{markdownText}</ReactMarkdown>
    );
    hiddenDiv.innerHTML = markdownHTML;

    try {
      const canvas = await html2canvas(hiddenDiv, {
        scale: 2,
        useCORS: true,
        logging: true,
        windowHeight: hiddenDiv.scrollHeight + 50,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // PDF页面尺寸
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 图像尺寸计算（保持宽高比）
      const imgWidth = pageWidth - 40; // 左右各20mm边距
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 分页参数
      const marginTop = 25; // 顶部边距
      const usablePageHeight = pageHeight - marginTop; // 每页可用高度

      let currentPosition = 0;
      let pageNumber = 1;

      while (currentPosition < imgHeight) {
        if (pageNumber > 1) {
          pdf.addPage();
        }

        // 计算当前页应该显示的内容部分
        const viewportHeight = Math.min(usablePageHeight, imgHeight - currentPosition);
  
        // 关键修正：使用canvas裁剪功能
        pdf.addImage(
          imgData,
          'PNG',
          20, // 左边界20mm
          marginTop, // 固定从顶部边距开始
          imgWidth,
          viewportHeight,
          // 以下参数实现图像裁剪
          undefined, undefined,
          {
            // 源图像裁剪区域
            width: canvas.width,
            height: (viewportHeight * canvas.width) / imgWidth,
            // 源图像起始点
            x: 0,
            y: (currentPosition * canvas.width) / imgWidth
          }
        );

        currentPosition += viewportHeight;
        pageNumber++;
      }

      pdf.save('我的IP定位.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(hiddenDiv);
    }
  };

  return { downloadPDF };
};
