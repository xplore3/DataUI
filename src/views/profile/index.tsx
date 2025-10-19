import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Form,
  Input,
  Upload,
  List,
  message,
  Modal,
  Space,
  Typography,
  Progress,
  Tag
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FileOutlined,
  EditOutlined
} from '@ant-design/icons';
import './index.less';
import { ProfileApi } from '@/services/profile';

const { Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { confirm } = Modal;

// 类型定义
interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  type: string;
  createTime: string;
  updateTime: string;
}

interface FileItem {
  id: string | number;
  name: string;
  size: number;
  type: string;
  uploadTime: string;
  url: string;
}

interface UploadProgress {
  [key: string]: number;
}

interface UploadOptions {
  file: File;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
}

const ProfilePage = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  // 加载知识库数据
  const loadKnowledgeData = async () => {
    setLoading(true);
    try {
      const knowledgeRes = await ProfileApi.list();
      // 确保数据格式正确
      const formattedData = Array.isArray(knowledgeRes) 
        ? knowledgeRes.map((item: any) => ({
            id: item.id || Date.now() + Math.random(),
            title: item.title || '无标题',
            content: item.content || item.text || '',
            type: item.type || 'text',
            createTime: item.createTime || new Date().toISOString(),
            updateTime: item.updateTime || new Date().toISOString()
          }))
        : [];
      
      setKnowledgeItems(formattedData);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeData();
  }, []);

  // 添加文本知识
  const addTextKnowledge = async (values: { title: string; content: string }) => {
    try {
      const newItem: KnowledgeItem = {
        id: Date.now(),
        title: values.title,
        content: values.content,
        type: 'text',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };

      await ProfileApi.add(values.content);
      
      setKnowledgeItems(prev => [newItem, ...prev]);
      form.resetFields();
      message.success('知识添加成功');
    } catch (error) {
      console.error('添加知识失败:', error);
      message.error('添加知识失败');
    }
  };

  // 文件上传处理
  const handleFileUpload = async (options: UploadOptions) => {
    const { file, onSuccess, onError } = options;
    
    setUploading(true);
    setUploadProgress(prev => ({
      ...prev,
      [file.uid]: 0
    }));

    try {
      const response = await ProfileApi.uploadFile([file]);

      const newFile: FileItem = {
        id: response.data?.fileId || Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toISOString(),
        url: response.data?.url || URL.createObjectURL(file)
      };

      setFiles(prev => [newFile, ...prev]);
      onSuccess(response.data);
      message.success(`${file.name} 上传成功`);
    } catch (error) {
      console.error('文件上传失败:', error);
      onError(error);
      message.error(`${file.name} 上传失败`);
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.uid];
        return newProgress;
      });
    }
  };

  // 删除文件
  const deleteFile = (file: FileItem) => {
    confirm({
      title: '确认删除',
      content: `确定要删除文件 "${file.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          setFiles(prev => prev.filter(f => f.id !== file.id));
          message.success('文件删除成功');
        } catch (error) {
          console.error('删除文件失败:', error);
          message.error('文件删除失败');
        }
      },
    });
  };

  // 删除知识项
  const deleteKnowledgeItem = (item: KnowledgeItem) => {
    confirm({
      title: '确认删除',
      content: `确定要删除知识 "${item.title}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          setKnowledgeItems(prev => prev.filter(k => k.id !== item.id));
          message.success('知识删除成功');
        } catch (error) {
          console.error('删除知识失败:', error);
          message.error('知识删除失败');
        }
      },
    });
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return '未知时间';
    }
  };

  const uploadProps = {
    customRequest: handleFileUpload,
    multiple: true,
    showUploadList: false,
    beforeUpload: (file: File) => {
      // 文件大小限制 - 100MB
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('文件大小不能超过100MB');
        return false;
      }
      return true;
    },
  };

  return (
    <Layout className="knowledge-base-layout">
      <Layout>
        <Content className="knowledge-base-content">
          <div className="knowledge-base-container">
            {/* 头部标题 */}
            <div className="page-header">
              <Title level={2}>知识库管理</Title>
              <Text type="secondary">管理您的文本知识和文件资料</Text>
            </div>

            <div className="content-grid">
              {/* 左侧 - 添加知识和上传文件 */}
              <div className="left-panel">
                {/* 添加文本知识卡片 */}
                <Card 
                  title="添加文本知识" 
                  className="add-knowledge-card"
                  bordered={false}
                >
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={addTextKnowledge}
                  >
                    <Form.Item
                      name="title"
                      label="知识标题"
                      rules={[
                        { required: true, message: '请输入知识标题' },
                        { max: 100, message: '标题不能超过100个字符' }
                      ]}
                    >
                      <Input 
                        placeholder="请输入知识标题" 
                        maxLength={100}
                        showCount
                      />
                    </Form.Item>

                    <Form.Item
                      name="content"
                      label="知识内容"
                      rules={[
                        { required: true, message: '请输入知识内容' },
                        { max: 5000, message: '内容不能超过5000个字符' }
                      ]}
                    >
                      <TextArea
                        placeholder="请输入详细的知识内容"
                        rows={6}
                        maxLength={5000}
                        showCount
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        icon={<PlusOutlined />}
                        block
                        size="large"
                      >
                        添加知识
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>

                {/* 文件上传卡片 */}
                <Card 
                  title="上传文件" 
                  className="upload-card"
                  bordered={false}
                >
                  <Upload.Dragger {...uploadProps}>
                    <div className="upload-area">
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                      </p>
                      <p className="ant-upload-text">
                        点击或拖拽文件到此区域上传
                      </p>
                      <p className="ant-upload-hint">
                        支持单个或批量上传，文件大小不超过100MB
                      </p>
                    </div>
                  </Upload.Dragger>

                  {/* 上传进度显示 */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="upload-progress-list">
                      {Object.entries(uploadProgress).map(([fileUid, progress]) => (
                        <div key={fileUid} className="upload-progress-item">
                          <Text>{fileUid}</Text>
                          <Progress 
                            percent={progress} 
                            size="small" 
                            status={progress === 100 ? 'success' : 'active'}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* 右侧 - 知识库列表和文件列表 */}
              <div className="right-panel">
                {/* 知识库列表 */}
                <Card 
                  title={
                    <Space>
                      <FileTextOutlined />
                      知识库列表
                      <Tag color="blue">{knowledgeItems.length}</Tag>
                    </Space>
                  }
                  className="knowledge-list-card"
                  bordered={false}
                  loading={loading}
                >
                  <List
                    dataSource={knowledgeItems}
                    renderItem={(item: KnowledgeItem) => (
                      <List.Item
                        actions={[
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => deleteKnowledgeItem(item)}
                          >
                            删除
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<EditOutlined className="knowledge-icon" />}
                          title={item.title}
                          description={
                            <div>
                              <Text ellipsis={{ tooltip: item.content }}>
                                {item.content}
                              </Text>
                              <div className="item-meta">
                                <Text type="secondary" className="update-time">
                                  更新时间: {formatDate(item.updateTime)}
                                </Text>
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                    locale={{ emptyText: '暂无知识内容' }}
                  />
                </Card>

                {/* 文件列表 */}
                <Card 
                  title={
                    <Space>
                      <FileOutlined />
                      文件列表
                      <Tag color="green">{files.length}</Tag>
                    </Space>
                  }
                  className="file-list-card"
                  bordered={false}
                  loading={loading}
                >
                  <List
                    dataSource={files}
                    renderItem={(file: FileItem) => (
                      <List.Item
                        actions={[
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => deleteFile(file)}
                          >
                            删除
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<FileOutlined className="file-icon" />}
                          title={
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              {file.name}
                            </a>
                          }
                          description={
                            <div className="file-meta">
                              <Space size="middle">
                                <Text type="secondary">
                                  大小: {formatFileSize(file.size)}
                                </Text>
                                <Text type="secondary">
                                  上传时间: {formatDate(file.uploadTime)}
                                </Text>
                              </Space>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                    locale={{ emptyText: '暂无文件' }}
                  />
                </Card>
              </div>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProfilePage;
