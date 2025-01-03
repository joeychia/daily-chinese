import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to authenticate:', error);
      setError(isSignUp ? '注册失败，请重试' : '登录失败，请重试');
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

        <form onSubmit={handleEmailAuth} className={styles.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className={styles.input}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className={styles.input}
            required
          />
          <button
            type="submit"
            className={`${styles.loginButton} ${styles.email}`}
            disabled={loading}
          >
            {isSignUp ? '注册' : '登录'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>或</span>
        </div>

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
          className={styles.switchButton}
          onClick={() => setIsSignUp(!isSignUp)}
          type="button"
        >
          {isSignUp ? '已有账号？点击登录' : '没有账号？点击注册'}
        </button>
      </div>
    </div>
  );
}; 