import React, { useRef, useState } from "react";
import { Form, Input, Button } from "antd";

const { TextArea } = Input;

// === 让 TS 认识浏览器的语音识别 API ===
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

interface SpeechTextAreaProps {
  name: string;
  label?: string;
  rows?: number;
  placeholder?: string;
}

const SpeechTextArea: React.FC<SpeechTextAreaProps> = ({
  name,
  label,
  rows = 4,
  placeholder = "点击右侧按钮语音输入...",
}) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [form] = Form.useFormInstance(); // 拿到外层 Form 的实例

  // 初始化语音识别
  if (
    !recognitionRef.current &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  ) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN"; // 改成 "en-US" 也行
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      const current = form.getFieldValue(name) || "";
      form.setFieldsValue({
        [name]: current + transcript,
      });
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
  }

  const handleVoiceClick = () => {
    if (recognitionRef.current) {
      if (!listening) {
        recognitionRef.current.start();
        setListening(true);
      } else {
        recognitionRef.current.stop();
        setListening(false);
      }
    } else {
      alert("当前浏览器不支持语音识别，请使用 Chrome/Edge 等。");
    }
  };

  return (
    <Form.Item name={name} label={label}>
      <div style={{ display: "flex", gap: "8px" }}>
        <TextArea rows={rows} placeholder={placeholder} />
        <Button
          type={listening ? "primary" : "default"}
          danger={listening}
          onClick={handleVoiceClick}
        >
          {listening ? "🎙️ 录音中" : "🎤 语音输入"}
        </Button>
      </div>
    </Form.Item>
  );
};

export default SpeechTextArea;
