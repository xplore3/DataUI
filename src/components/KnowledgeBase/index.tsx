import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionForm from '@/components/Question';
import { chatApi } from '@/services/chat';
import { toast } from 'react-toastify';

const KnowledgeBase: React.FC = () => {
  const navigate = useNavigate();
  const [isFormSubmitted, setIsFormSubmitted] = useState(() => {
    return localStorage.getItem('trendmuse_form_submitted') === 'true';
  });
  const [loading, setLoading] = useState(false);
  
  const questions = [
    { 
      id: 'productBrand', 
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
      id: 'userPorfile', 
      question: '我的用户画像', 
      type: 'multiple' as const, 
      options: ['未来之星', '大学生', '城镇青年', '都市打工人', '年轻爸妈', '家庭主妇', '中产女性', '中年男士', '其他（自填）'] 
    },
    { 
      id: 'targetAgeGroup', 
      question: '目标用户年龄段', 
      type: 'multiple' as const, 
      options: ['<18', '18-24', '25-34', '35-44', '>44'] 
    },
    { 
      id: 'locationPreference', 
      question: '地域偏好', 
      type: 'multiple' as const, 
      //options: ['一线城市', '新一线', '二三线城市', '其他（自填）']
      options: ['不限', '北京', '上海', '天津', '重庆', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
        '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南',
        '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '香港', '澳门', '台湾'] 
    },
    { 
      id: 'interestTags', 
      question: '兴趣标签', 
      type: 'multiple' as const, 
      //options: ['时尚生活日志', '娱乐', '美妆', '美食', '家居家装宠物', '教育', '母婴', '二次元', '情感', '体育运动', '科技数码', '医疗健康', '汽车', '健身减肥', '户外旅游', '明星', '其他（自填）']
      options: ['家居家装', '宠物', '知识', '母婴', '摄影', '资讯', '星座命理', '萌娃', '减肥',
        '运动健身', '科技数码', '体育赛事', '商业财经', '出行', '汽车', '搞笑', '美妆', '美食测评',
        '文化', '教育', '兴趣爱好', '生活记录', '社科', '美食教程', '美食', '影视', '娱乐', '游戏',
        '时尚', '健康', '婚嫁', '素材', '美女帅哥', '潮流', '情感']
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
      options: ['口语化', '理性种草', '情绪共鸣', '专业解析'] 
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

  const handleQuestionSend = async (answers: Record<string, string | string[]>) => {
    try {
      if (loading || isFormSubmitted) return;
      if (!('productBrand' in answers) || !('productIntro' in answers)
        || !('productType' in answers)) {
        toast.error('填写的信息不完整，请检查');
        return;
      }
      setLoading(true);
      const result: string[] = Object.entries(answers).map(([key, value]) => {
        const answer = Array.isArray(value) ? value.join(", ") : value;
        return `Question: ${key}, Answer: ${answer}`;
      });
      chatApi.addKnowledges(result).then(res => {
        console.log(res);
        // 保存成功后设置本地缓存
        localStorage.setItem('trendmuse_form_submitted', 'true');
        localStorage.setItem('trendmuse_form_answers', JSON.stringify(answers));
        setIsFormSubmitted(true);
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

  const handleGoToChat = () => {
    navigate('/chat');
  };

  const handleResetForm = () => {
    localStorage.removeItem('trendmuse_form_submitted');
    //localStorage.removeItem('trendmuse_form_answers');
    setIsFormSubmitted(false);
  };

  return (
    <>
      {isFormSubmitted ? (
        <div className="user-center-success-message">
          <div className="success-icon">✅</div>
          <div className="success-text">
            TrendMuse 已经了解你是谁、卖什么、想怎么做内容啦～
            <br />
            输入任何要求与问题，一起来生成适合你的选题、达人推荐或者是内容文案吧！
          </div>
          <div style={{ marginTop: '15px' }}>
            <button 
              className="user-center-btn" 
              onClick={handleGoToChat}
              style={{ marginRight: '10px' }}
            >
              开始对话
            </button>
            <button 
              className="user-center-btn" 
              onClick={handleResetForm}
              style={{ background: '#ff9800' }}
            >
              重新填写
            </button>
          </div>
        </div>
      ) : (
        <QuestionForm 
          questions={questions} 
          hasSubmit={isFormSubmitted} 
          loading={loading}
          onSubmit={handleQuestionSend}
        />
      )}
    </>
  );
};

export default KnowledgeBase; 