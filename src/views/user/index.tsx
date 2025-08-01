//import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.less';
import Profile from '@/assets/icons/profile.svg';
import KnowledgeBase from '@/components/KnowledgeBase2';
import ThemeToggle from '@/components/ThemeToggle';
import { useUser } from '@/hooks/useUser';
//import { useUserStore } from '@/stores/useUserStore';


//const defModelList = ['GPT-3.1', 'GPT-4o', 'DeepSeek'];
//const defCurrentModel = 'GPT-3.1';
const defaultAvatar = 'https://test.data3.site/icon128.png';
const defaultNickname = 'IP罗盘';

const UserCenter = () => {
  const isMobile = /iphone|android|ipad|mobile/i.test(navigator.userAgent);

  const navigate = useNavigate();
  const { userInfo, isLogin } = useUser();
  //const modelList = defModelList;
  //const [currentModel, setCurrentModel] = useState(defCurrentModel);

  //const onModelChange = (model: string) => {
    //console.log(`Model changed to: ${model}`);
    //setCurrentModel(model);
  //};


  const onAbout = () => {
    navigate('/about');
  };

  const onHelp = () => {
    navigate('/help');
  };

  const onLogout = () => {
    //console.log('User logged out');
    localStorage.removeItem('userInfo');
    navigate('/chat');
  };

  const onLogin = () => {
    //console.log('User settings clicked');
    if (isMobile) {
      return;
    }
    const corpId = import.meta.env.VITE_WECHAT_CORP_ID;
    //const agentId = import.meta.env.VITE_WECOM_AGENT_ID;
    const host = import.meta.env.VITE_API_HOST_URL;
    const authCallback = import.meta.env.VITE_WECOM_AUTH_CALLBACK_FRONT;
    const redirectUri = encodeURIComponent(host + authCallback);
    const state = 'RandomCSRF' + Date.now();

    //const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${corpId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=${state}&agentid=${agentId}#wechat_redirect`;
    const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${corpId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
    //const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${corpId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
    //const authUrl = `https://login.work.weixin.qq.com/wwlogin/sso/login?login_type=CorpApp&appid=${corpId}&agentid=${agentId}&redirect_uri=${redirectUri}&state=${state}`;
    window.location.href = authUrl;
  };

  return (
    <div className="user-center">
      {(isLogin || isMobile) ? (<>
      <div className="user-center-header">
        <button 
          className="user-center-back-btn"
          onClick={() => navigate('/chat')}
          title="返回对话"
        >
         返回对话
        </button>
        <img className="user-center-avatar" src={userInfo.headimgurl || defaultAvatar} alt="avatar" />
        <div className="user-center-info">
          <div className="user-center-nickname">{userInfo.nickname || defaultNickname}</div>
          {/*<div className="user-center-detail">
            <span>{userInfo.sex == 0 ? 'Male' : 'Female'}</span>
            <span>{userInfo.city}</span>
          </div>*/}
        </div>
      </div>
      {/* Agent设置部分暂时隐藏 */}
      {/* <div className="user-center-section">
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
      </div> */}
      {/* <div className="user-center-section">
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
      </div> */}
      <ThemeToggle />
      <KnowledgeBase />
      <div className="user-center-section user-center-links" style={{ marginTop: '20px' }}>
        <button className="user-center-link" onClick={onAbout}>关于</button>
        <button className="user-center-link" onClick={onHelp}>帮助与说明</button>
      </div>
      {/*<button className="user-center-logout" onClick={onLogout}>
        退出登录
      </button>*/}
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