import React, { useState, useEffect } from 'react';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string | string[]>>({});
  
  // 解析从getKnowledges接口返回的数据格式
  const parseKnowledgeData = (knowledgeData: string[] | null | undefined): Record<string, string | string[]> => {
    console.log(knowledgeData);
    const answers: Record<string, string | string[]> = {};
    
    if (!knowledgeData) {
      return answers;
    }
    
    try {
      // 处理数组格式或字符串格式
      let knowledgeArray: string[];
      
      if (Array.isArray(knowledgeData)) {
        // 直接是数组格式
        knowledgeArray = knowledgeData;
      } else {
        return answers;
      }
      
      // 旧id到新id的映射
      const idMapping: Record<string, string> = {
        'basicIntro': 'basicIntroduction',
        'basicIntroText': 'basicIntroductionDetailedDescription',
        'maxSellingPoint': 'maximumSellingPoint',
        'targetGender': 'targetAudienceGender',
        'locationPreference': 'geographicPreference',
        'consumingPower': 'consumptionAbility',
        'futureGoals': 'futureThreeToSixMonthsGoals',
        'trendMuseHelp': 'mostHopedTrendMuseHelp',
        'brandValues': 'brandAccountValues',
        'uploadFileLink': 'privateBrandKnowledgeUploadLink'
      };
      
      if (Array.isArray(knowledgeArray)) {
        knowledgeArray.forEach((item: string) => {
          // 解析 "Question: key, Answer: value" 或 "Question:key,Answer:value" 格式
          const match = item.match(/^Question:\s*(.+?),\s*Answer:\s*(.+)$/);
          if (match) {
            let key = match[1].trim();
            const value = match[2].trim();
            
            // 将旧id映射到新id
            if (idMapping[key]) {
              key = idMapping[key];
            }
            
            // 判断是否为多选答案
            // 根据问题类型来判断是否应该分割为数组
            const multipleChoiceQuestions = [
              'productType', 'contentFeatures', 'ageRange', 'userProfileTags', 
              'futureThreeToSixMonthsGoals', 'mostHopedTrendMuseHelp', 'brandAccountValues'
            ];
            
            if (multipleChoiceQuestions.includes(key)) {
              // 多选题：如果包含逗号分隔符就分割，否则转为单元素数组
              if (value.includes(', ')) {
                answers[key] = value.split(', ').map(v => v.trim());
              } else {
                answers[key] = [value];
              }
            } else {
              // 单选题或文本题
              answers[key] = value;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing knowledge data:', error);
      console.log('Raw knowledge data:', knowledgeData);
    }
    
    console.log('Parsed answers:', answers);
    return answers;
  };

  // 组件初始化时从接口获取数据
  useEffect(() => {
    const loadSavedAnswers = async () => {
      try {
        const knowledgeData = await chatApi.getKnowledges();
        console.log(knowledgeData);
        if (knowledgeData && Array.isArray(knowledgeData) && knowledgeData.length > 0) {
          const parsedAnswers = parseKnowledgeData(knowledgeData);
          setSavedAnswers(parsedAnswers);
          // 如果有数据，说明已经填写过
          setIsFormSubmitted(Object.keys(parsedAnswers).length > 0);
        } else {
          // 接口返回空数据，说明没有填写过
          setIsFormSubmitted(false);
        }
      } catch (error) {
        console.error('Error loading saved answers:', error);
        // 接口调用失败，说明没有数据
        setIsFormSubmitted(false);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSavedAnswers();
  }, []);
  
  const questions = [
    { 
      id: 'accountName', 
      question: '账号名称', 
      type: 'text' as const
    },
    { 
      id: 'accountType', 
      question: '账号类型', 
      type: 'single' as const, 
      options: ['品牌账号：旨在为品牌产品进行推广，同时传达一致的品牌调性', '达人账号：通过内容分享吸引粉丝，增强粉丝粘性，以提升内容曝光量，并为未来的招商广告留出盈利空间'] 
    },
    { 
      id: 'basicIntroduction', 
      question: '基本介绍', 
      type: 'single' as const, 
      options: ['主要卖产品：专注于销售某类商品', '主要卖内容：专注于分享某领域知识或经验', '产品+内容：同时销售产品并分享相关内容'] 
    },
    { 
      id: 'detailedDescription', 
      question: '基本介绍详细描述',
      tips: `示例1：【爱格女包】是一个【卖女士包】的品牌账号，成立于【2024年】。因为想【让更多打工人用上质量好，但是价格优惠，工厂直出的通勤包】而创立了这个品牌。我希望在【3年内】，它能成为【工厂品质女包的领军品牌】。
      \n  示例2：【张三谈职场】是一个专注于【职业发展和心理健康】的达人账号，成立于【2025年】。因为希望【帮助更多人提升职场竞争力，掌握有效的时间管理和心理调适技巧】而创建了这个账号。我希望在【3年内】能够成为【职业发展与心理健康领域的知名影响者】。\n`, 
      type: 'text' as const
    },
    { 
      id: 'coreAttribute', 
      question: '核心属性', 
      type: 'single' as const, 
      options: ['功能性（主要解决具体问题/提供功能）', '情绪性（主要带来心理感受/价值观连接）', '二者兼有'] 
    },
    { 
      id: 'biggestSellingPoint', 
      question: '你的最大卖点', 
      type: 'text' as const
    },
    { 
      id: 'biggestDifference', 
      question: '与同类最大的差异', 
      type: 'text' as const
    },
    { 
      id: 'productType', 
      question: '产品类型', 
      type: 'multiple' as const, 
      options: ['美妆', '美容个护', '鞋包潮玩', '穿搭打扮', '美食', '母婴育儿', '旅游出行', '家居家装', '教育', '生活', '运动健身', '兴趣爱好', '影视综', '婚嫁', '摄影摄像', '萌宠', '情感星座', '科技互联网', '资讯', '健康养生', '科学科普', '职场', '交通工具', '其他'] 
    },
    /*{ 
      id: 'contentFeatures', 
      question: '内容特征', 
      type: 'multiple' as const, 
      options: ['合集', '教程', 'ootd', '测评', '探店', 'vlog', '沉浸式', '仿妆', '彩妆试色', 'plog', '开箱', '成分解析', '日系', '氛围感', '高级感', '校园风', '韩系', '复古', '中性风', '甜酷', '纯欲', '欧美风', '低脂低卡', '自律生活', '职场生活', '极简主义', '露营徒步', '痘痘肌', '黄皮', '敏感肌', '干皮', '白皮', '油皮', '瑕疵皮', '混合肌', '隔离防晒', '保湿补水', '抗老', '控油', '祛痘祛闭口', '祛黄', '眼部护理', '修复', '抗氧化', '美白', '抗炎', '去皱', '淡斑'] 
    },*/
    { 
      id: 'targetAudienceGender', 
      question: '目标人群性别', 
      type: 'single' as const, 
      options: ['女性', '男性', '不限'] 
    },
    { 
      id: 'ageRange', 
      question: '年龄范围', 
      type: 'multiple' as const, 
      options: ['<18', '18-24', '25-34', '35-44', '>44'] 
    },
    { 
      id: 'regionalPreference', 
      question: '地域偏好', 
      type: 'single' as const, 
      options: ['一线城市', '新一线', '二三线城市', '不限'] 
    },
    { 
      id: 'consumptionAbility', 
      question: '消费能力', 
      type: 'single' as const, 
      options: ['低（目标用户的月消费能力<100）', '中（目标用户的月消费能力100-500）', '高（目标用户的月消费能力500+）'] 
    },
    { 
      id: 'userProfileTags', 
      question: '用户画像标签', 
      type: 'multiple' as const, 
      options: ['都市精英', '小镇青年', '斜杠青年', '社恐宅家', '热衷社交', '文艺青年', '健身运动', '旅行探索', '知识追求', '潮流消费', '心理自助', '美妆时尚'] 
    },
    { 
      id: 'futureMonthsGoals', 
      question: '未来3-6个月最希望优先实现', 
      type: 'multiple' as const, 
      options: ['粉丝增长', '提升转化/销量', '建立品牌心智', '提高内容影响力（曝光）'] 
    },
    { 
      id: 'mostHopeful', 
      question: '最希望 TrendMuse 帮你做的', 
      type: 'multiple' as const, 
      options: ['账号定位优化', '品牌故事/文化提炼', '差异化/爆款选题建议', '小红书日更内容生成', '合作达人推荐及筛选', '网络热点同步', '其他'] 
    },
    { 
      id: 'brandValuesAndStyles', 
      question: '请从以下选项中选择最符合您品牌/账号的价值观，这将决定账号的定位与风格输出', 
      type: 'multiple' as const, 
      options: ['真实/透明', '多元/包容', '可持续/环保', '稳定/安全感', '利他/责任', '创新/前卫', '专业/极致', '归属/社群', '自我表达/个性', '健康/自律', '独立/强大', '幽默/轻松', '奢华/稀缺', '好奇/探索', '克制/极简', '其他：输入'] 
    },
    { 
      id: 'benchmarkAccountLink', 
      question: '请分享您最希望对标的账号链接，这将帮助我们为您提供最满意的效果（此项为非必选项）', 
      type: 'text' as const
    },
    { 
      id: 'privateBrandKnowledgeUploadLink', 
      question: '如果可以，请将更多资料上传到您的私有品牌知识库，这将帮助您的灵感 Muse 更好地理解您（此项为非必选项）', 
      type: 'text' as const
    }
  ];

  const handleQuestionSend = async (answers: Record<string, string | string[]>) => {
    try {
      if (loading || isFormSubmitted) return;
      if (!('accountName' in answers) || !('accountType' in answers)
        || !('basicIntroduction' in answers) || !('productType' in answers)) {
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
        // 保存成功后设置状态
        setSavedAnswers(answers);
        setIsFormSubmitted(true);
        localStorage.setItem('trendmuse_form_submitted', 'true');
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

  const handleResetForm = async () => {
    // 从接口重新获取数据
    try {
      const knowledgeData = await chatApi.getKnowledges();
              if (knowledgeData && Array.isArray(knowledgeData) && knowledgeData.length > 0) {
          const parsedAnswers = parseKnowledgeData(knowledgeData);
          setSavedAnswers(parsedAnswers);
        }
    } catch (error) {
      console.error('Error loading saved answers:', error);
    }
    setIsFormSubmitted(false);
  };

  return (
    <>
      {initialLoading ? (
        <div className="user-center-loading">
          <div className="loading-spinner"></div>
          <div>正在加载...</div>
        </div>
      ) : isFormSubmitted ? (
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
          initialAnswers={savedAnswers}
          onSubmit={handleQuestionSend}
        />
      )}
    </>
  );
};

export default KnowledgeBase; 