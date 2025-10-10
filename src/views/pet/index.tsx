import React, { useState } from 'react';
import './index.less';

const PetCreator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const [generatedActions, setGeneratedActions] = useState([]);

  // 模拟已生成的动作
  const mockActions = [
    { id: 1, name: '跳跃', preview: 'jump.gif' },
    { id: 2, name: '睡觉', preview: 'sleep.gif' },
    { id: 3, name: '玩耍', preview: 'play.gif' },
    { id: 4, name: '吃饭', preview: 'eat.gif' },
  ];

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = () => {
    setIsGenerating(true);
    // 模拟生成过程
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentStep(4);
    }, 3000);
  };

  const handleGenerateActions = () => {
    setIsGeneratingActions(true);
    // 模拟生成过程
    setTimeout(() => {
      setIsGeneratingActions(false);
      setGeneratedActions(mockActions);
      setCurrentStep(5);
    }, 1000);
  };

  const handleRegenerateAction = (actionId) => {
    // 重新生成特定动作的逻辑
    console.log(`重新生成动作 ${actionId}`);
  };

  return (
    <div className="pet-creator">
      <div className="container">
        <h1>桌面萌宠制作器</h1>
        
        {/* 步骤指示器 */}
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <p>选择风格</p>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>上传图片</p>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <p>生成形象</p>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <span>4</span>
            <p>生成动作</p>
          </div>
          <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
            <span>5</span>
            <p>完成</p>
          </div>
        </div>

        {/* 步骤一：选择风格 */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>步骤一：选择桌宠风格</h2>
            <div className="style-selection">
              <div 
                className={`style-option ${selectedStyle === 'pixel' ? 'selected' : ''}`}
                onClick={() => handleStyleSelect('pixel')}
              >
                <div className="style-preview pixel-preview"></div>
                <h3>像素风</h3>
                <p>效果预览</p>
              </div>
              <div 
                className={`style-option ${selectedStyle === 'disney' ? 'selected' : ''}`}
                onClick={() => handleStyleSelect('disney')}
              >
                <div className="style-preview disney-preview"></div>
                <h3>迪士尼风</h3>
                <p>效果预览</p>
              </div>
            </div>
            <div className="action-buttons">
              <button 
                className="btn primary" 
                disabled={!selectedStyle}
                onClick={() => setCurrentStep(2)}
              >
                制作{selectedStyle === 'pixel' ? '像素风' : '迪士尼风'}
              </button>
            </div>
          </div>
        )}

        {/* 步骤二：上传图片 */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>步骤二：上传图片</h2>
            <p className="instruction">
              请上传毛孩子的侧面站立照/正面俯拍照，保持光线充足，纯色背景最佳。
            </p>
            <div className="upload-area">
              <input 
                type="file" 
                id="pet-image" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="pet-image" className="upload-btn">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="上传的宠物图片" className="uploaded-image" />
                ) : (
                  <div className="upload-placeholder">
                    <span>+</span>
                    <p>上传图片</p>
                  </div>
                )}
              </label>
            </div>
            <div className="action-buttons">
              <button className="btn secondary" onClick={() => setCurrentStep(1)}>
                上一步
              </button>
              <button 
                className="btn primary" 
                disabled={!uploadedImage}
                onClick={() => setCurrentStep(3)}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* 步骤三：生成形象 */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>步骤三：生成桌宠形象照</h2>
            <div className="generating-container">
              <div className="loading-spinner"></div>
              <p>稍等30s，毛孩子的{selectedStyle === 'pixel' ? '像素风' : '迪士尼风'}的可爱形象正在加急制作中...</p>
              <div className="progress-bar">
                <div className="progress"></div>
              </div>
            </div>
            <div className="action-buttons">
              <button className="btn secondary" onClick={() => setCurrentStep(2)}>
                上一步
              </button>
              <button className="btn primary" onClick={handleGenerateImage}>
                生成形象
              </button>
            </div>
          </div>
        )}

        {/* 步骤四：生成动作 */}
        {currentStep === 4 && (
          <div className="step-content">
            <h2>步骤四：生成专属动作</h2>
            <p className="instruction">
              接下来就开始进行专属的动作生成啦！此步骤预计在30min左右，点击下方生成按钮后即可退出页面，一段时间后记得过来哦~
            </p>
            <div className="action-buttons">
              <button className="btn secondary" onClick={() => setCurrentStep(3)}>
                上一步
              </button>
              <button 
                className={`btn primary ${isGeneratingActions ? 'loading' : ''}`}
                onClick={handleGenerateActions}
                disabled={isGeneratingActions}
              >
                {isGeneratingActions ? '正在生成...' : '生成专属的萌宠动作'}
              </button>
            </div>
          </div>
        )}

        {/* 步骤五：完成 */}
        {currentStep === 5 && (
          <div className="step-content">
            <h2>你的专属桌面萌宠已经制作完成啦！快来看看呀啊~</h2>
            
            <div className="gif-preview">
              {/* 这里可以放置生成的GIF预览 */}
              <div className="gif-placeholder">
                <p>GIF预览区域</p>
              </div>
            </div>
            
            <div className="actions-grid">
              {generatedActions.map(action => (
                <div key={action.id} className="action-item">
                  <div className="action-preview">
                    {/* 这里可以放置动作预览图 */}
                    <div className="action-placeholder">
                      {action.name}
                    </div>
                  </div>
                  <div className="action-info">
                    <p className="action-name">{action.name}</p>
                    <button 
                      className="btn small"
                      onClick={() => handleRegenerateAction(action.id)}
                    >
                      重新生成
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="action-buttons">
              <button className="btn primary" onClick={() => setCurrentStep(1)}>
                制作新的桌宠
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetCreator;
