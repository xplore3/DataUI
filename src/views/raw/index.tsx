import { RawApi } from '@/services/raw';
import React, { useState } from 'react';

const RawPage = () =>{
  const [inputText, setInputText] = useState('');
  const [submittedText, setSubmittedText] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (!inputText.trim()) {
      alert('请输入内容后再提交');
      return;
    }
    try {
      const response = await RawApi.rawdata(inputText);
      setSubmittedText(response.data);
    }
    catch (error) {
      console.error('提交失败:', error);
      setSubmittedText(error.message || '提交失败，请稍后再试');
      alert('提交失败，请稍后再试');
      return;
    }
    console.log('提交的内容:', inputText);
    // 这里可以添加提交到服务器的逻辑
  };

  const handleClear = () => {
    setInputText('');
    setSubmittedText('');
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ color: '#333' }}>输入数据采集信息</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="multiline-input"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#555'
            }}
          >
            请输入内容：
          </label>
          <textarea
            id="multiline-input"
            value={inputText}
            onChange={handleInputChange}
            rows={8}
            style={{ 
              width: '100%', 
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            placeholder="在这里输入多行..."
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              flex: 1
            }}
            disabled={!inputText.trim()}
          >
            提交
          </button>
          
          <button 
            type="button"
            onClick={handleClear}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              flex: 1
            }}
            disabled={!inputText && !submittedText}
          >
            清空
          </button>
        </div>
      </form>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>提交结果：</h3>
        <textarea
          readOnly
          value={submittedText}
          rows={8}
          style={{ 
            width: '100%', 
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9',
            boxSizing: 'border-box'
          }}
          placeholder="处理结果显示在这里..."
        />
      </div>
    </div>
  );
}

export default RawPage;