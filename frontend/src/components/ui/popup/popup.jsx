import React from 'react';
import styles from './popup.module.css';

export const Popup = ({ isVisible, data, onConfirm, onCancel }) => {
    if (!isVisible) return null;
  
    const formatKey = (key) => {
      switch (key) {
        case 'email': return 'Почта';
        case 'bio': return 'О себе';
        case 'isPublic': return 'Публичность профиля';
        default: return key;
      }
    };
  
    const formatDataValue = (key, value) => {
      if (key === 'isPublic') {
        return value ? <strong>Открыть</strong> : <strong>Закрыть</strong>;
      }
      if (!value) {
        return <strong>Вы удаляете эту информацию!</strong>;
      }
      return value;
    };
  
    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popup}>
          <h2>Вы уверены, что хотите сохранить эти данные?</h2>
          <div>
            {Object.keys(data).map(key => (
              <p key={key} className={styles.popupText}>
                {`${formatKey(key)}: `}
                {formatDataValue(key, data[key])}
              </p>
            ))}
          </div>
          <div className={styles.popupActions}>
            <button onClick={onCancel}>Отменить</button>
            <button onClick={onConfirm}>Сохранить</button>
          </div>
        </div>
      </div>
    );
  };
  