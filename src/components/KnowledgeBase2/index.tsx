import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Radio, Checkbox, Button, Card, Divider, InputNumber, Rate } from 'antd';
import { chatApi } from '@/services/chat';
import { toast } from 'react-toastify';

const { TextArea } = Input;

const KnowledgeBase2: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isFormSubmitted, setIsFormSubmitted] = useState(() => {
    return localStorage.getItem('trendmuse_form_submitted') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedEndorsements, setSelectedEndorsements] = useState<string[]>([]);
  
  // 解析从getKnowledges接口返回的数据格式
  const parseKnowledgeData = (knowledgeData: string | null | undefined): Record<string, string | string[]> => {
    console.log(knowledgeData);
    const answers: Record<string, string | string[]> = {};

    if (!knowledgeData) {
      return answers;
    }

    try {
      const json = JSON.parse(knowledgeData);
      if (json) {
        const multipleChoiceQuestions = [
          'professionalEndorsements', 'hobbies', 'hiddenSkills', 'targetAgeRange'
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
          form.setFieldsValue(parsedAnswers);
          // 设置专业背书的选中状态
          if (parsedAnswers.professionalEndorsements) {
            const endorsements = Array.isArray(parsedAnswers.professionalEndorsements) 
              ? parsedAnswers.professionalEndorsements 
              : [parsedAnswers.professionalEndorsements];
            setSelectedEndorsements(endorsements);
          }
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
  }, [form]);

  const handleFormSubmit = async (values: Record<string, any>) => {
    try {
      if (loading || isFormSubmitted) return;
      
      // 检查必填字段
      if (!values.realName || !values.gender || !values.industry) {
        toast.error('填写的信息不完整，请检查必填项');
        return;
      }
      
      setLoading(true);
      
      const result: Record<string, string> = Object.fromEntries(
        Object.entries(values).map(([key, value]) => {
          const answer = Array.isArray(value) ? value.join(", ") : String(value || '');
          return [key, answer];
        })
      );
      
      console.log(result);
      
      await chatApi.addKnowledges(JSON.stringify(result)).then(res => {
        console.log(res);
        // 保存成功后设置状态
        setSavedAnswers(values);
        setIsFormSubmitted(true);
        localStorage.setItem('trendmuse_form_submitted', 'true');
        toast.success('信息保存成功！');
      })
      .finally(() => {
        setLoading(false);
      });
    } catch (error) {
      console.error('Error sending form:', error);
      toast.error('保存失败，请重试');
    } finally {
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
      if (knowledgeData) {
        const parsedAnswers = parseKnowledgeData(knowledgeData);
        setSavedAnswers(parsedAnswers);
        form.setFieldsValue(parsedAnswers);
        // 设置专业背书的选中状态
        if (parsedAnswers.professionalEndorsements) {
          const endorsements = Array.isArray(parsedAnswers.professionalEndorsements) 
            ? parsedAnswers.professionalEndorsements 
            : [parsedAnswers.professionalEndorsements];
          setSelectedEndorsements(endorsements);
        }
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
            已经了解您的个人IP背景和企业情况！
            <br />
            现在可以开始为您提供个性化的内容策略和建议了！
          </div>
          <div style={{ marginTop: '15px' }}>
            <Button 
              type="primary"
              onClick={handleGoToChat}
              style={{ marginRight: '10px' }}
            >
              开始定位
            </Button>
            <Button 
              onClick={handleResetForm}
              style={{ background: '#ff9800', color: 'white' }}
            >
              重新填写
            </Button>
          </div>
        </div>
      ) : (
        <div >
          <Card title="企业家个人IP打造调查表" style={{ marginBottom: '20px' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              initialValues={savedAnswers}
            >
              <Divider  orientation="left" orientationMargin="0">一、基本情况</Divider>
              
              <Form.Item
                label="本名"
                name="realName"
                rules={[{ required: true, message: '请填写您的姓名' }]}
              >
                <Input placeholder="请输入您的真实姓名" style={{ width: '200px' }} />
              </Form.Item>
              
                             <Form.Item
                 label="朋友常称您"
                 name="friendsCall"
               >
                 <Input placeholder='如"老张""慧姐"'  style={{ width: '200px' }}  />
               </Form.Item>
               
               <Form.Item
                 label="客户常称您"
                 name="clientsCall"
               >
                 <Input placeholder='如"王总""李老师"'  style={{ width: '200px' }}  />
              </Form.Item>
              
              <Form.Item
                label="性别"
                name="gender"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Radio.Group>
                  <Radio value="男">男</Radio>
                  <Radio value="女">女</Radio>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                label="年龄"
                name="age"
              >
                <InputNumber placeholder="请输入年龄" min={18} max={100} />
              </Form.Item>
              
              <Form.Item
                label="日常爱好"
                name="hobbies"
              >
                <Checkbox.Group>
                  <Checkbox value="攀岩">攀岩</Checkbox>
                  <Checkbox value="读书">读书</Checkbox>
                  <Checkbox value="摄影">摄影</Checkbox>
                  <Checkbox value="运动健身">运动健身</Checkbox>
                  <Checkbox value="旅行">旅行</Checkbox>
                  <Checkbox value="音乐">音乐</Checkbox>
                  <Checkbox value="绘画">绘画</Checkbox>
                  <Checkbox value="收藏">收藏</Checkbox>
                </Checkbox.Group>
              </Form.Item>
              
              <Form.Item
                label="隐藏技能"
                name="hiddenSkills"
              >
                <Checkbox.Group>
                  <Checkbox value="演讲">演讲</Checkbox>
                  <Checkbox value="编程">编程</Checkbox>
                  <Checkbox value="烹饪">烹饪</Checkbox>
                  <Checkbox value="写作">写作</Checkbox>
                  <Checkbox value="外语">外语</Checkbox>
                  <Checkbox value="乐器">乐器</Checkbox>
                  <Checkbox value="设计">设计</Checkbox>
                  <Checkbox value="主持">主持</Checkbox>
                </Checkbox.Group>
              </Form.Item>
              
              <Form.Item
                label="最高学历/专业"
                name="education"
              >
                <Input placeholder="如：硕士/计算机科学" />
              </Form.Item>
              
              <Form.Item
                label="从事什么行业"
                name="industry"
                rules={[{ required: true, message: '请填写行业信息' }]}
              >
                <Input placeholder="请输入您从事的行业" />
              </Form.Item>
              
              <Form.Item
                label="从业年限"
                name="workYears"
              >
                <InputNumber placeholder="请输入从业年限" min={0} max={50} addonAfter="年" />
              </Form.Item>
              
              <Form.Item
                label="创业前的工作"
                name="previousWork"
              >
                <TextArea rows={3}  placeholder="请描述您创业前的工作经历" />
              </Form.Item>
              
              <Divider  orientation="left" orientationMargin="0">二、行业深耕经历</Divider>
              
              <Form.Item
                label="入行时间"
                name="industryStartYear"
              >
                <InputNumber placeholder="入行年份" min={1980} max={new Date().getFullYear()} addonAfter="年" />
              </Form.Item>
              
                             <Form.Item
                 label="行业细分领域"
                 name="industrySubfield"
               >
                 <Input placeholder='如"智能汽车安全""母婴电商"' />
               </Form.Item>
               
               <Form.Item
                 label="颠覆认知的行业真相"
                 name="industryInsight"
               >
                 <TextArea 
                   rows={3} 
                   placeholder='您曾以为"_______"，但实际发现"_______"。(例：曾以为技术领先就能赢市场，实际发现用户信任才是核心)' 
                 />
               </Form.Item>
              
              <Form.Item
                label="行业安身立命之本"
                name="industryFoundation"
              >
                <Radio.Group>
                  <Radio value="技术壁垒">技术壁垒</Radio>
                  <Radio value="供应链效率">供应链效率</Radio>
                  <Radio value="用户信任">用户信任</Radio>
                  <Radio value="服务体验">服务体验</Radio>
                  <Radio value="其他">其他</Radio>
                </Radio.Group>
              </Form.Item>
              
              <Divider  orientation="left" orientationMargin="0">三、个人差异化优势</Divider>
              
              <Form.Item
                label="专业背书"
                name="professionalEndorsements"
              >
                <Checkbox.Group 
                  onChange={(values) => setSelectedEndorsements(values as string[])}
                  value={selectedEndorsements}
                  style={{width: "100%"}}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px',width: "100%" }}>
                    <div>
                      <Checkbox value="行业奖项">行业奖项</Checkbox>
                      {selectedEndorsements.includes('行业奖项') && (
                        <Form.Item
                          name="industryAwardDetail"
                          style={{ marginTop: '8px', marginBottom: 0 }}
                        >
                          <TextArea rows={2}  placeholder="请输入具体奖项名称"  />
                        </Form.Item>
                      )}
                    </div>
                    
                    <div>
                      <Checkbox value="专利/著作权">专利/著作权</Checkbox>
                      {selectedEndorsements.includes('专利/著作权') && (
                        <Form.Item
                          name="patentDetail"
                          style={{ marginTop: '8px', marginBottom: 0 }}
                        >
                          <TextArea rows={2}  placeholder="请输入专利/著作权数量及名称"  />
                        </Form.Item>
                      )}
                    </div>
                    
                    <div>
                      <Checkbox value="头部企业合作案例">头部企业合作案例</Checkbox>
                      {selectedEndorsements.includes('头部企业合作案例') && (
                        <Form.Item
                          name="corporatePartnerDetail"
                          style={{ marginTop: '8px', marginBottom: 0 }}
                        >
                          <TextArea rows={2}  placeholder="请输入合作企业名称及案例"  />
                        </Form.Item>
                      )}
                    </div>
                    
                    <div>
                      <Checkbox value="著作/专栏">著作/专栏</Checkbox>
                      {selectedEndorsements.includes('著作/专栏') && (
                        <Form.Item
                          name="publicationDetail"
                          style={{ marginTop: '8px', marginBottom: 0 }}
                        >
                          <TextArea rows={2}  placeholder="请输入著作/专栏名称"  />
                        </Form.Item>
                      )}
                    </div>
                  </div>
                </Checkbox.Group>
              </Form.Item>
              
              <Form.Item
                label="累计服务客户数"
                name="clientsServed"
              >
                <InputNumber placeholder="服务客户数量" min={0} addonAfter="人" />
              </Form.Item>
              
              <Form.Item
                label="最常解决的客户痛点"
                name="clientPainPoints"
              >
                <TextArea 
                  rows={2} 
                  placeholder="例：帮中小企业降低30%网络安全风险" 
                />
              </Form.Item>
              
              <Form.Item label="他人眼中的您 - 创新性">
                <Form.Item name="innovation" style={{ display: 'inline-block', margin: 0 }}>
                  <Rate />
                </Form.Item>
              </Form.Item>
              
              <Form.Item label="他人眼中的您 - 亲和力">
                <Form.Item name="affinity" style={{ display: 'inline-block', margin: 0 }}>
                  <Rate />
                </Form.Item>
              </Form.Item>
              
              <Form.Item label="他人眼中的您 - 行业权威感">
                <Form.Item name="authority" style={{ display: 'inline-block', margin: 0 }}>
                  <Rate />
                </Form.Item>
              </Form.Item>
              
              <Form.Item label="他人眼中的您 - 故事感染力">
                <Form.Item name="storytelling" style={{ display: 'inline-block', margin: 0 }}>
                  <Rate />
                </Form.Item>
              </Form.Item>
              
              <Divider  orientation="left" orientationMargin="0">四、企业运营现状</Divider>
              
              <Form.Item
                label="当前团队规模"
                name="teamSize"
              >
                <InputNumber placeholder="团队人数" min={1} addonAfter="人" />
              </Form.Item>
              
              <Form.Item
                label="当前营收规模"
                name="revenue"
              >
                <Input placeholder="请输入营收规模" />
              </Form.Item>
              
              <Form.Item
                label="月均人力成本"
                name="laborCost"
              >
                <InputNumber placeholder="人力成本" min={0} addonAfter="元" />
              </Form.Item>
              
              <Form.Item
                label="月均房租/水电成本"
                name="facilityCost"
              >
                <InputNumber placeholder="房租水电成本" min={0} addonAfter="元" />
              </Form.Item>
              
              <Form.Item
                label="月均营销成本"
                name="marketingCost"
              >
                <InputNumber placeholder="营销成本" min={0} addonAfter="元" />
              </Form.Item>
              
              <Form.Item
                label="主营产品"
                name="mainProduct"
              >
                <Input placeholder="请描述您的主营产品" />
              </Form.Item>
              
                             <Form.Item
                 label="引流产品"
                 name="leadProduct"
               >
                 <Input placeholder='如"免费检测服务"' />
               </Form.Item>
               
               <Form.Item
                 label="核心竞品"
                 name="competitors"
               >
                 <Input placeholder="请列出主要竞争对手" />
               </Form.Item>
               
               <Form.Item
                 label="您的差异化优势"
                 name="competitiveAdvantage"
               >
                 <TextArea 
                   rows={2} 
                   placeholder="例：成本相同，但售后响应速度领先50%" 
                 />
               </Form.Item>
               <Form.Item
                 label="增长潜力"
                 name="growthPotential"
               >
                 <TextArea 
                   rows={2} 
                   placeholder="若业务翻倍，需新增成本：___万元（主要用于________）" 
                 />
               </Form.Item>
              
              <Divider  orientation="left" orientationMargin="0">五、目标用户画像</Divider>
              
              <Form.Item
                label="目标用户年龄段"
                name="targetAgeRange"
              >
                <Checkbox.Group>
                  <Checkbox value="18-25">18-25</Checkbox>
                  <Checkbox value="26-35">26-35</Checkbox>
                  <Checkbox value="36-45">36-45</Checkbox>
                  <Checkbox value="46-55">46-55</Checkbox>
                  <Checkbox value="55+">55+</Checkbox>
                </Checkbox.Group>
              </Form.Item>
              
              <Form.Item
                label="身份标签"
                name="targetIdentity"
              >
                <Input placeholder='如"90后宝妈""中小企业主"' />
              </Form.Item>
              
              <Form.Item
                label="决策者vs使用者"
                name="decisionMaker"
              >
                <Input placeholder='如"家长决策，孩子使用"' />
              </Form.Item>
              
              <Form.Item
                label="他们最常抱怨什么"
                name="userComplaints"
              >
                <TextArea rows={2} placeholder="描述目标用户的主要痛点和抱怨" />
              </Form.Item>
              
              <Form.Item
                label="他们关注的内容"
                name="userInterests"
              >
                <TextArea 
                  rows={2} 
                  placeholder='如"行业避坑指南""成本优化案例"' 
                />
              </Form.Item>
              
              <Divider  orientation="left" orientationMargin="0">六、个人IP潜力挖掘</Divider>
              
              <Form.Item
                label="您最想传递的价值观"
                name="coreValues"
              >
                <TextArea 
                  rows={2} 
                  placeholder='我希望用户提到我时，想到________。(例："科技向善""极致性价比")' 
                />
              </Form.Item>
              
              <Form.Item
                label="一个只有您能讲的故事"
                name="uniqueStory"
              >
                <TextArea 
                  rows={4} 
                  placeholder='从业中最难忘的经历(建议包含冲突与突破，如"曾因技术漏洞损失百万，后带领团队72小时逆转困局")' 
                />
              </Form.Item>
              
              <Form.Item
                label="拒绝同质化的关键"
                name="differentiationKey"
              >
                <TextArea 
                  rows={2} 
                  placeholder="我的内容不同于其他企业家，因为我会侧重_________。(例：拆解技术黑匣子/直播工厂溯源)" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                  style={{ width: '100%' }}
                >
                  提交信息
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )}
    </>
  );
};

export default KnowledgeBase2;
