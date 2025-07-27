import React, { useState } from 'react';
import QRCode from 'qrcode';
import { CodeApi } from '../../services/code';
import './index.less';

const CodeGenPage: React.FC = () => {
  const [inviteCode, setInviteCode] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // 生成二维码
  const generateQRCode = async (text: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('生成二维码失败:', error);
    }
  };

  // 生成邀请码
  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const response = await CodeApi.codeGen();
      const code = response.code || response;
      
      setInviteCode(code);
      await generateQRCode(window.location.origin + '/chat?inviteCode=' + code);
      setCopySuccess(false);
    } catch (error) {
      console.error('生成邀请码失败:', error);
      alert('生成邀请码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制邀请码
  const handleCopyCode = async () => {
    if (!inviteCode) return;
    
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // 兼容旧浏览器的复制方法
      const textArea = document.createElement('textarea');
      textArea.value = inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="code-gen-container">
      <div className="code-gen-card">
        <h1 className="title">生成邀请码</h1>
        
        <div className="generate-section">
          <button 
            className={`generate-btn ${loading ? 'loading' : ''}`}
            onClick={handleGenerateCode}
            disabled={loading}
          >
            {loading ? '生成中...' : inviteCode ? '重新生成' : '生成邀请码'}
          </button>
        </div>

        {inviteCode && (
          <div className="result-section">
            <div className="qr-section">
              <h3>邀请二维码</h3>
              {qrDataUrl && (
                <div className="qr-container">
                  <img src={qrDataUrl} alt="邀请码二维码" className="qr-image" />
                </div>
              )}
            </div>

            <div className="code-section">
              <h3>邀请码</h3>
              <div className="code-display">
                <span className="code-text">{inviteCode}</span>
                <button 
                  className={`copy-btn ${copySuccess ? 'success' : ''}`}
                  onClick={handleCopyCode}
                >
                  {copySuccess ? '已复制!' : '复制'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!inviteCode && (
          <div className="empty-state">
            <p>点击上方按钮生成邀请码和二维码</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeGenPage;
