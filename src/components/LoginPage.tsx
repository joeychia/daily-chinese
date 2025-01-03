import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const { signInWithGoogle, signInWithMicrosoft } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithMicrosoft();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign in with Microsoft:', error);
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>每日中文</h1>
        <p className={styles.subtitle}>登录以开始学习</p>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.buttons}>
          <button
            className={`${styles.loginButton} ${styles.google}`}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img 
              src="/google-logo.svg" 
              alt="Google" 
              className={styles.providerIcon}
            />
            使用 Google 账号登录
          </button>

          <button
            className={`${styles.loginButton} ${styles.microsoft}`}
            onClick={handleMicrosoftSignIn}
            disabled={loading}
          >
            <img 
              src="/microsoft-logo.svg" 
              alt="Microsoft" 
              className={styles.providerIcon}
            />
            使用 Microsoft 账号登录
          </button>
        </div>
      </div>
    </div>
  );
}; 