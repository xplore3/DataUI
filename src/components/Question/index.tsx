import './index.less';
import React, { useState, useEffect } from 'react';
//import { toast } from 'react-toastify';


export interface QuestionItem {
  id: string;
  type: 'single' | 'multiple' | 'text';
  question: string;
  tips?: string;
  options?: string[];
  answer?: string;
}

interface DynamicFormProps {
  questions: QuestionItem[];
  hasSubmit: boolean;
  loading?: boolean;
  initialAnswers?: Record<string, string | string[]>;
  onSubmit: (answers: Record<string, string | string[]>) => void;
}

const QuestionForm: React.FC<DynamicFormProps> = ({ questions, hasSubmit, loading = false, initialAnswers = {}, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialAnswers);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  // 处理初始化自定义输入框的值
  useEffect(() => {
    const initialCustomInputs: Record<string, string> = {};
    Object.entries(initialAnswers).forEach(([questionId, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'string' && item.includes(': ')) {
            const [option, customValue] = item.split(': ', 2);
            if (option.includes('其他') || option.includes('自填')) {
              initialCustomInputs[`${questionId}-${option}`] = customValue;
            }
          }
        });
      }
    });
    setCustomInputs(initialCustomInputs);
  }, [initialAnswers]);

  const handleChange = (id: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleOptionChange = (id: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const prevArr = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const newArr = checked
        ? [...prevArr, option]
        : prevArr.filter((item) => item !== option);
      return { ...prev, [id]: newArr };
    });
    
    // 如果取消选择"其他"相关选项，清空对应的自定义输入
    if (!checked && (option.includes('其他') || option.includes('自填'))) {
      setCustomInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[`${id}-${option}`];
        return newInputs;
      });
    }
  };

  const handleCustomInputChange = (key: string, value: string) => {
    setCustomInputs((prev) => ({ ...prev, [key]: value }));
  };

  const isCustomOption = (option: string) => {
    return option.includes('其他') || option.includes('自填');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 合并answers和customInputs
    const finalAnswers = { ...answers };
    Object.entries(customInputs).forEach(([key, value]) => {
      if (value.trim()) {
        const [questionId, option] = key.split('-', 2);
        if (Array.isArray(finalAnswers[questionId])) {
          const answerArray = finalAnswers[questionId] as string[];
          const index = answerArray.findIndex(ans => ans === option);
          if (index !== -1) {
            answerArray[index] = `${option}: ${value}`;
          }
        }
      }
    });
    
    onSubmit(finalAnswers);
  };

  return (
    <form className="question-container" onSubmit={handleSubmit}>
      <ul className="question-list">
        {questions.map((q) => (
          <li key={q.id} className="question-item">
            <div className="question-title">{q.question}</div>
            {q.type === 'single' && q.options && (
              <div className="question-options question-options-single">
                {q.options.map((opt) => (
                  <label key={opt} className="question-option">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleChange(q.id, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'multiple' && q.options && (
              <div className="question-options question-options-multiple">
                {q.options.map((opt) => (
                  <div key={opt} >
                    <label className="question-option">
                      <input
                        type="checkbox"
                        name={`${q.id}-${opt}`}
                        value={opt}
                        checked={Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt)}
                        onChange={(e) => handleOptionChange(q.id, opt, e.target.checked)}
                      />
                      {opt}
                    </label>
                    {isCustomOption(opt) && Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt) && (
                      <textarea
                        className="question-custom-input"
                        placeholder="请输入具体内容"
                        value={customInputs[`${q.id}-${opt}`] || ''}
                        onChange={(e) => handleCustomInputChange(`${q.id}-${opt}`, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {q.type === 'text' && (
              <div className="question-sub-div">
                <span className="question-tips">{q.tips || ''}</span>
                <input
                  className="question-input"
                  type="text"
                  value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      <button 
        type="submit" 
        className={`${hasSubmit || loading ? "question-submit-disabled" : "question-submit"} ${loading ? "question-submit-loading" : ""}`}
        disabled={hasSubmit || loading}
      >
        {loading ? (
          <>
            <span className="loading-spinner"></span>
            <span>正在提交</span>
          </>
        ) : (
          '提交'
        )}
      </button>
    </form>
  );
};

export default QuestionForm;
