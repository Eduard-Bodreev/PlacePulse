import React, { useEffect } from 'react';
import styles from './main-page.module.css';
import { createReview, getUserReviews, deleteReview, updateReview, getFriendsReviews } from '../../utils/api';

export const MainPage = () => {
  let myMap = null; // Объявление myMap на уровне компонента

  useEffect(() => {
    const initMap = () => {
      myMap = new window.ymaps.Map('map', { // Инициализация myMap
        center: [55.76, 37.64],
        zoom: 12,
        controls: ['zoomControl']
      });

      let currentPlacemark = null;

      myMap.events.add('click', function (e) {
        if (currentPlacemark && !currentPlacemark.properties.get('saved')) {
          myMap.geoObjects.remove(currentPlacemark);
        }

        var coords = e.get('coords');
        currentPlacemark = new window.ymaps.Placemark(coords, {
          balloonContentHeader: '', // Здесь будет рейтинг
          balloonContentBody: createBalloonContent() // Здесь будет комментарий
        }, {
          draggable: true,
          openBalloonOnClick: true
        });

        window.currentPlacemark = currentPlacemark;
        myMap.geoObjects.add(currentPlacemark);
        currentPlacemark.balloon.open();
      });
    };

    const loadUserReviews = async () => {
      try {
        // Запрос отзывов пользователя
        const userReviewsPromise = getUserReviews();
        // Запрос отзывов друзей пользователя
        const friendsReviewsPromise = getFriendsReviews();
    
        // Ожидание завершения обоих запросов
        const [userReviews, friendsReviews] = await Promise.all([userReviewsPromise, friendsReviewsPromise]);
    
        // Функция для добавления отзывов на карту
        const addReviewsToMap = (reviews, isFriendReview = false) => {
          reviews.forEach(review => {
            const starStyle = 'cursor: default; font-size: 50px; color: yellow;';
            let stars = '<div class="stars" style="margin-bottom: 15px; font-size: 80px;">';
            for (let i = 0; i < review.score; i++) {
              stars += `<span class="star" style="${starStyle}">★</span>`;
            }
            stars += '</div>';
    
            let balloonContent = 
              `<div style="margin-top: 20px; overflow-wrap: break-word; max-height: 120px; overflow-y: auto; font-weight: 100; font-size: 15px; max-width: 250px;">${review.text}</div>`;
            if (isFriendReview) {
              balloonContent = `<strong>Друг: ${review.author}</strong><br>` + balloonContent;
            }
            const placemark = new window.ymaps.Placemark([review.latitude, review.longitude], {
              balloonContentHeader: stars,
              balloonContentBody: balloonContent,
            });
    
            myMap.geoObjects.add(placemark);
          });
        };
    
        // Добавление отзывов пользователя и друзей на карту
        addReviewsToMap(userReviews);
        addReviewsToMap(friendsReviews, true); // true указывает, что это отзывы друзей
      } catch (error) {
        console.error("Ошибка при загрузке отзывов", error);
      }
    };
    

    function createBalloonContent(review = null) {
      const starStyle = 'cursor: pointer; font-size: 55px; color: yellow;';
      let stars = '<div class="stars" style="margin-bottom: 15px; font-size: 80px;">';
      let input, button;
      if (review) {
        // Загруженный отзыв
        for (let i = 0; i < 5; i++) {
          stars += `<span class="star" style="${starStyle}">${i < review.score ? '★' : '☆'}</span>`;
        }
        input = `<div style="margin-top: 20px; overflow-wrap: break-word; max-height: 120px; overflow-y: auto; font-weight: 100; font-size: 15px; max-width: 250px;">${review.text}</div>`;
        button = '<div style="text-align: right; display: inline-block; margin-left: 10px;"><button onclick="window.editBalloon()">Редактировать</button></div>';
      } else {
        // Новый отзыв
        for (let i = 0; i < 5; i++) {
          stars += `<span class="star" style="${starStyle}" onclick="window.rate(${i + 1}, this)">☆</span>`;
        }
        input = '<textarea id="comment" placeholder="Введите текст отзыва до 500 символов" style="width: calc(100% - 15px); height: 70px; margin-bottom: 10px; white-space: pre-wrap; vertical-align: top; resize: none;"></textarea>'; 
        button = '<div style="text-align: right;"><button onclick="window.saveBalloonContent()">Сохранить</button></div>';
      }
      stars += '</div>';
      const balloonStyle = 'width: 300px; height: auto; overflow: hidden;';
      return `<div style="${balloonStyle}">${stars + input + button}</div>`;
    }
    
    window.rate = function (rate, clickedStar) {
      var stars = clickedStar.parentNode.querySelectorAll('.star');
      stars.forEach((star, i) => {
        star.innerHTML = i < rate ? '★' : '☆';
      });
      window.currentRating = rate;
    }

    window.updateReview = function () {
      var commentElement = document.getElementById('comment');
      if (commentElement && window.currentRating) {
        var comment = commentElement.value;
        var currentPlacemark = window.currentPlacemark;
        var coords = window.currentPlacemark.geometry.getCoordinates();
        const reviewId = currentPlacemark.properties.get('reviewId');
        // Подготовка данных для отправки
        const reviewData = {
          text: comment,
          score: window.currentRating,
          latitude: coords[0],
          longitude: coords[1],
        };
    
        // Отправка данных на сервер
        updateReview(reviewId, reviewData).then(response => {
          console.log("Отзыв сохранен");
          const reviewId = response.id;
    
          // Обновление свойств метки после успешного сохранения
          const starStyle = 'cursor: default; font-size: 50px; color: yellow;';
          var stars = '<div class="stars" style="margin-bottom: 15px; font-size: 80px;">';
          for (let i = 0; i < window.currentRating; i++) {
            stars += `<span class="star" style="${starStyle}">★</span>`;
          }
          currentPlacemark.properties.set('reviewId', reviewId);
    
          var balloonContent = 
            '<div style="margin-top: 20px; overflow-wrap: break-word; max-height: 120px; overflow-y: auto; font-weight: 100; font-size: 15px; max-width: 250px;">' + comment + '</div>';
          var deleteButton = '<div style="text-align: left; display: inline-block;"><button onclick="window.deleteBalloon(window.currentPlacemark)">Удалить</button></div>';
          var editButton = '<div style="text-align: right; display: inline-block; margin-left: 10px;"><button onclick="window.editBalloon(window.currentPlacemark)">Редактировать</button></div>';
          var balloonStyle = 'width: 300px; height: auto; overflow: hidden;';
          currentPlacemark.properties.set({
            'balloonContentHeader': stars,
            'balloonContentBody': `<div style="${balloonStyle}">${balloonContent + deleteButton + editButton}</div>`,
            'saved': true,
            'comment': comment,
            'rating': window.currentRating
          });
          currentPlacemark.balloon.open();
    
        }).catch(error => {
          console.error("Ошибка сохранения отзыва", error);
        });
      } else {
        console.error("Требуется комментарий и рейтинг для сохранения отзыва");
      }
    }

    window.saveBalloonContent = function () {
      var commentElement = document.getElementById('comment');
      if (commentElement && window.currentRating) {
        var comment = commentElement.value;
        var currentPlacemark = window.currentPlacemark;
        var coords = window.currentPlacemark.geometry.getCoordinates();
    
        // Подготовка данных для отправки
        const reviewData = {
          text: comment,
          score: window.currentRating,
          latitude: coords[0],
          longitude: coords[1],
        };
    
        // Отправка данных на сервер
        createReview(reviewData).then(response => {
          console.log("Отзыв сохранен");
          const reviewId = response.id;
    
          // Обновление свойств метки после успешного сохранения
          const starStyle = 'cursor: default; font-size: 50px; color: yellow;';
          var stars = '<div class="stars" style="margin-bottom: 15px; font-size: 80px;">';
          for (let i = 0; i < window.currentRating; i++) {
            stars += `<span class="star" style="${starStyle}">★</span>`;
          }
          currentPlacemark.properties.set('reviewId', reviewId);
    
          var balloonContent = 
            '<div style="margin-top: 20px; overflow-wrap: break-word; max-height: 120px; overflow-y: auto; font-weight: 100; font-size: 15px; max-width: 250px;">' + comment + '</div>';
          var deleteButton = '<div style="text-align: left; display: inline-block;"><button onclick="window.deleteBalloon(window.currentPlacemark)">Удалить</button></div>';
          var editButton = '<div style="text-align: right; display: inline-block; margin-left: 10px;"><button onclick="window.editBalloon(window.currentPlacemark)">Редактировать</button></div>';
          var balloonStyle = 'width: 300px; height: auto; overflow: hidden;';
          currentPlacemark.properties.set({
            'balloonContentHeader': stars,
            'balloonContentBody': `<div style="${balloonStyle}">${balloonContent + deleteButton + editButton}</div>`,
            'saved': true,
            'comment': comment,
            'rating': window.currentRating
          });
          currentPlacemark.balloon.open();
    
        }).catch(error => {
          console.error("Ошибка сохранения отзыва", error);
        });
      } else {
        console.error("Требуется комментарий и рейтинг для сохранения отзыва");
      }
    }
    

    window.deleteBalloon = function (currentPlacemark) {
      if (currentPlacemark) {
        const reviewId = currentPlacemark.properties.get('reviewId');
        if (reviewId) {
          deleteReview(reviewId) // Функция для удаления отзыва с сервера
            .then(() => {
              var myMap = currentPlacemark.getMap();
              myMap.geoObjects.remove(currentPlacemark);
              console.log("Отзыв удален");
            })
            .catch(error => {
              console.error("Ошибка при удалении отзыва", error);
            });
        } else {
          console.error("ID отзыва не найден");
        }
      }
    }
    

    window.editBalloon = function (currentPlacemark) {
      if (currentPlacemark) {
        const starStyle = 'cursor: pointer; font-size: 50px; color: yellow;';
        var stars = '<div class="stars" style="margin-bottom: 15px; font-size: 80px;">';
        for (let i = 0; i < 5; i++) {
          stars += `<span class="star" style="${starStyle}" onclick="window.rate(${i + 1}, this)">${i < currentPlacemark.properties.get('rating') ? '★' : '☆'}</span>`;
        }
        stars += '</div>';
        var input = `<textarea id="comment" placeholder="Введите текст отзыва до 500 символов" ` +
                    `style="width: calc(100% - 15px); height: 70px; margin-bottom: 10px; ` +
                    `white-space: pre-wrap; vertical-align: top; resize: none;">${currentPlacemark.properties.get('comment') || ''}</textarea>`;
        var editButton = '<div style="text-align: right; margin-top: 10px;"><button onclick="window.updateReview()">Отредактировать</button></div>';
        var balloonStyle = 'width: 300px; height: auto; overflow: hidden;';
        currentPlacemark.properties.set({
          'balloonContentHeader': stars,
          'balloonContentBody': `<div style="${balloonStyle}">${input + editButton}</div>`
        });
        currentPlacemark.balloon.open();
      }
    }
    
    
    
    

    if (window.ymaps) {
      window.ymaps.ready(() => {
        initMap();
        loadUserReviews();
      });
    }
  }, []);

  return (
    <section className={styles.content}>
      <h2 className={`text text_type_h2 text_color_primary mt-25 mb-20 ${styles.title}`}>
        Замечательная карта
      </h2>
<div id="map" style={{ width: '900px', height: '600px' }}></div>

      <div id="map" style={{ width: '900px', height: '600px' }}></div>
    </section>
  );
};
