import React, { useState } from 'react';
import styles from './ArticleFeedbackPanel.module.css';
import { useAuth } from '../contexts/AuthContext';
import { saveArticleFeedback } from '../services/userDataService';
import { useNavigate } from 'react-router-dom';
import { articleService } from '../services/articleService';

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
  const navigate = useNavigate();
  const [selectedEnjoyment, setSelectedEnjoyment] = useState<number>(-1);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(-1);
  const [showActions, setShowActions] = useState(false);

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
      
      // Show post-feedback actions
      setShowActions(true);
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const handleReadMore = async () => {
    try {
      const articles = await articleService.getAllArticles();
      // Filter articles that are either public or owned by the user
      const accessibleArticles = articles.filter(article => 
        article.visibility === 'public' || article.visibility === user?.id
      );
      
      // Find current article index
      const currentIndex = accessibleArticles.findIndex(a => a.id === articleId);
      
      // Get next article (or wrap around to first)
      const nextArticle = accessibleArticles[currentIndex + 1] || accessibleArticles[0];
      
      if (nextArticle) {
        navigate(`/article/${nextArticle.id}`);
      } else {
        navigate('/articles');
      }
      onClose();
    } catch (error) {
      console.error('Error navigating to next article:', error);
    }
  };

  const handleCreateArticle = () => {
    navigate('/create-article');
    onClose();
  };

  if (showActions) {
    return (
      <>
        <div className={styles.overlay} onClick={onClose} />
        <div className={styles.panel}>
          <div className={styles.header}>
            <h2>感谢您的反馈！</h2>
            <button className={styles.closeButton} onClick={onClose}>✕</button>
          </div>
          <div className={styles.content}>
            <div className={styles.actionsPanel}>
              <button className={styles.actionButton} onClick={handleReadMore}>
                再读一篇
              </button>
              <button className={styles.actionButton} onClick={handleCreateArticle}>
                创建文章
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

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