import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionForm from '@/components/Question';
import { chatApi } from '@/services/chat';
import { toast } from 'react-toastify';

const KnowledgeBase2: React.FC = () => {
  const navigate = useNavigate();
  const [isFormSubmitted, setIsFormSubmitted] = useState(() => {
    return localStorage.getItem('trendmuse_form_submitted') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string | string[]>>({});
  
  // 解析从getKnowledges接口返回的数据格式
  const parseKnowledgeData = (knowledgeData: string | null | undefined): Record<string, string | string[]> => {
    console.log(knowledgeData);
    const answers: Record<string, string | string[]> = {};

    if (!knowledgeData) {
      return answers;
    }

    try {
      let json = JSON.parse(knowledgeData);
      if (json) {
        const multipleChoiceQuestions = [
          'ipPurpose', 'ipContent'
        ];

        Object.keys(json).forEach((key: string) => {
          if (multipleChoiceQuestions.includes(key)) {
            // 多选题：如果包含逗号分隔符就分割，否则转为单元素数组
            if (json[key].includes(', ')) {
              answers[key] = json[key].split(', ').map((v: string) => v.trim());
            } else {
              answers[key] = [json[key]];
            }
          } else {
            // 单选题或文本题
            answers[key] = json[key];
          }
        });
      }
    } catch (error) {
      console.error('Error parsing knowledge data:', error);
      console.log('Raw knowledge data:', knowledgeData);
    }
    /*try {
      // 处理数组格式或字符串格式
      let knowledgeArray: string[];

      if (Array.isArray(knowledgeData)) {
        // 直接是数组格式
        knowledgeArray = knowledgeData;
      } else {
        return answers;
      }
      if (Array.isArray(knowledgeArray)) {
        knowledgeArray.forEach((item: string) => {
          // 解析 "Question: key, Answer: value" 或 "Question:key,Answer:value" 格式
          const match = item.match(/^Question:\s*(.+?),\s*Answer:\s*(.+)$/);
          if (match) {
            let key = match[1].trim();
            const value = match[2].trim();

            // 判断是否为多选答案
            // 根据问题类型来判断是否应该分割为数组
            const multipleChoiceQuestions = [
              'productType', 'contentFeatures', 'ageRange', 'userProfileTags', 
              'futureMonthsGoals', 'mostNeeded', 'brandValuesAndStyles'
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
    }*/

    console.log('Parsed answers:', answers);
    return answers;
  };

  // 组件初始化时从接口获取数据
  useEffect(() => {
    const loadSavedAnswers = async () => {
      try {
        const knowledgeData = await chatApi.getKnowledges();
        console.log(knowledgeData);
        if (knowledgeData) {
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
      question: '1、您是一个企业主（老板、创业者、企业家）吗？',
      type: 'single' as const,
      options: ['A：是', 'B：否']
    },
    {
      id: 'productOrServiceIntroduction',
      question: '2、如果你是一个企业主，你是否有明确的产品或服务？',
      type: 'single' as const,
      options: ['A：是的，我有', 'B：目前没有']
    },
    {
      id: 'ipPurpose',
      question: '3、如果你是一个企业主，你认为个人IP对业务的作用是什么？',
      type: 'multiple' as const,
      options: ['A：提高成交效率', 'B：个人可信度提升', 'C：展示自己，吸引流量', 'D：把自己打造成网红，带货赚钱', 'E：其它']
    },
    {
      id: 'ipContent',
      question: '4、如果你是一个企业主，你认为你的IP应该展示什么内容？',
      type: 'multiple' as const,
      options: ['A：介绍自己的业务，展示产品或服务', 'B：客户感兴趣的内容', 'C：社会热点，啥火聊啥', 'D：讲我个人的生活和工作', 'E：自己喜欢讲啥就讲啥']
    },
    {
      id: 'ipBuilding',
      question: '5、如果你是一个企业主，你想打造自己的IP，你认为以下什么是对的？',
      type: 'single' as const,
      options: ['A：展示真实的自己', 'B：塑造客户喜欢的形象', 'C：选择真实的一面，用网络语言展示自己']
    },
    {
      id: 'prodectOrServiceDetails',
      question: '6、作为一个企业主，你可以准确描述你卖的产品或服务吗？',
      type: 'single' as const,
      options: ['A：可以', 'B：不可以', 'C：不确定']
    },
    {
      id: 'selfDescription',
      question: '7、你认为别人对你的个性评价是？',
      type: 'single' as const,
      options: ['A：我很有个性', 'B：我很普通', 'C：我不确定', 'D：别人认为我很个性', 'E：别人认为我很普通']
    },
    {
      id: 'detailedDescription',
      question: '请从个人信息（姓名、性别、年龄、爱好、学历）、行业履历（行业、从业年限、行业地位、对行业的理解、优势等）、个性特征、用户画像（你对你客户的描述）、做个人IP的目的等方向对自己进行描述：',
      tips: `参考案例：
      \n“我叫郭文文，男，，36岁，北理工本科毕业；行业称郭总，老郭，连锁按摩店老板，入行8年，比较有亲和力，思维活跃，勤奋，勇于探索，曾经是某科技公司产品经理；喜欢研究各行各业的商业模式；善于分析零售行业的商业模式，也投资过多家线下零售项目；
      \n在按摩店运营领域深耕多年，曾开发行业领先的连锁按摩店管理软件，拥有成熟的按摩店运营管理经验；
      \n目前企业10人左右，500万营收，毛利300万，纯利100万，主营连锁安按摩店，核心产品是肩颈按摩、全身按摩；核心优势是多年从业经验和人脉资源、善于做选址和网络营销；
      \n我的主要客户是：位北京中高端社区附近的人， 28-55岁的人，一般工作比较累，需要按摩解压，男女各半。
      \n我做个人IP的目标是：1、给我按摩店获取更多客户，提高成交效率；2、打造自己个性化人设，开拓更多商业机会。”\n`, 
      type: 'text' as const
    },
  ];

  const handleQuestionSend = async (answers: Record<string, string | string[]>) => {
    try {
      if (loading || isFormSubmitted) return;
      if (!('accountType' in answers)
        || !('productOrServiceIntroduction' in answers) || !('ipPurpose' in answers)) {
        toast.error('填写的信息不完整，请检查');
        return;
      }
      setLoading(true);
      //const result: string[] = Object.entries(answers).map(([key, value]) => {
      //  const answer = Array.isArray(value) ? value.join(", ") : value;
      //  return `Question: ${key}, Answer: ${answer}`;
      //});
      const result: Record<string, string> = Object.fromEntries(
        Object.entries(answers).map(([key, value]) => {
          const answer = Array.isArray(value) ? value.join(", ") : value;
          return [key, answer];
        })
      );
      console.log(result);
      /*chatApi.addKnowledges(JSON.stringify(result)).then(res => {
        console.log(res);
        // 保存成功后设置状态
        setSavedAnswers(answers);
        setIsFormSubmitted(true);
        localStorage.setItem('trendmuse_form_submitted', 'true');
      })
      .finally(() => {
        setLoading(false);
      });*/
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
      //if (knowledgeData && Array.isArray(knowledgeData) && knowledgeData.length > 0) {
      if (knowledgeData) {
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
            已经了解您的个人IP背景和企业情况！您的独特经历与认知是个人IP的核心资产。
            <br />
            现在可以开始为您提供个性化的内容策略和建议了！
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

export default KnowledgeBase2;
