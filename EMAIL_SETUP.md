1. Указать адрес менеджера

Адрес получателя задаётся переменной MAIL_APPLICATION_RECIPIENT.

Основной файл настроек почты — server/.env: именно его читает веб-сервер при отправке заявок.
Откройте server/.env и укажите адрес:
   MAIL_APPLICATION_RECIPIENT=адрес_получателя@company.ru
Укажите тот же адрес в файле .env в корне проекта (рядом с compose.yaml):
   MAIL_APPLICATION_RECIPIENT=адрес_получателя@company.ru
Значения в обоих файлах должны совпадать.

Пересоздайте контейнер и очистите кэш конфигурации:
bash
   docker compose up -d server
   docker compose exec server php artisan config:clear
   docker compose restart server
Проверьте, какие настройки почты использует веб-сервер:
bash
   docker compose exec server grep ^MAIL_ .env

Команда должна вывести адрес менеджера и остальные настройки почты из раздела 2.

2. Ящик, с которого отправляются письма

Письма отправляются через Gmail. Отправитель задаётся в server/.env — весь блок почтовых настроек:

MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=адрес_отправителя@gmail.com
MAIL_PASSWORD=пароль_приложения
MAIL_FROM_ADDRESS=адрес_отправителя@gmail.com
MAIL_FROM_NAME="ISI Service"

В корневом .env укажите те же значения для MAIL_USERNAME, MAIL_PASSWORD и MAIL_FROM_ADDRESS.

MAIL_FROM_ADDRESS должен совпадать с MAIL_USERNAME: Gmail не отправляет письма от имени чужого адреса.
MAIL_FROM_NAME — имя отправителя, которое увидит получатель.

MAIL_PASSWORD — это пароль приложения Google, а не обычный пароль от аккаунта. Чтобы его получить:

Включите двухэтапную аутентификацию в аккаунте Google.
Откройте страницу myaccount.google.com/apppasswords.
Создайте пароль и вставьте его без пробелов.

Если необходимо отправлять письма с корпоративного ящика, кроме адреса и пароля нужно изменить MAIL_HOST и
MAIL_PORT в server/.env, а также в файле compose.yaml. Сейчас там указаны smtp.gmail.com и 587.

После любых изменений выполните команды из раздела 1.

3. Проверка

Отправьте тестовую заявку через сайт. Письмо должно прийти менеджеру в течение нескольких секунд.
Если его нет во «Входящих», проверьте папку «Спам».

Если письмо не пришло, посмотрите лог:

bash
docker compose exec server tail -n 50 storage/logs/laravel.log
