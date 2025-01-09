import React from 'react';
import styles from './ArticleFeedbackPanel.module.css';

interface ArticleFeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: { enjoyment: number; difficulty: number }) => void;
}

export const ArticleFeedbackPanel: React.FC<ArticleFeedbackPanelProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  if (!isOpen) return null;

  const handleSubmit = (enjoyment: number, difficulty: number) => {
    onSubmit({ enjoyment, difficulty });
    onClose();
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>文章反馈</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <div className={styles.feedbackSection}>
            <h3>你喜欢这篇文章吗？</h3>
            <div className={styles.options}>
              <button onClick={() => handleSubmit(1, -1)}>
                😕<br/>一般
              </button>
              <button onClick={() => handleSubmit(2, -1)}>
                🙂<br/>不错
              </button>
              <button onClick={() => handleSubmit(3, -1)}>
                🤩<br/>很棒
              </button>
            </div>
          </div>

          <div className={styles.feedbackSection}>
            <h3>这篇文章的难度如何？</h3>
            <div className={styles.options}>
              <button onClick={() => handleSubmit(-1, 1)}>
                🌱<br/>简单
              </button>
              <button onClick={() => handleSubmit(-1, 2)}>
                🌿<br/>适中
              </button>
              <button onClick={() => handleSubmit(-1, 3)}>
                🌳<br/>困难
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 