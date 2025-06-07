import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.less';
import Profile from '@/assets/icons/profile.svg';
import QuestionForm from '@/components/Question';
import { useUserStore } from '@/stores/useUserStore';
import { chatApi } from '@/services/chat';

interface UserInfo {
  avatar: string;
  nickname: string;
  gender: 'Male' | 'Female' | 'Unknown';
  city: string;
}

const mockUser: UserInfo = {
  avatar: 'https://data3.site/icon128.png',
  nickname: 'John',
  gender: 'Male',
  city: 'Beijing',
};

const mockAgentProfile = '我是您的数据助手，可以帮你用多种方式获取数据，使用多种方式加工数据;\r\n'
   + '\r\n--------------------\r\n在这里输入有用的信息，能让Agent更好的帮助你';
const mockModelList = ['GPT-3.1', 'GPT-4o', 'DeepSeek'];
const mockCurrentModel = 'GPT-3.1';

const UserCenter = () => {

  const user: UserInfo = mockUser;
  const agentProfile = mockAgentProfile;
  const modelList = mockModelList;

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(agentProfile);
  const [isLogin, setIsLogin] = useState(true);
  const [currentModel, setCurrentModel] = useState(mockCurrentModel);
  const questions = [
    { id: 'template', question: '请选择您的业务领域', type: 'single', options: ['食品饮料', '美容美妆', '健康养生'] },
    { id: 'product', question: '请输入产品名称/产品链接/产品官网', type: 'text' },
    { id: 'platform', question: '请选择平台', type: 'multiple', options: ['小红书', '抖音'] }
  ];

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleQuestionSend = async (answers: Record<string, string | string[]>, index: number) => {
    try {
      if (loading) return;
      setLoading(true);
      const userId = useUserStore.getState().getUserId() || 'user';
      const result: string[] = Object.entries(answers).map(([key, value]) => {
        const answer = Array.isArray(value) ? value.join(", ") : value;
        return `Question: ${key}, Answer: ${answer}`;
      });
      chatApi.addKnowledges(userId, result).then(res => {
        console.log(res);
      })
      .finally(() => {
        setLoading(false);
      });
    }
    catch (error) {
      console.error('Error sending question:', error);
      setLoading(false);
    }
  };


  const onModelChange = (model: string) => {
    //
    console.log(`Model changed to: ${model}`);
    setCurrentModel(model);
  };

  const onProfileChange = (profile: string) => {
    //
    console.log(`Profile updated: ${profile}`);
    setProfile(profile);
    setEditing(false);
  };

  const onAbout = () => {
    navigate('/about');
  };

  const onHelp = () => {
    navigate('/help');
  };

  const onLogout = () => {
    setIsLogin(false);
  };

  const onLogin = () => {
    console.log('User settings clicked');
    const corpId = import.meta.env.VITE_WECHAT_CORP_ID;
    const agentId = import.meta.env.VITE_WECOM_AGENT_ID;
    const host = import.meta.env.VITE_API_HOST_URL;
    const authCallback = import.meta.env.VITE_WECOM_AUTH_CALLBACK;
    const redirectUri = encodeURIComponent(host + authCallback);
    const state = 'RandomCSRF';

    setIsLogin(true);
    //const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${corpId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
    const authUrl = `https://login.work.weixin.qq.com/wwlogin/sso/login?login_type=CorpApp&appid=${corpId}&agentid=${agentId}&redirect_uri=${redirectUri}&state=${state}`;
    window.location.href = authUrl;
  };

  return (
    <div className="user-center">
      {isLogin ? (<>
      <div className="user-center-header">
        <img className="user-center-avatar" src={user.avatar} alt="avatar" />
        <div className="user-center-info">
          <div className="user-center-nickname">{user.nickname}</div>
          <div className="user-center-detail">
            <span>{user.gender}</span>
            <span>{user.city}</span>
          </div>
        </div>
      </div>
      <div className="user-center-section">
        <div className="user-center-section-title">Agent设置</div>
        {editing ? (
          <textarea
            className="user-center-profile-edit"
            value={profile}
            onChange={e => setProfile(e.target.value)}
          />
        ) : (
          <div className="user-center-profile">{profile}</div>
        )}
        <button
          className="user-center-btn"
          onClick={() => {
            if (editing) onProfileChange(profile);
            setEditing(!editing);
          }}
        >
          {editing ? '保存' : '编辑'}
        </button>
      </div>
      <div className="user-center-section">
        <div className="user-center-section-title">大模型选择</div>
        <select
          className="user-center-select"
          value={currentModel}
          onChange={e => onModelChange(e.target.value)}
        >
          {modelList.map(model => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
      <QuestionForm questions={questions} hasSubmit={false} onSubmit={handleQuestionSend}></QuestionForm>
      <div className="user-center-section user-center-links" style={{ marginTop: '20px' }}>
        <button className="user-center-link" onClick={onAbout}>关于</button>
        <button className="user-center-link" onClick={onHelp}>帮助与说明</button>
      </div>
      <button className="user-center-logout" onClick={onLogout}>
        退出登录
      </button>
      </>) : (<div className="user-center-login">
        <img src={Profile} alt="profile" />
        <p>使用微信扫一扫，授权微信绑定实现与微信Bot的互通使用</p>
        <button className="user-center-login-btn" onClick={onLogin}>
          授权登录
        </button>
      </div>)}
    </div>
  );
};

export default UserCenter;