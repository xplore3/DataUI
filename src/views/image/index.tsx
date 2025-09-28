import React, { useState, FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Button } from "antd";
import { ImageApi } from '@/services/image';
import LocalUpload from '@/components/LocalUpload';

const ImagePage = () =>{
  const [inputText, setInputText] = useState(`动作描述指令......`);
  const [submittedText, setSubmittedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [taskId, setTaskId] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleGenerate(1);
  }

  const handleGenerate = async (images: number = 1) => {
    if (!inputText.trim()) {
      alert('请输入指令后再提交');
      return;
    }
    if (loading) {
      toast('正在处理中，请稍候......');
      return;
    }
    toast('正在进行图片/动作生成，请稍候......');
    setLoading(true);
    try {
      if (files.length < 1) {
        alert('请上传至少一张图片');
        setLoading(false);
        return;
      }
      let response = null;
      if (images === 1) {
        response = await ImageApi.imageEdit(inputText, [files[0]]);
      } else if (images === 2) {
        response = await ImageApi.imageToVideo(inputText, files);
      }
      setSubmittedText(response.data || response);
      setTaskId(response);
      setLoading(false);
      toast('生成成功');
    }
    catch (error) {
      setLoading(false);
      console.error('提交失败:', error);
      setSubmittedText('提交失败，请稍后再试');
      toast('提交失败');
      alert('提交失败，请稍后再试');
      return;
    }
    console.log('提交的内容:', inputText);
    // 这里可以添加提交到服务器的逻辑
  };

  const handleImage2 = () => {
    handleGenerate(2);
  };

  const handleVideoRead = async () => {
    if (taskId === '') {
      return;
    }
    setLoading(true);
    try {
      let response = await ImageApi.readVideo(taskId);
      setSubmittedText(response);
      setTaskId(response);
      setLoading(false);
      toast('获取成功');
    }
    catch (error) {
      setLoading(false);
      toast('提交失败');
      alert('提交失败，请稍后再试');
      return;
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/*<h2 style={{ color: '#333' }}>输入图片/动作生成指令</h2>*/}
      
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
            请输入指令：
          </label>
          <textarea
            id="multiline-input"
            value={inputText}
            onChange={handleInputChange}
            rows={4}
            style={{ 
              width: '100%', 
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            placeholder={`图片/动作描述指令
              ......`}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <LocalUpload files={ files } setFiles={ setFiles } />
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
            {loading ? "处理中..." : "图生图"}
          </Button>

          <Button 
            type="default"
            onClick={handleImage2}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              flex: 1
            }}
            disabled={!inputText && !submittedText}
          >
            {loading ? "处理中..." : "图生动作"}
          </Button>

          <Button 
            type="default"
            onClick={handleVideoRead}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              flex: 1
            }}
            disabled={!inputText && !submittedText}
          >
            {loading ? "处理中..." : "动作读取"}
          </Button>
        </div>
      </form>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>生成结果：</h3>
        <video style={{height: '180px'}} src={submittedText} poster={submittedText} controls></video>
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
          placeholder="生成结果显示在这里..."
        />
      </div>
    </div>
  );
}

export default ImagePage;