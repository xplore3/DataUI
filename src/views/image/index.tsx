import React, { useEffect, useState, FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Select, Button } from 'antd';
import { Cron } from 'croner';
import { ImageApi } from '@/services/image';
import LocalUpload from '@/components/LocalUpload';

const ImagePage = () =>{
  const [inputText, setInputText] = useState(`把图片中的宠物提取出来，保持其基本特征不变；
    同时把宠物的独特特征（如毛色、花纹、耳朵形状、眼睛颜色、两只脚有不同毛色等）进行强化；
    生成一个3D卡通风格图，高辨识度；融合迪士尼萌宠可爱元素；
    头正向直面镜头；后腿并拢，坐立姿势；保持宠物的毛流感；纯白色背景。
    ......
    【指令2】根据图片中宠物形象，为其生成一个动作：从左向站立到左向行走（抬头、低头、摇晃尾巴、...），
    背景为透明色，动作前后都有0.5秒的姿势静止时间。
    ......
    【指令3】根据图片中宠物的两个图片，为其生成一个从第一个图片的姿势变化为第二个图片的姿势的动作，
    注意是宠物本身的运动动作，而不是简单的图片画面变化；
    背景为透明色，动作前后都有0.5秒的姿势静止时间。`);
  const [submittedText, setSubmittedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [taskId, setTaskId] = useState('');
  const [model, setModel] = useState('bailian');

  const modelOptions = [
    { value: 'bailian', label: 'Bailian' },
    { value: 'volce', label: '即梦' },
  ];

  // Image preview
  useEffect(() => {
    if (files.length > 0) {
      const fileUrl = URL.createObjectURL(files[0]);
      setSubmittedText(fileUrl);
    }
  }, [files]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSelectChange = (value: any) => {
    console.log(value);
    setModel(value);
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
      console.log('Submitting:', { model });
      const fileUrl = URL.createObjectURL(files[0]);
      setSubmittedText(fileUrl);
      let response = null;
      if (images === 1) {
        response = await ImageApi.imageEdit(inputText, [files[0]], model);
      } else if (images === 2) {
        response = await ImageApi.imageToVideo(inputText, files, model);
        setTaskId(response);
      } else if (images === 3) {
        response = await ImageApi.imageToAnimate(inputText, files, model);
        setTaskId(response);
      }
      console.log(taskId);
      setSubmittedText(response.data || response);
      setLoading(false);
      toast('提交成功');
      return response;
    }
    catch (error) {
      setLoading(false);
      console.error('提交失败:', error);
      setSubmittedText('提交失败，请稍后再试');
      toast('提交失败');
      alert('提交失败，请稍后再试');
      return;
    }
  };

  const handleVideo = async () => {
    const _task = await handleGenerate(2);
    await readTaskStatus(_task);
  };

  const handleAnimate = async () => {
    const _task = await handleGenerate(3);
    await readTaskStatus(_task);
  };

  /*const handleVideoRead = async () => {
    console.log("handleVideoRead", taskId);
    if (taskId === '') {
      return '';
    }
    setLoading(true);
    try {
      let response = await ImageApi.readVideo(taskId, model);
      setSubmittedText(response);
      console.log(response);
      if (response && response != 'Error' && response.length === 35) {
        setTaskId(response);
      }
      setLoading(false);
      //toast('获取成功');
      return response;
    }
    catch (error) {
      setLoading(false);
      toast('提交失败');
      //alert('提交失败，请稍后再试');
      return '';
    }
  };*/

  const readTaskStatus = async (_task: string) => {
    try {
      setLoading(true);
      let jobSkip = false;
      let count = 0;
      const job = new Cron('*/10 * * * * *', async () => {
        if (jobSkip || count++ > 30) {
          job.stop();
          setLoading(false);
          return;
        }
        try {
          console.log("Job ", _task);
          console.log("Model ", model);
          let response = await ImageApi.readVideo(_task, model);
          setSubmittedText(response);
          console.log(response);
          if (response && response != 'Error' && response.length === 35) {
            setTaskId(response);
          }
          if (response && response.length > 60) {
            jobSkip = true;
            job.stop();
            setLoading(false);
          }
        } catch (err) {
          console.log(err);
          setLoading(false);
        }
      });
    } catch (err) {
      console.log(err);
      setLoading(false);
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

      <form onSubmit={handleSubmit} style={{ marginBottom: '15px' }}>
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
            请输入图片/动作生成的指令：
          </label>
          <textarea
            id="multiline-input"
            value={inputText}
            onChange={handleInputChange}
            rows={6}
            style={{ 
              width: '100%', 
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            placeholder={`图片/动作描述指令
              ......`}
          />
        </div>
        <div>
          <label htmlFor="model" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            模型 *
          </label>
          <Select
            id="model"
            style={{ width: '100%' }}
            value={model}
            onChange={(value) => handleSelectChange(value)}
            placeholder="请选择模型"
            allowClear
          >
            {modelOptions.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
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
            onClick={handleVideo}
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
            onClick={handleAnimate}
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
            {loading ? "处理中..." : "生成模仿动作"}
          </Button>

          {/*<Button 
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
          </Button>*/}
        </div>
      </form>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#333', marginBottom: '5px' }}>生成结果：</h3>
        <video style={{height: '180px'}} src={submittedText} poster={submittedText} autoPlay controls></video>
        <h3 style={{ color: '#333', marginBottom: '5px' }}>下载链接：</h3>
        <textarea
          readOnly
          value={submittedText}
          rows={5}
          style={{ 
            width: '100%', 
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9',
            boxSizing: 'border-box'
          }}
          placeholder="生成结果的链接显示在这里..."
        />
      </div>
    </div>
  );
}

export default ImagePage;