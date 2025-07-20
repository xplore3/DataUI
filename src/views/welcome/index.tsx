import './index.less';
import { useNavigate } from 'react-router-dom';
import Logo from '@/assets/icons/logo.png';
import Send from '@/assets/icons/send.svg';
import SendActive from '@/assets/icons/send-active.svg';
import LoadingImg from '@/assets/icons/loading.svg';
import { useState, useCallback, useRef } from 'react';
import { ReactSVG } from 'react-svg';
import { chatApi } from '@/services/chat';
import { toast } from 'react-toastify';

const Welcome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 数据类别选项
  const categoryOptions = ['社媒', '电商', '生活', '问答', '金融', '游戏', '健康', '制造', '广告', '科学'];

  // 平台选项
  const platformOptions = ['微信公众号', '抖音', '微博', '小红书', '快手', 'Tiktok', 'X', '亚马逊', '淘宝', '京东', '美团'];

  // 时效选项
  const timeframeOptions = ['24小时内', '3天内', '一周内', '一月内', '三个月内', '半年内'];

  // 处理输入变化
  const onInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '18px';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // 处理数据类别选择
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => (prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]));
  };

  // 处理平台选择
  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms(prev => (prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]));
  };

  // 处理时效选择
  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  // 提交处理
  const onSubmit = useCallback(async () => {
    if (!text.trim() || loading) return;

    // if (!selectedCategories.length || !selectedPlatforms.length || !selectedTimeframe) {
    //   toast.error('请选择数据类别、平台和时效');
    //   return;
    // }

    setLoading(true);
    toast('正在处理您的数据请求，请稍候...');

    try {
      // 构造提交文本
      // const submitText = `请帮我找一下【${selectedPlatforms.join(
      //   '、'
      // )}】上【${selectedTimeframe}】关于【${text.trim()}】的内容，数据类别包括【${selectedCategories.join('、')}】`;
      const submitText = text.trim();

      await chatApi.dataHub(submitText);

      // 跳转到Chat页面，并传递查询参数
      // const searchParams = new URLSearchParams({
      //   message: submitText,
      // });
      localStorage.setItem('welcomeMessage', submitText);
      navigate(`/chat`);
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [text, selectedCategories, selectedPlatforms, selectedTimeframe, loading, navigate]);

  // 监听Enter键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Enter键提交
        e.preventDefault();
        onSubmit();
      }
      // Shift+Enter允许换行，不需要额外处理
    },
    [onSubmit]
  );

  return (
    <div className="welcome-page">
      {/* Header */}
      <header className="welcome-page-header">
        <img src={Logo} alt="Logo" />
        <h1>IP罗盘</h1>
        <p className="welcome-description">
          基于自然语言驱动的数据洞察与内容执行助手
          <br />
          请输入您的数据需求，我将为您提供精准的数据分析和内容策略
        </p>
      </header>

      {/* Main Content */}
      <div className="welcome-page-content">
        {/* Chat Input */}
        <div className="welcome-input-section">
          <div className="welcome-input">
            <textarea
              ref={textareaRef}
              placeholder="请输入你的数据处理指令"
              value={text}
              onInput={onInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            {loading ? (
              <ReactSVG src={LoadingImg} className="welcome-loading" />
            ) : (
              <img src={text ? SendActive : Send} alt="Send" onClick={onSubmit} className="send-button" />
            )}
          </div>
        </div>

        {/* Selection Options */}
        <div className="welcome-options">
          {/* 数据类别 */}
          <div className="option-group">
            <label className="option-label">数据类别</label>
            <div className="option-checkboxes">
              {categoryOptions.map(category => (
                <label key={category} className="checkbox-item">
                  <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => handleCategoryChange(category)} />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 平台 */}
          <div className="option-group">
            <label className="option-label">平台</label>
            <div className="option-checkboxes">
              {platformOptions.map(platform => (
                <label key={platform} className="checkbox-item">
                  <input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={() => handlePlatformChange(platform)} />
                  <span>{platform}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 时效 */}
          <div className="option-group">
            <label className="option-label">时效</label>
            <div className="option-radios">
              {timeframeOptions.map(timeframe => (
                <label key={timeframe} className="radio-item">
                  <input
                    type="radio"
                    name="timeframe"
                    value={timeframe}
                    checked={selectedTimeframe === timeframe}
                    onChange={() => handleTimeframeChange(timeframe)}
                  />
                  <span>{timeframe}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
