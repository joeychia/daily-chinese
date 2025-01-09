import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserMenu } from './UserMenu';
import styles from './Menu.module.css';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Menu({ isOpen, onClose }: MenuProps) {
  return (
    <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
      <div className={styles.menuContent}>
        <div className={styles.header}>
          <div className={styles.logoSection}>
            <img src={`${import.meta.env.BASE_URL}rooster.png`} alt="Logo" className={styles.logo} />
            <h2>每日一读</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.authSection}>
          <UserMenu />
        </div>
        <nav>
          <Link to="/" onClick={onClose}>首页</Link>
          <Link to="/articles" onClick={onClose}>文章列表</Link>
          <Link to="/create" onClick={onClose}>创建文章</Link>
          <Link to="/wordbank" onClick={onClose}>生词本</Link>
          <Link to="/progress" onClick={onClose}>学习进度</Link>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSdjIDOY5gif53bOwFd53I_F6IpC40CQl3AE4ROuxiAcfW4Y-g/viewform?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
          >
            反馈
          </a>
        </nav>
      </div>
      <div className={styles.overlay} onClick={onClose}></div>
    </div>
  );
} 