import { RawApi } from '@/services/raw';
import React, { useState, FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Button } from "antd";

const RawPage = () =>{
  const [inputText, setInputText] = useState(`这是****的接口，
    platform需设为：****;
    接口名称需要设置为：****;
    调用URL为：https://api.****.com/v1/......；
    其doc link是：****；
    其类别为：****；
    其header是： {
      "x-****-key": "......",
    }
    ......`);
  const [submittedText, setSubmittedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim()) {
      alert('请输入内容后再提交');
      return;
    }
    if (loading) {
      toast('正在处理中，请稍候......');
      return;
    }
    toast('正在进行内容处理，请稍候......');
    setLoading(true);
    try {
      const response = await RawApi.rawdata(inputText);
      setSubmittedText(response.data || response);
      setLoading(false);
      toast('数据添加成功');
    }
    catch (error) {
      setLoading(false);
      console.error('提交失败:', error);
      setSubmittedText('提交失败，请稍后再试');
      toast('数据提交失败');
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
            rows={18}
            style={{ 
              width: '100%', 
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            placeholder={`这是****的接口，
              platform需设为：****;
              接口名称需要设置为：****;
              调用URL为：https://api.****.com/v1/......；
              其doc link是：****；
              其类别为：****；
              其header是： {
                "x-****-key": "......",
              }
              ......`}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button 
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              flex: 1
            }}
            disabled={!inputText.trim() || loading}
          >
            {loading ? "处理中..." : "提交"}
          </Button>
          
          <Button 
            type="default"
            onClick={handleClear}
            style={{
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
          </Button>
        </div>
      </form>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>提交结果：</h3>
        <textarea
          readOnly
          value={submittedText}
          rows={5}
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