import React, { useState } from 'react';
import { chatApi } from '@/services/chat';
import './download.less';


const DownloadWithCode: React.FC = () => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const searchParams = new URLSearchParams(window.location.search);
  const taskId = searchParams.get("taskId") || "";
  const type = searchParams.get("file_type") || "data";
  const [currentDownloadUrl, setCurrentDownloadUrl] = useState<string>(`https://data3.site/download?taskId=${taskId}&file_type=${type}`);

  const handleDownload = async (): Promise<void> => {
    if (!accessCode.trim()) {
      setError('请输入提取码');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await chatApi.downloadWithCode(
        accessCode.trim().toUpperCase(),
        taskId, type);
      console.log(response);
      setError(response.text || '下载成功，请查看浏览器下载记录。');
    } catch (err) {
      console.error('下载失败:', err);
      setError('下载失败，请检查提取码或稍后再试。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNewLink = async (): Promise<void> => {
    setError('');
    setIsGeneratingLink(true);

    try {
      const newDownloadUrl = await chatApi.generateNewLink(taskId, type);
      setCurrentDownloadUrl(newDownloadUrl);
      setError('新链接生成成功！');
    } catch (err: unknown) {
      console.error('生成新链接失败:', err);
      const errorMessage = err instanceof Error ? err.message : '生成新链接失败，请稍后再试。';
      setError(errorMessage);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleDownload();
    }
  };

  return (
    <div className="download-container">
      <h2>文件下载</h2>
      <div className="file-url-info">
        <label>文件链接:</label>
        <a href={currentDownloadUrl} className="url-display">{currentDownloadUrl}</a>
      </div>

      <div className="input-group">
        <input
          type="text"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="请输入提取码"
          maxLength={6}
          disabled={isLoading}
        />
        <button 
          onClick={handleDownload}
          disabled={isLoading || !accessCode.trim()}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? (
            <>
              <span className="spinner" /> 下载中...
            </>
          ) : (
            '下载文件'
          )}
        </button>
      </div>

      <div className="generate-link-section">
        <button 
          onClick={handleGenerateNewLink}
          disabled={isGeneratingLink}
          className={`generate-link-btn ${isGeneratingLink ? 'loading' : ''}`}
        >
          {isGeneratingLink ? (
            <>
              <span className="spinner" /> 生成中...
            </>
          ) : (
            '生成新链接'
          )}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default DownloadWithCode;