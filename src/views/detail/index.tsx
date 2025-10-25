// src/views/profile/KnowledgeDetail.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Input, 
  Form, 
  message, 
  Space,
  Typography,
  Divider,
  Spin
} from 'antd';
import { 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined, 
  CalendarOutlined,
  FileTextOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileApi } from '@/services/profile';
import './index.less';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Item } = Descriptions;

interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  type: string;
  containerTags?: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    author?: string;
    tags?: string[];
    category?: string;
    source?: string;
  };
}

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [knowledge, setKnowledge] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载知识详情
  const loadKnowledgeDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // 获取单条知识的API
      const response = await ProfileApi.getById(id);
      setKnowledge(response);
      form.setFieldsValue({
        title: response.title,
        content: response.content,
        metadata: response.metadata
      });
    } catch (error) {
      console.error('加载知识详情失败:', error);
      message.error('加载知识详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeDetail();
  }, [id]);

  // 进入编辑模式
  const handleEdit = () => {
    setEditing(true);
  };

  // 取消编辑
  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
    // 重新加载原始数据
    if (knowledge) {
      form.setFieldsValue({
        title: knowledge.title,
        content: knowledge.content,
        metadata: knowledge.metadata
      });
    }
  };

  // 保存修改
  const handleSave = async (values: any) => {
    if (!knowledge) return;
    
    setSaving(true);
    try {
      const updatedKnowledge = {
        ...knowledge,
        title: values.title,
        content: values.content,
        metadata: values.metadata,
        updateTime: new Date().toISOString()
      };

      // 更新知识的API
      await ProfileApi.update(knowledge.id.toString(), values.content, values.title);
      
      setKnowledge(updatedKnowledge);
      setEditing(false);
      message.success('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return '未知时间';
    }
  };

  if (loading) {
    return (
      <div className="knowledge-detail-loading">
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>加载中...</Text>
      </div>
    );
  }

  if (!knowledge) {
    return (
      <div className="knowledge-detail-empty">
        <Title level={3}>知识不存在</Title>
        <Button type="primary" onClick={() => navigate(-1)}>
          返回上一页
        </Button>
      </div>
    );
  }

  return (
    <div className="knowledge-detail-container">
      {/* 头部操作栏 */}
      <div className="detail-header">
        <Button 
          type="text" 
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          ← 返回列表
        </Button>
        
        <div className="header-actions">
          {!editing ? (
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              编辑
            </Button>
          ) : (
            <Space>
              <Button 
                icon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={saving}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => form.submit()}
              >
                保存
              </Button>
            </Space>
          )}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        disabled={!editing}
      >
        <div className="detail-content">
          {/* 左侧 - 主要内容 */}
          <div className="content-main">
            <Card 
              title={
                <Space>
                  <FileTextOutlined />
                  {editing ? '编辑知识' : '知识详情'}
                  <Tag color={knowledge.type === 'url' ? 'blue' : 'green'}>
                    {knowledge.type === 'url' ? 'URL' : '文本'}
                  </Tag>
                </Space>
              }
              className="content-card"
            >
              {/* 标题 */}
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                {editing ? (
                  <Input 
                    placeholder="请输入知识标题" 
                    size="large"
                  />
                ) : (
                  <Title level={2} style={{ margin: 0 }}>
                    {knowledge.title}
                  </Title>
                )}
              </Form.Item>

              <Divider />

              {/* 内容 */}
              <Form.Item
                name="content"
                label="内容"
                rules={[{ required: true, message: '请输入内容' }]}
              >
                {editing ? (
                  <TextArea
                    placeholder="请输入知识内容"
                    rows={12}
                    showCount
                    maxLength={10000}
                  />
                ) : (
                  <div className="content-display">
                    {knowledge.type === 'url' ? (
                      <a 
                        href={knowledge.content} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="content-url"
                      >
                        {knowledge.content}
                      </a>
                    ) : (
                      <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {knowledge.content}
                      </Text>
                    )}
                  </div>
                )}
              </Form.Item>
            </Card>
          </div>

          {/* 右侧 - 元信息 */}
          <div className="content-sidebar">
            <Card title="元信息" className="metadata-card">
              <Descriptions column={1} bordered size="small">
                <Item label="创建时间">
                  <Space>
                    <CalendarOutlined />
                    {formatDate(knowledge.createdAt)}
                  </Space>
                </Item>
                <Item label="更新时间">
                  <Space>
                    <CalendarOutlined />
                    {formatDate(knowledge.updatedAt)}
                  </Space>
                </Item>
                <Item label="类型">
                  <Tag color={knowledge.type === 'url' ? 'blue' : 'green'}>
                    {knowledge.type === 'url' ? 'URL' : '文本'}
                  </Tag>
                </Item>
                
                {/* 可编辑的元数据 */}
                {/*<Form.Item name={['metadata', 'author']} noStyle>
                  <Item label="作者">
                    {editing ? (
                      <Input placeholder="请输入作者" />
                    ) : (
                      <Text>{knowledge.metadata?.author || '未设置'}</Text>
                    )}
                  </Item>
                </Form.Item>*/}

                <Form.Item name={['metadata', 'category']} noStyle>
                  <Item label="分类">
                    {editing ? (
                      <Input placeholder="请输入分类" />
                    ) : (
                      <Text>{knowledge.metadata?.category || '未分类'}</Text>
                    )}
                  </Item>
                </Form.Item>

                {/*<Form.Item name={['metadata', 'source']} noStyle>
                  <Item label="来源">
                    {editing ? (
                      <Input placeholder="请输入来源" />
                    ) : (
                      <Text>{knowledge.metadata?.source || '未知'}</Text>
                    )}
                  </Item>
                </Form.Item>*/}

                <Item label="标签">
                  {editing ? (
                    <Form.Item name={['metadata', 'tags']} noStyle>
                      <Input placeholder="请输入标签，用逗号分隔" />
                    </Form.Item>
                  ) : (
                    <div>
                      {knowledge.containerTags?.map((tag, index) => (
                        <Tag key={index} color="geekblue" style={{ marginBottom: 4 }}>
                          {tag}
                        </Tag>
                      )) || <Text type="secondary">{knowledge.metadata?.category}</Text>}
                    </div>
                  )}
                </Item>
              </Descriptions>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default DetailPage;
