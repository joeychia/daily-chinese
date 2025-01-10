import React, { useState } from 'react';
import styles from './ArticleFeedbackPanel.module.css';
import { useAuth } from '../contexts/AuthContext';
import { saveArticleFeedback } from '../services/userDataService';

interface ArticleFeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: { enjoyment: number; difficulty: number }) => void;
  articleId: string;
}

export const ArticleFeedbackPanel: React.FC<ArticleFeedbackPanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  articleId
}) => {
  const { user } = useAuth();
  const [selectedEnjoyment, setSelectedEnjoyment] = useState<number>(-1);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(-1);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user || selectedEnjoyment === -1 || selectedDifficulty === -1) return;

    try {
      // Save feedback to database
      await saveArticleFeedback(user.id, articleId, { 
        enjoyment: selectedEnjoyment, 
        difficulty: selectedDifficulty 
      });
      
      // Call the onSubmit callback
      onSubmit({ enjoyment: selectedEnjoyment, difficulty: selectedDifficulty });
      
      // Close the panel
      onClose();
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
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
              <button 
                onClick={() => setSelectedEnjoyment(3)}
                className={selectedEnjoyment === 3 ? styles.selected : ''}
              >
                <span className={styles.emoji}>😀</span>
                <br/>太棒了！
              </button>
              <button 
                onClick={() => setSelectedEnjoyment(2)}
                className={selectedEnjoyment === 2 ? styles.selected : ''}
              >
                <span className={styles.emoji}>😐</span>
                <br/>一般般
              </button>
              <button 
                onClick={() => setSelectedEnjoyment(1)}
                className={selectedEnjoyment === 1 ? styles.selected : ''}
              >
                <span className={styles.emoji}>🙁</span>
                <br/>不太好
              </button>
            </div>
          </div>

          <div className={styles.feedbackSection}>
            <h3>这篇文章的难度如何？</h3>
            <div className={styles.options}>
              <button 
                onClick={() => setSelectedDifficulty(1)}
                className={selectedDifficulty === 1 ? styles.selected : ''}
              >
                <span className={styles.emoji}>😊</span>
                <br/>很简单
              </button>
              <button 
                onClick={() => setSelectedDifficulty(2)}
                className={selectedDifficulty === 2 ? styles.selected : ''}
              >
                <span className={styles.emoji}>🤔</span>
                <br/>还可以
              </button>
              <button 
                onClick={() => setSelectedDifficulty(3)}
                className={selectedDifficulty === 3 ? styles.selected : ''}
              >
                <span className={styles.emoji}>😵‍💫</span>
                <br/>太难了
              </button>
            </div>
          </div>

          <div className={styles.submitSection}>
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={selectedEnjoyment === -1 || selectedDifficulty === -1}
            >
              提交反馈
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 