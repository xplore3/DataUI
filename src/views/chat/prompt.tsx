// PromptPin.tsx
import { useState, useEffect } from 'react';
import Modal from 'antd/es/modal';
import Input from 'antd/es/input';

const PromptPin = ({
  open,
  promptText,
  onClose,
}: {
  open: boolean;
  promptText: string;
  onClose: () => void;
}) => {
  const [pinPrompt, setPinPrompt] = useState(promptText || '');
  const [pinTitle, setPinTitle] = useState(promptText.slice(0, 6) || '');

  useEffect(() => {
    setPinPrompt(promptText || '');
    setPinTitle('');
  }, [promptText, open]);

  const handlePinSave = () => {
    const pinned = { title: pinTitle, prompt: pinPrompt };
    const pinnedList = JSON.parse(localStorage.getItem('PinnedPrompts') || '[]');
    pinnedList.push(pinned);
    localStorage.setItem('PinnedPrompts', JSON.stringify(pinnedList));
    onClose();
  };

  return (
    <Modal
      title="保存提示词为常用模板"
      open={open}
      onOk={handlePinSave}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ marginBottom: 12 }}>
        <div>Title</div>
        <Input
          value={pinTitle}
          onChange={e => setPinTitle(e.target.value)}
          placeholder="请输入标题"
        />
      </div>
      <div>
        <div>Prompt</div>
        <Input.TextArea
          value={pinPrompt}
          onChange={e => setPinPrompt(e.target.value)}
          placeholder="请输入Prompt内容"
          autoSize={{ minRows: 3 }}
        />
      </div>
    </Modal>
  );
};

export default PromptPin;