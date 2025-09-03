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
  const form = Form.useFormInstance(); // 拿到外层 Form 的实例

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

    recognition.onstart = () => console.log("Voice recognition started");
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('onresult');
      try {
        console.log(event);
        const transcript = event.results[0][0].transcript;
        const current = form.getFieldValue(name) || "";
        form.setFieldsValue({
          [name]: current + transcript,
        });
      } catch (e) {
        console.error('语音识别结果处理失败', e);
      }
    };

    recognition.onend = () => {
      console.log("Voice recognition ended");
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
    <Form.Item label={label}>
      <div style={{ position: "relative", width: "100%" }}>
        {/* 真正绑定字段 */}
        <Form.Item name={name} noStyle>
          <TextArea
            rows={rows}
            placeholder={placeholder}
            style={{ paddingRight: 60 }} // 给按钮留出空间
          />
        </Form.Item>

        {/* 浮动按钮 */}
        <Button
          onClick={handleVoiceClick}
          type={listening ? "primary" : "default"}
          danger={listening}
          size="small"
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            zIndex: 10,
            color: "gray",
          }}
        >
          {listening ? "🎙️ 录音中" : "🎤 语音输入"}
        </Button>
      </div>
    </Form.Item>
  );
};

export default SpeechTextArea;
