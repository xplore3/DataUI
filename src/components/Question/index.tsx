import './index.less';
import React, { useState } from 'react';
//import { toast } from 'react-toastify';


export interface QuestionItem {
  id: string;
  type: 'single' | 'multiple' | 'text';
  question: string;
  options?: string[];
  answer?: string;
}

interface DynamicFormProps {
  questions: QuestionItem[];
  hasSubmit: boolean;
  onSubmit: (answers: Record<string, string | string[]>) => void;
}

const QuestionForm: React.FC<DynamicFormProps> = ({ questions, hasSubmit, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <form className="question-container" onSubmit={handleSubmit}>
      <ul className="question-list">
        {questions.map((q) => (
          <li key={q.id} className="question-item">
            <div className="question-title">{q.question}</div>
            {q.type === 'single' && q.options && (
              <div className="question-options">
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
              <div className="question-options">
                {q.options.map((opt) => (
                  <label key={opt} className="question-option">
                    <input
                      type="checkbox"
                      name={`${q.id}-${opt}`}
                      value={opt}
                      checked={Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt)}
                      onChange={(e) => handleOptionChange(q.id, opt, e.target.checked)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'text' && (
              <input
                className="question-input"
                type="text"
                value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}
          </li>
        ))}
      </ul>
      <button type="submit" className={hasSubmit ? "question-submit-disabled" : "question-submit"} disabled={hasSubmit}>
        提交
      </button>
    </form>
  );
};

export default QuestionForm;
