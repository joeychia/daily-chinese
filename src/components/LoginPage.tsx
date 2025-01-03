import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      setError('无法使用Google账号登录，请重试');
      console.error('Google sign in error:', error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setError('邮箱格式不正确');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('邮箱或密码错误');
      } else if (error.code === 'auth/weak-password') {
        setError('密码强度太弱，请使用至少6位字符');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('该邮箱已被注册');
      } else {
        setError(isSignUp ? '注册失败，请重试' : '登录失败，请重试');
      }
      console.error('Email auth error:', error);
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>每日一读</h1>
        <p className={styles.subtitle}>{isSignUp ? '创建新账号' : '欢迎回来'}</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form className={styles.form} onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="电子邮件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={`${styles.loginButton} ${styles.email}`}>
            {isSignUp ? '注册' : '登录'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>或</span>
        </div>

        <button onClick={handleGoogleSignIn} className={`${styles.loginButton} ${styles.google}`}>
          <img src="/google-logo.svg" alt="Google" className={styles.providerIcon} />
          使用Google账号{isSignUp ? '注册' : '登录'}
        </button>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className={styles.switchButton}
        >
          {isSignUp ? '已有账号？点击登录' : '没有账号？点击注册'}
        </button>
      </div>
    </div>
  );
}; 