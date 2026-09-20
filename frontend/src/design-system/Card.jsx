import React from 'react';
import styles from './Card.module.css';

export function Card({ title, subtitle, children, action }) {
  return (
    <div className={styles.card} role="region" aria-label={title}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
