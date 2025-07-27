import React from 'react';
import { QRCode } from 'antd';
import { toast } from 'react-toastify';
import './index.less';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  shareUrl?: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ visible, onClose, shareUrl }) => {
  const currentUrl = shareUrl || window.location.href;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast('链接复制成功！');
    } catch (err) {
      // 降级处理
      try {
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast('链接复制成功！');
      } catch (fallbackErr) {
        toast.error('复制失败，请手动复制链接');
        console.error('复制链接失败:', fallbackErr);
      }
    }
  };

  if (!visible) return null;

  return (
    <div className="qrcode-modal-overlay" onClick={onClose}>
      <div className="qrcode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qrcode-modal-header">
          <h3>扫码分享</h3>
          <button className="qrcode-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="qrcode-modal-content">
          <div className="qrcode-container">
            <QRCode
              value={currentUrl}
              size={200}
              style={{ marginBottom: 16 }}
            />
          </div>
          
          <div className="qrcode-info">
            <p className="primary-text">使用微信扫一扫</p>
            <p className="secondary-text">长按可以保存二维码至相册</p>
            
            {/* <div className="url-section">
              <div className="url-display">
                <span className="url-text">{currentUrl.length > 40 ? `${currentUrl.substring(0, 40)}...` : currentUrl}</span>
              </div>
              <button className="copy-url-btn" onClick={handleCopyUrl}>
                复制链接
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal; 