//import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { renderToString } from 'react-dom/server';

export const useMarkdownToPDF = () => {
  const downloadPDF = async (markdownText: string) => {
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.width = '190mm'; // 匹配A4宽度
    hiddenDiv.style.padding = '25mm 20mm';
    hiddenDiv.style.background = 'white';
    hiddenDiv.style.fontFamily = 'Arial, sans-serif';
    hiddenDiv.style.fontSize = '12pt';
    hiddenDiv.style.lineHeight = '1.6';
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
        allowTaint: true,
        windowHeight: hiddenDiv.scrollHeight + 50,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // PDF页面尺寸 (A4)
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 计算图像尺寸 (保持宽高比)
      const imgWidth = pageWidth - 40; // 左右各10mm边距
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 分页参数
      const marginTop = 25; // 顶部边距
      //const marginBottom = 25; // 底部边距
      //const pageContentHeight = pageHeight - marginTop - marginBottom; // 每页可用高度

      // 分页处理
      let heightLeft = imgHeight;
      let position = 10; // 起始y坐标 (顶部边距)
      let pageNum = 1;

      // 第一页
      pdf.addImage(
        imgData,
        'PNG',
        10, // x坐标
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight - 50; // 减去已使用的页面高度 (保留底部边距)
      //const viewportHeight = Math.min(pageContentHeight, imgHeight - position);

      // 额外页面
      while (heightLeft >= 0) {
        pdf.addPage();
        pageNum++;
        position = marginTop - ((pageNum - 1) * (pageHeight - 50));

        pdf.addImage(
          imgData,
          'PNG',
          10, // x坐标
          position,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
        heightLeft -= pageHeight - 20;
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
