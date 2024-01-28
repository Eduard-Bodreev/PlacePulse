import React, { useEffect, useState } from 'react';
import { getUser, updateUser, getPublicProfiles, sendFriendRequest, cancelFriendRequest, removeFriend, acceptFriendRequest } from '../../utils/api';
import { Popup } from '../ui/popup/popup';
import styles from './user-profile.module.css';


export const UserProfile = () => {

    const [publicUsers, setPublicUsers] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [pendingFriends, setPendingFriends] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);



    const [user, setUser] = useState({ username: '', email: '', bio: '', isPublic: false });
    const [editedUser, setEditedUser] = useState({ email: '', bio: '', isPublic: false });
    const [showPopup, setShowPopup] = useState(false);
    const hasChanges = user.email !== editedUser.email || user.bio !== editedUser.bio || user.isPublic !== editedUser.isPublic;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
        try {
            if (isMounted) {
            const userData = await getUser();
            if (userData && userData.outgoing_requests) {
                setPendingFriends(userData.outgoing_requests.split(',').filter(Boolean));
              }
            if (userData && userData.incoming_requests) {
                setIncomingRequests(userData.incoming_requests.split(',').filter(Boolean).map(Number));
            }
            if (userData && userData.user_id) {
                setCurrentUserId(userData.user_id);
                const newData = {
                    username: userData.username,
                    email: userData.email || '',
                    bio: userData.bio || '',
                    isPublic: userData.is_visible_for_other_users || false,
                    friends: userData.friends || ''
                };
                setUser(newData);
                setEditedUser(newData);
            }

            const publicProfilesData = await getPublicProfiles();
            setPublicUsers(publicProfilesData);
        }
        } catch (error) {
            console.error("Ошибка при получении данных:", error);
        }
    };

    fetchData();
    return () => {
        isMounted = false;
      };
}, []);

    const isUserInFriendsOrRequests = (userId) => {
        return (
        pendingFriends.includes(userId.toString()) ||
        incomingRequests.includes(userId)
        );
    };

  const getAvatarColor = (username) => {
    if (!username) return 'hsl(0, 0%, 90%)';
  
    const charCode = username.toUpperCase().charCodeAt(0);
    const hue = (charCode * 137) % 360;
    return `hsl(${hue}, 50%, 50%)`;
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setEditedUser({ ...editedUser, isPublic: checked });
  };

  const handleUpdateUser = () => {
    if (hasChanges) {
      setShowPopup(true);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const response = await sendFriendRequest(userId);
      console.log("Запрос на добавление в друзья успешно отправлен:", response);
      setPendingFriends((prev) => [...prev, userId.toString()]);
      // Обновление UI или состояния компонента
    } catch (error) {
      console.error("Ошибка при отправке запроса на добавление в друзья:", error);
    }
  };

  const handleCancelFriendRequest = async (userId) => {
    try {
      const response = await cancelFriendRequest(userId);
      console.log("Запрос на отмену дружбы успешно отменен:", response);
      setPendingFriends((prev) => prev.filter((user_id) => user_id !== userId.toString()));
      // Обновление UI или состояния компонента после отмены запроса
    } catch (error) {
      console.error("Ошибка при отмене запроса на дружбу:", error);
    }
  };
  
  const handleRemoveFriend = async (userId) => {
    try {
      const response = await removeFriend(userId);
      console.log("Удаление друга успешно:", response);
  
      setUser((prevUser) => ({
        ...prevUser,
        friends: prevUser.friends
          .split(',')
          .filter((friendId) => friendId !== userId.toString())
          .join(','),
      }));
    } catch (error) {
      console.error("Ошибка при удалении друга:", error);
    }
  };

  const renderPublicUsers = publicUsers.map((user) => {
    const isPending = pendingFriends.includes(user.user_id.toString());
    if (user.user_id === currentUserId || isUserInFriendsOrRequests(user.user_id)) {
        return null;
      }
    return (
      <div key={user.user_id} className={styles.publicUserItem}>
        <div className={styles.publicUserAvatar} style={{ backgroundColor: getAvatarColor(user.username) }}>
          {user.username[0]?.toUpperCase()}
        </div>
        <span className={styles.userName}>{user.username}</span>
        <div
          className={`${styles.addFriendIcon} ${isPending ? styles.pending : ''}`}
          onClick={() => isPending ? handleCancelFriendRequest(user.user_id) : handleAddFriend(user.user_id)}
          title={isPending ? "Отменить запрос" : "Добавить в друзья"}
        >
          {isPending ? "-" : "+"}
        </div>
      </div>
    );
  });

  const renderIncomingRequests = () => {
    if (!incomingRequests.length) {
      return <div className={styles.noContentMessage}>Нет входящих заявок</div>;
    }
  
    return incomingRequests.map(requestId => {
      const requestUser = publicUsers.find(user => user.user_id === requestId);
      if (!requestUser) {
        return null;
      }
  
      return (
        <div key={requestId} className={styles.incomingRequestItem}>
          <div className={styles.userAvatar} style={{ backgroundColor: getAvatarColor(requestUser.username) }}>
            {requestUser.username[0]?.toUpperCase()}
          </div>
          <span className={styles.userName}>{requestUser.username}</span>
          <div className={styles.BtnsPending}>
            {}
            <button className={styles.acceptButton} onClick={() => handleAcceptFriendRequest(requestUser.user_id)}>+</button>
            <button className={styles.declineButton} onClick={() => console.log("Отклонить", requestId)}>-</button>
          </div>
        </div>
      );
    });
  };
  
  const handleAcceptFriendRequest = async (userId) => {
    try {
      const response = await acceptFriendRequest(userId);
      console.log("Заявка в друзья успешно принята:", response);
      setIncomingRequests((prevRequests) => prevRequests.filter((id) => id !== userId));
      // Добавляем ID пользователя в список друзей
      setUser((prevUser) => ({
        ...prevUser,
        friends: prevUser.friends ? `${prevUser.friends},${userId}` : `${userId}`,
      }));
    } catch (error) {
      console.error("Ошибка при принятии заявки в друзья:", error);
    }
  };
  
  

  const handleConfirm = () => {
    const updatedData = {};
    if (user.email !== editedUser.email) {
      updatedData.email = editedUser.email;
    }
    if (user.bio !== editedUser.bio) {
      updatedData.bio = editedUser.bio;
    }
    if (user.isPublic !== editedUser.isPublic) {
      updatedData.is_visible_for_other_users = editedUser.isPublic;
    }
  
    if (Object.keys(updatedData).length > 0) {
      updateUser(updatedData)
        .then(() => {
          setShowPopup(false);
          setUser(prev => ({ ...prev, ...updatedData, isPublic: updatedData.is_visible_for_other_users ?? prev.isPublic }));
        })
        .catch(error => {
          console.error("Ошибка при обновлении данных пользователя:", error);
        });
    } else {
      setShowPopup(false);
    }
  };


  const handleCancel = () => {
    setShowPopup(false);
  };

  

  const getUpdatedDataForPopup = () => {
    const updatedData = {};
    if (user.email !== editedUser.email) {
      updatedData.email = editedUser.email;
    }
    if (user.bio !== editedUser.bio) {
      updatedData.bio = editedUser.bio;
    }
    if (user.isPublic !== editedUser.isPublic) {
        updatedData.isPublic = editedUser.isPublic;
      }
    return updatedData;
  };

  const renderFriends = () => {
    if (!user.friends) {
      return <div className={styles.noContentMessage}>У вас пока нет друзей</div>;
    }
  
    const friendIds = user.friends.split(',').map(Number).filter(Boolean);
    const friendsList = publicUsers.filter((publicUser) =>
      friendIds.includes(publicUser.user_id)
    );
  
    if (friendsList.length === 0) {
      return <div className={styles.noContentMessage}>У вас пока нет друзей</div>;
    }
  
    return friendsList.map((friend) => (
      <div key={friend.user_id} className={styles.publicUserItem}>
        <div
          className={styles.publicUserAvatar}
          style={{ backgroundColor: getAvatarColor(friend.username) }}
        >
          {friend.username[0]?.toUpperCase()}
        </div>
        <span className={styles.userName}>{friend.username}</span>
        <div
          className={`${styles.declineButton} ${styles.removeFriendButton}`}
          onClick={() => handleRemoveFriend(friend.user_id)} // Обработка клика на кнопку удаления друга
          title="Удалить из друзей"
        >
          {}
          -
        </div>
      </div>
    ));
  };
  const updatedDataForPopup = getUpdatedDataForPopup();

  return (
    <div className={styles.userProfile}>
      <div className={styles.avatar} style={{ backgroundColor: getAvatarColor(user?.username) }}>
  {user?.username[0]?.toUpperCase()}
</div>
<div className={styles.userInfo}>
        <h2>{user.username}</h2>
      </div>
<div className={styles.userInfo}>
      <label htmlFor="username" className={styles.label}>Имя пользователя:</label>
      <input
        id="username"
        className={`${styles.input} ${styles.nonSelectableInput}`}
        type="text"
        value={user.username}
        readOnly
        placeholder="Имя пользователя"
      />

      <label htmlFor="email" className={styles.label}>Почта:</label>
      <input
        id="email"
        className={styles.input}
        type="email"
        name="email"
        value={editedUser.email}
        onChange={handleInputChange}
        placeholder="Поделитесь своей почтой"
      />

      <label htmlFor="bio" className={styles.label}>О себе:</label>
      <textarea
        id="bio"
        className={`${styles.input} ${styles.textarea}`}
        name="bio"
        value={editedUser.bio}
        onChange={handleInputChange}
        placeholder="Расскажите о себе"
      />
      
    <p className="checkbox"><label htmlFor="isPublic" className={styles.label} title="Разрешение другим пользователям находить вас в поиске и отправлять заявки в друзья">Сделать профиль публичным</label>
      <input
        id="isPublic"
        type="checkbox"
        checked={editedUser.isPublic}
        onChange={handleCheckboxChange}
      /></p>
    <button
    className={`${styles.buttonChange} ${!hasChanges ? styles.disabled : ''}`}
    onClick={handleUpdateUser}
    disabled={!hasChanges}
  >
    Изменить
  </button>
  <div className={styles.sectionContainer}>
  <div className={styles.friendsSection}>
  <h3>Друзья</h3>
  {renderFriends()}
</div>




  <div className={styles.publicUsers}>
    <h3>Поиск</h3>
    {renderPublicUsers}
  </div>

  <div className={styles.incomingRequests}>
  <h3>Входящие заявки</h3>
  {renderIncomingRequests()}
</div>

</div>

    </div>

    <Popup
      isVisible={showPopup}
      data={updatedDataForPopup}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  </div>
);
};
