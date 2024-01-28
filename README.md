### Описание
Проект PlacePulse — это платформа для написания отзывов на точки интереса, а так же возможность делиться ими с другими пользователями.


### Как запустить проект:

Клонировать репозиторий и перейти в него в командной строке:

```
git clone git@github.com:Vulkii/PlacePulse.git
```

```
cd backend
```

Cоздать и активировать виртуальное окружение:

```
py -m venv env
```

```
source venv/Scripts/Activate
```

Установить зависимости из файла requirements.txt:

```
pip install -r requirements.txt
```

Выполнить миграции:

```
py manage.py makemigrations
py manage.py migrate
```

Запустить проект:

```
py manage.py runserver
```


Открыть новую вкладку IDE

```
cd frontend
npm start
```
