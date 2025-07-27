import { useState } from 'react';
import Modal from 'antd/es/modal';
import Input from 'antd/es/input';
import { toast } from 'react-toastify';
import { CodeApi } from '@/services/code';

interface InviteCodeProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (inviteCode: string) => void;
}

const InviteCodeModal: React.FC<InviteCodeProps> = ({ open, onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!inviteCode.trim()) {
      toast.error('请输入邀请码');
      return;
    }

    if (inviteCode.trim().length !== 6) {
      toast.error('邀请码必须为6位');
      return;
    }

    setLoading(true);
    try {
      const result = await CodeApi.codeUse(inviteCode.trim());
      if (result.success || result.valid) {
        toast.success('邀请码验证成功');
        onSuccess(inviteCode.trim());
        setInviteCode('');
        onClose();
      } else {
        toast.error(result.message || '邀请码无效');
      }
    } catch (error) {
      console.error('邀请码验证失败:', error);
      toast.error('邀请码验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setInviteCode('');
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ 
          textAlign: 'center', 
          fontSize: '18px', 
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px'
        }}>
          🔐 输入邀请码
        </div>
      }
      open={open}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText="确认使用"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnClose
      width={320}
      centered
      maskClosable={false}
      okButtonProps={{
        style: {
          background: '#1890ff',
          borderColor: '#1890ff',
          borderRadius: '6px',
          height: '36px',
          fontSize: '14px',
          fontWeight: '500'
        }
      }}
      cancelButtonProps={{
        style: {
          borderRadius: '6px',
          height: '36px',
          fontSize: '14px'
        }
      }}
      bodyStyle={{
        padding: '24px 24px 16px 24px'
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          marginBottom: '12px', 
          color: '#666', 
          fontSize: '14px',
          textAlign: 'center',
          lineHeight: '1.5',
          whiteSpace: 'nowrap'
        }}>
          请输入您获得的6位邀请码以继续使用
        </div>
        <Input
          placeholder="请输入6位邀请码"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          onPressEnter={handleConfirm}
          disabled={loading}
          size="large"
          style={{
            borderRadius: '8px',
            height: '48px',
            fontSize: '16px',
            textAlign: 'center',
            letterSpacing: '3px'
          }}
          maxLength={6}
          showCount={false}
        />
        {inviteCode && inviteCode.length > 0 && inviteCode.length !== 6 && (
          <div style={{ 
            color: '#ff4d4f', 
            fontSize: '12px', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            邀请码必须为6位
          </div>
        )}
      </div>
    </Modal>
  );
};

export default InviteCodeModal;
