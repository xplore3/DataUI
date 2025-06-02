import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.less';

interface UserInfo {
  avatar: string;
  nickname: string;
  gender: 'Male' | 'Female' | 'Unknown';
  city: string;
}

const mockUser: UserInfo = {
  avatar: 'https://data3.site/logo.png',
  nickname: 'John',
  gender: 'Male',
  city: 'Beijing',
};

const mockAgentProfile = '我是您的数据助手，可以帮你用多种方式获取数据，使用多种方式加工数据';
const mockModelList = ['GPT-3.1', 'GPT-4o', 'DeepSeek'];
const mockCurrentModel = 'GPT-3.1';

const UserCenter = () => {

  const user: UserInfo = mockUser;
  const agentProfile = mockAgentProfile;
  const modelList = mockModelList;
  const currentModel = mockCurrentModel;

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(agentProfile);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const onModelChange = (model: string) => {
    //
    console.log(`Model changed to: ${model}`);
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
    setIsLogin(true);
  };

  return (
    {!isLogin ? (
      <div className="user-center">
        <p>使用微信扫一扫，授权登录页面实现与微信Bot的互通使用</p>
        <button className="user-center-logout" onClick={onLogin}>
          授权登录
        </button>
      </div>
    ) : ({/* User Center UI */}
    <div className="user-center">
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
      <div className="user-center-section user-center-links">
        <button className="user-center-link" onClick={onAbout}>关于</button>
        <button className="user-center-link" onClick={onHelp}>帮助与说明</button>
      </div>
      <button className="user-center-logout" onClick={onLogout}>
        退出登录
      </button>
    </div>
    )}
  );
};

export default UserCenter;