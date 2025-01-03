import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      setError('Failed to sign in with Google');
      console.error('Google sign in error:', error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (error) {
      setError(isSignUp ? 'Failed to create account' : 'Failed to sign in');
      console.error('Email auth error:', error);
    }
  };

  if (user) {
    navigate('/');
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>{isSignUp ? '注册账号' : '登录'}</h1>
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="电子邮件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            {isSignUp ? '注册' : '登录'}
          </button>
        </form>

        <button onClick={handleGoogleSignIn} className={styles.googleButton}>
          使用Google账号登录
        </button>

        <p className={styles.toggle}>
          {isSignUp ? '已有账号？' : '没有账号？'}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className={styles.toggleButton}
          >
            {isSignUp ? '登录' : '注册'}
          </button>
        </p>
      </div>
    </div>
  );
}; 