import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Radio, Checkbox, Button, Card, Divider, Typography } from 'antd';
import { chatApi } from '@/services/chat';
import { toast } from 'react-toastify';
import LocalUpload from '../LocalUpload';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import SpeechTextArea from '../SpeechTextArea';
//import api from '@/services/axios';

//const { TextArea } = Input;

const KnowledgeBase2: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isFormSubmitted, setIsFormSubmitted] = useState(() => {
    return localStorage.getItem('trendmuse_form_submitted') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string | string[]>>({});
  const [files, setFiles] = useState<File[]>([]);
  //const [selectedEndorsements, setSelectedEndorsements] = useState<string[]>([]);
  
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

    console.log('Parsed answers:', answers);
    return answers;
  };

  // 组件初始化时从接口获取数据
  useEffect(() => {
    const loadSavedAnswers = async () => {
      try {
        const knowledgeData = await chatApi.getKnowledges();
        console.log('knowledgeData', knowledgeData);
        if (knowledgeData) {
          const parsedAnswers = parseKnowledgeData(knowledgeData);
          setSavedAnswers(parsedAnswers);
          form.setFieldsValue(parsedAnswers);
          // 设置专业背书的选中状态
          /*if (parsedAnswers.professionalEndorsements) {
            const endorsements = Array.isArray(parsedAnswers.professionalEndorsements) 
              ? parsedAnswers.professionalEndorsements 
              : [parsedAnswers.professionalEndorsements];
            setSelectedEndorsements(endorsements);
          }*/
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = async (values: Record<string, any>) => {
    try {
      if (loading || isFormSubmitted) return;

      // 检查必填字段
      if (!values.productOrServiceIntroduction || !values.ipPurpose) {
        toast.error('填写的信息不完整，请检查必填项');
        return;
      }

      setLoading(true);
      toast('正在提交知识库数据...');

      const result: Record<string, string> = Object.fromEntries(
        Object.entries(values).map(([key, value]) => {
          const answer = Array.isArray(value) ? value.join(", ") : String(value || '');
          return [key, answer];
        })
      );
      console.log('result', result);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const userId = await chatApi.getUserId();
      formData.append('userId', userId);

      const knowledges = JSON.stringify(result);
      formData.append('knowledges', knowledges);

      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // await chatApi.addFiles(formData).then(res => {
      //   console.log('formData return', res);
      // })

      await chatApi.addKnowledges(formData).then(res => {
        console.log('return res', res);
        let summary = JSON.stringify(result);
        let feedback = '';
        try {
          const json = JSON.parse(res);
          summary = json.summary || '';
          feedback = json.feedback || '';
        }
        catch (err) {
          console.log(err);
          summary = res.summary || '';
          feedback = res.feedback || '';
        }
        //console.log(summary);
        const preAnswers = localStorage.getItem('local_knowledge_value') || '';
        if (preAnswers !== summary) {
          localStorage.setItem('local_knowledge_value', summary);
          localStorage.setItem('local_knowledge_value_updated', 'true');
        }
        // 保存成功后设置状态
        setSavedAnswers(values);
        //setIsFormSubmitted(true);
        setLoading(false);
        localStorage.setItem('trendmuse_form_submitted', 'true');
        toast.success('信息保存成功！');

        Modal.confirm({
          title: '是否优化一下个人信息?',
          icon: <ExclamationCircleOutlined />,
          width: '80%',
          bodyStyle: { 
            padding: 28,
          },
          content: (
            <div style={{ whiteSpace: 'pre-line' }}>{feedback}</div>
          ),
          okText: '优化',
          okType: 'primary',
          cancelText: '不优化了，去定位',
          onOk() {
            setIsFormSubmitted(false);
          },
          async onCancel() {
            setIsFormSubmitted(true);
            navigate('/chat');
          },
        });
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
        /*if (parsedAnswers.professionalEndorsements) {
          const endorsements = Array.isArray(parsedAnswers.professionalEndorsements) 
            ? parsedAnswers.professionalEndorsements 
            : [parsedAnswers.professionalEndorsements];
          setSelectedEndorsements(endorsements);
        }*/
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
              <Form.Item
                label="1、您是一个企业主（老板、创业者、企业家）吗？"
                name="accountType"
                rules={[{ required: true, message: '请选择是否是企业主' }]}
              >
                <Radio.Group>
                  <Radio value="是">A：是</Radio>
                  <Radio value="否">B：否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="2、如果你是一个企业主，你是否有明确的产品或服务？"
                name="productOrServiceIntroduction"
                rules={[{ required: true, message: '请选择是否有明确的产品或服务' }]}
              >
                <Radio.Group>
                  <Radio value="是的，我有">A：是的，我有</Radio>
                  <Radio value="目前没有">B：目前没有</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="3、如果你是一个企业主，你认为个人IP对业务的作用是什么？"
                name="ipPurpose"
                rules={[{ required: true, message: '请选择你认为个人IP对业务的作用' }]}
              >
                <Checkbox.Group>
                  <Checkbox value="A：提高成交效率">A：提高成交效率</Checkbox>
                  <Checkbox value="B：个人可信度提升">B：个人可信度提升</Checkbox>
                  <Checkbox value="C：展示自己，吸引流量">C：展示自己，吸引流量</Checkbox>
                  <Checkbox value="D：把自己打造成网红，带货赚钱">D：把自己打造成网红，带货赚钱</Checkbox>
                  <Checkbox value="E：其它">E：其它</Checkbox>
                </Checkbox.Group>
              </Form.Item>
              
              <Form.Item
                label="4、如果你是一个企业主，你认为你的IP应该展示什么内容？"
                name="ipContent"
                rules={[{ required: true, message: '请选择你认为个人IP应该展示什么内容' }]}
              >
                <Checkbox.Group>
                  <Checkbox value="A：介绍自己的业务，展示产品或服务">A：介绍自己的业务，展示产品或服务</Checkbox>
                  <Checkbox value="B：客户感兴趣的内容">B：客户感兴趣的内容</Checkbox>
                  <Checkbox value="C：社会热点，啥火聊啥">C：社会热点，啥火聊啥</Checkbox>
                  <Checkbox value="D：讲我个人的生活和工作">D：讲我个人的生活和工作</Checkbox>
                  <Checkbox value="E：自己喜欢讲啥就讲啥">E：自己喜欢讲啥就讲啥</Checkbox>
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                label="5、如果你是一个企业主，你想打造自己的IP，你认为以下什么是对的？"
                name="ipBuilding"
                rules={[{ required: true, message: '请选择IP目标' }]}
              >
                <Radio.Group>
                  <Radio value="A：展示真实的自己">A：展示真实的自己</Radio>
                  <Radio value="B：塑造客户喜欢的形象">B：塑造客户喜欢的形象</Radio>
                  <Radio value="C：选择真实的一面，用网络语言展示自己">C：选择真实的一面，用网络语言展示自己</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="6、作为一个企业主，你可以准确描述你卖的产品或服务吗？"
                name="prodectOrServiceDetails"
              >
                <Radio.Group>
                  <Radio value="A：可以">A：可以</Radio>
                  <Radio value="B：不可以">B：不可以</Radio>
                  <Radio value="C：不确定">C：不确定</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="7、你认为别人对你的个性评价是？"
                name="selfDescription"
              >
                <Radio.Group>
                  <Radio value="A：我很有个性">A：我很有个性</Radio>
                  <Radio value="B：我很普通">B：我很普通</Radio>
                  <Radio value="C：我不确定">C：我不确定</Radio>
                  <Radio value="D：别人认为我很个性">D：别人认为我很个性</Radio>
                  <Radio value="E：别人认为我很普通">E：别人认为我很普通</Radio>
                </Radio.Group>
              </Form.Item>

              <SpeechTextArea
                label="请从个人信息（姓名、性别、年龄、爱好、学历）、行业履历（行业、从业年限、行业地位、对行业的理解、优势等）、个性特征、用户画像（你对你客户的描述）、做个人IP的目的等方向对自己进行描述："
                name="detailedDescription"
                rows={8}
                placeholder='点击右侧按钮语音输入...\n请输入具体的个人信息、行业履历、个性特征、用户画像、做个人IP的目的等方面的内容' 
              />

              <Form.Item
                label="参考案例："
                name="exampleDescription"
              >
                <Typography.Text style={{ whiteSpace: 'pre-line' }}>{`我叫郭文文，男，36岁，北理工本科毕业；
                  行业称郭总，老郭，连锁按摩店老板，入行8年，比较有亲和力，思维活跃，勤奋，勇于探索，曾经是某科技公司产品经理；
                  喜欢研究各行各业的商业模式；善于分析零售行业的商业模式，也投资过多家线下零售项目；
                  在按摩店运营领域深耕多年，曾开发行业领先的连锁按摩店管理软件，拥有成熟的按摩店运营管理经验；
                  目前企业10人左右，500万营收，毛利300万，纯利100万，主营连锁安按摩店，核心产品是肩颈按摩、全身按摩；
                  核心优势是多年从业经验和人脉资源、善于做选址和网络营销；
                  我的主要客户是：位北京中高端社区附近的人，28-55岁的人，一般工作比较累，需要按摩解压，男女各半。
                  我做个人IP的目标是：
                  1、给我按摩店获取更多客户，提高成交效率；
                  2、打造自己个性化人设，开拓更多商业机会。\n\n`}
                </Typography.Text>
              </Form.Item>

              <Divider  orientation="left" orientationMargin="0">知识库文件</Divider>

              <Form.Item label="您可以上传自己的个人知识库文件" name={"knowledgeBase"}>
                <LocalUpload files={ files } setFiles={ setFiles } />
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
