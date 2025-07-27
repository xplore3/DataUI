import React from 'react';
import { toast } from 'react-toastify';
import './index.less';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  shareUrl?: string;
  onWechatGuide: () => void;
  onQRCode: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose, shareUrl, onWechatGuide, onQRCode }) => {
  const currentUrl = shareUrl || window.location.href;

  const handleWechatShare = () => {
    onClose(); // 关闭当前弹窗
    onWechatGuide(); // 打开微信分享引导
  };

  const handleQRCodeShare = () => {
    onClose(); // 关闭当前弹窗
    onQRCode(); // 打开二维码弹窗
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast('链接复制成功！');
    } catch {
      // 降级处理：使用传统方法复制
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
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>分享</h3>
          <button className="share-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="share-modal-content">
          {/* 微信分享 */}
          <div className="share-option" onClick={handleWechatShare}>
            <div className="share-icon wechat-icon">
              <svg
                t="1753625358752"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="4830"
                width="200"
                height="200"
              >
                <path
                  d="M683.058 364.695c11 0 22 1.016 32.943 1.976C686.564 230.064 538.896 128 370.681 128c-188.104 0.66-342.237 127.793-342.237 289.226 0 93.068 51.379 169.827 136.725 229.256L130.72 748.43l119.796-59.368c42.918 8.395 77.37 16.79 119.742 16.79 11 0 21.46-0.48 31.914-1.442a259.168 259.168 0 0 1-10.455-71.358c0.485-148.002 128.744-268.297 291.403-268.297l-0.06-0.06z m-184.113-91.992c25.99 0 42.913 16.79 42.913 42.575 0 25.188-16.923 42.579-42.913 42.579-25.45 0-51.38-16.85-51.38-42.58 0-25.784 25.93-42.574 51.38-42.574z m-239.544 85.154c-25.384 0-51.374-16.85-51.374-42.58 0-25.784 25.99-42.574 51.374-42.574 25.45 0 42.918 16.79 42.918 42.575 0 25.188-16.924 42.579-42.918 42.579z m736.155 271.655c0-135.647-136.725-246.527-290.983-246.527-162.655 0-290.918 110.88-290.918 246.527 0 136.128 128.263 246.587 290.918 246.587 33.972 0 68.423-8.395 102.818-16.85l93.809 50.973-25.93-84.677c68.907-51.93 120.286-119.815 120.286-196.033z m-385.275-42.58c-16.923 0-34.452-16.79-34.452-34.179 0-16.79 17.529-34.18 34.452-34.18 25.99 0 42.918 16.85 42.918 34.18 0 17.39-16.928 34.18-42.918 34.18z m188.165 0c-16.984 0-33.972-16.79-33.972-34.179 0-16.79 16.927-34.18 33.972-34.18 25.93 0 42.913 16.85 42.913 34.18 0 17.39-16.983 34.18-42.913 34.18z"
                  fill="#09BB07"
                  p-id="4831"
                ></path>
              </svg>
            </div>
            <div className="share-text">
              <div className="share-title">微信分享</div>
              <div className="share-desc">点击右上角菜单分享</div>
            </div>
          </div>

          {/* 二维码分享 */}
          <div className="share-option" onClick={handleQRCodeShare}>
            <div className="share-icon qr-icon">
              <svg
                t="1753625446782"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="9983"
                width="200"
                height="200"
              >
                <path
                  d="M224 416.096V224l192-0.096 0.096 192.096L224 416.096zM416.096 160H223.904A64 64 0 0 0 160 223.904v192.192A64 64 0 0 0 223.904 480h192.192A64 64 0 0 0 480 416.096V223.904A64 64 0 0 0 416.096 160zM224 800.096V608l192-0.096 0.096 192.096L224 800.096zM416.096 544H223.904A64 64 0 0 0 160 607.904v192.192A64 64 0 0 0 223.904 864h192.192A64 64 0 0 0 480 800.096v-192.192A64 64 0 0 0 416.096 544zM608 416.096V224l192-0.096 0.096 192.096-192.096 0.096zM800.096 160h-192.192A64 64 0 0 0 544 223.904v192.192A64 64 0 0 0 607.904 480h192.192A64 64 0 0 0 864 416.096V223.904A64 64 0 0 0 800.096 160zM704 608a32 32 0 0 0-32 32v192a32 32 0 0 0 64 0v-192a32 32 0 0 0-32-32M576 608a32 32 0 0 0-32 32v192a32 32 0 0 0 64 0v-192a32 32 0 0 0-32-32M832 544a32 32 0 0 0-32 32v256a32 32 0 0 0 64 0v-256a32 32 0 0 0-32-32"
                  fill="#3E3A39"
                  p-id="9984"
                ></path>
              </svg>
            </div>
            <div className="share-text">
              <div className="share-title">二维码分享</div>
              <div className="share-desc">点击生成二维码</div>
            </div>
          </div>

          {/* 复制链接 */}
          <div className="share-option" onClick={handleCopyLink}>
            <div className="share-icon copy-icon">
              <svg
                t="1753625634336"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="14267"
                width="200"
                height="200"
              >
                <path
                  d="M458.8 690.6c-8.1 0-16.2-3.1-22.4-9.4-12.4-12.5-12.4-32.8 0-45.3l303.7-306.7c18.4-18.5 28.5-43.2 28.5-69.4s-10.1-50.8-28.5-69.4c-37.9-38.3-99.5-38.3-137.4 0L299 497.2a31.448 31.448 0 0 1-44.8 0c-12.4-12.5-12.4-32.8 0-45.3l303.7-306.7c62.6-63.2 164.5-63.2 227 0 30.3 30.6 47 71.3 47 114.6s-16.7 84-47 114.6L481.3 681.2c-6.2 6.2-14.3 9.4-22.5 9.4z"
                  fill="#231815"
                  p-id="14268"
                ></path>
                <path
                  d="M352.5 927.9c-41.1 0-82.2-15.8-113.5-47.4-30.3-30.6-47-71.3-47-114.6s16.7-84 47-114.6l303.7-306.7c12.4-12.5 32.4-12.5 44.8 0 12.4 12.5 12.4 32.8 0 45.3L283.8 696.5c-18.4 18.5-28.5 43.2-28.5 69.4 0 26.2 10.1 50.8 28.5 69.4 18.9 19.1 43.8 28.7 68.7 28.7 24.9 0 49.8-9.6 68.7-28.7L725 528.6c12.4-12.5 32.4-12.5 44.8 0 12.4 12.5 12.4 32.8 0 45.3L466.1 880.5c-31.3 31.6-72.4 47.4-113.6 47.4z"
                  fill="#231815"
                  p-id="14269"
                ></path>
              </svg>
            </div>
            <div className="share-text">
              <div className="share-title">复制链接</div>
              <div className="share-desc">复制当前页面链接</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
