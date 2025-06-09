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

const defAgentProfile = `你是TrendMuse，全能的【小红书】数据获取/加工专家；运营内容透视、洞察、互动助手。
   根据我的需求，你能从数据源API库中获取任何数据、可以进行数据的筛选、过滤、搜索、导出、下载、维度发现、维度分析、总结、仿写等。
   \r\n--------------------\r\n在这里输入有用的信息，能让Agent更好的帮助你`;
const defModelList = ['GPT-3.1', 'GPT-4o', 'DeepSeek'];
const defCurrentModel = 'GPT-3.1';

const UserCenter = () => {

  const user: UserInfo = mockUser;
  const agentProfile = defAgentProfile;
  const modelList = defModelList;

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(agentProfile);
  const [isLogin, setIsLogin] = useState(true);
  const [currentModel, setCurrentModel] = useState(defCurrentModel);
  const [isFormSubmitted, setIsFormSubmitted] = useState(() => {
    return localStorage.getItem('trendmuse_form_submitted') === 'true';
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const questions = [
    { 
      id: 'brandName', 
      question: '品牌名称', 
      type: 'text' as const
    },
    { 
      id: 'productIntro', 
      question: '产品介绍', 
      type: 'text' as const
    },
    { 
      id: 'productType', 
      question: '产品类型', 
      type: 'multiple' as const, 
      options: ['美妆个护', '时尚穿搭', '生活方式', '食品饮品', '母婴亲子', '数码电子', '服务体验', '知识分享', '其他'] 
    },
    { 
      id: 'userPortrait', 
      question: '我的用户画像', 
      type: 'multiple' as const, 
      options: ['未来之星', '大学生', '城镇青年', '都市打工人', '年轻爸妈', '家庭主妇', '孕期中产女性', '中年男士根据一族', '其他（自填）'] 
    },
    { 
      id: 'targetAgeGroup', 
      question: '目标用户年龄段', 
      type: 'multiple' as const, 
      options: ['20岁以下', '20-25岁', '25-35岁', '35岁+'] 
    },
    { 
      id: 'locationPreference', 
      question: '地域偏好', 
      type: 'multiple' as const, 
      options: ['一线城市', '新一线', '二三线城市', '其他（自填）'] 
    },
    { 
      id: 'interestTags', 
      question: '兴趣标签', 
      type: 'multiple' as const, 
      options: ['时尚生活日志', '娱乐', '美妆', '美食', '家居家装宠物', '教育', '母婴', '二次元', '情感', '体育运动', '科技数码', '医疗健康', '汽车', '健身减肥', '户外旅游', '明星', '其他（自填）'] 
    },
    { 
      id: 'outputPersona', 
      question: '输出人设', 
      type: 'multiple' as const, 
      options: ['真实用户', '测评达人', '姐妹分享', '品牌主理人'] 
    },
    { 
      id: 'contentStyle', 
      question: '内容风格', 
      type: 'multiple' as const, 
      options: ['口语化', '理性种草', '情绪共鸣', '专业解析', '秋人做题'] 
    },
    { 
      id: 'presentationFormat', 
      question: '展示形式', 
      type: 'multiple' as const, 
      options: ['口播解说', '图文干货', '场景展示', '对比合集', '情境输入'] 
    },
    { 
      id: 'currentGoal', 
      question: '现在最想做的是', 
      type: 'multiple' as const, 
      options: ['曝光引流', '内容生产', '带货转化', '建立品牌形象', '投放准备', '其他（自填）'] 
    },
    { 
      id: 'websiteOrPdf', 
      question: '官网/pdf链接（非必填项）', 
      type: 'text' as const
    }
  ];

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleQuestionSend = async (answers: Record<string, string | string[]>) => {
    try {
      if (loading || isFormSubmitted) return;
      setLoading(true);
      const result: string[] = Object.entries(answers).map(([key, value]) => {
        const answer = Array.isArray(value) ? value.join(", ") : value;
        return `Question: ${key}, Answer: ${answer}`;
      });
      chatApi.addKnowledges(result).then(res => {
        console.log(res);
        // 保存成功后设置本地缓存和显示成功消息
        localStorage.setItem('trendmuse_form_submitted', 'true');
        localStorage.setItem('trendmuse_form_answers', JSON.stringify(answers));
        setIsFormSubmitted(true);
        setShowSuccessMessage(true);
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
    try {
      if (loading) return;
      setLoading(true);
      const result: string[] = [`Agent Profile: ${profile}`];
      chatApi.addKnowledges(result).then(res => {
        console.log(res);
      })
      .finally(() => {
        setLoading(false);
      });
    }
    catch (error) {
      console.error('Error sending profile:', error);
      setLoading(false);
    }
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
      {isFormSubmitted ? (
        <div className="user-center-success-message">
          <div className="success-icon">✅</div>
          <div className="success-text">
            TrendMuse 已经了解你是谁、卖什么、想怎么做内容啦～
            <br />
            输入任何要求与问题，一起来生成适合你的选题、达人推荐或者是内容文案吧！
          </div>
          <div style={{ marginTop: '15px' }}>
            {showSuccessMessage && (
              <button 
                className="user-center-btn" 
                onClick={() => setShowSuccessMessage(false)}
                style={{ marginRight: '10px' }}
              >
                知道了
              </button>
            )}
            <button 
              className="user-center-btn" 
              onClick={() => {
                localStorage.removeItem('trendmuse_form_submitted');
                localStorage.removeItem('trendmuse_form_answers');
                setIsFormSubmitted(false);
                setShowSuccessMessage(false);
              }}
              style={{ background: '#ff9800' }}
            >
              重新填写
            </button>
          </div>
        </div>
      ) : (
        <QuestionForm questions={questions} hasSubmit={isFormSubmitted} onSubmit={handleQuestionSend}></QuestionForm>
      )}
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