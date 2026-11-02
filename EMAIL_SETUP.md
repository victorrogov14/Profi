1. Указать адрес менеджера

Адрес получателя задаётся переменной MAIL_APPLICATION_RECIPIENT. 

Откройте файл .env в корне проекта (рядом с compose.yaml) и укажите адрес:
   MAIL_APPLICATION_RECIPIENT=адрес_получателя@company.ru
Укажите тот же адрес в файле server/.env:
   MAIL_APPLICATION_RECIPIENT=адрес_получателя@company.ru
Пересоздайте контейнер и очистите кэш конфигурации:
bash
   docker compose up -d server
   docker compose exec server php artisan config:clear
Проверьте, что система видит новый адрес:
bash
   docker compose exec server php artisan tinker --execute="echo config('mail.application_recipient');"

Команда должна вывести адрес менеджера.

2. Ящик, с которого отправляются письма

Письма отправляются через Gmail. Отправитель задаётся в корневом .env:

MAIL_USERNAME=адрес_отправителя@gmail.com
MAIL_PASSWORD=пароль_приложения
MAIL_FROM_ADDRESS=адрес_отправителя@gmail.com

MAIL_PASSWORD — это пароль приложения Google, а не обычный пароль от аккаунта. Чтобы его получить:

Включите двухэтапную аутентификацию в аккаунте Google.
Откройте страницу myaccount.google.com/apppasswords.
Создайте пароль и вставьте его без пробелов.

Если необходимо отправлять письма с корпоративного ящика, кроме этих трёх переменных нужно изменить MAIL_HOST и 
MAIL_PORT в файле compose.yaml. Сейчас там указаны smtp.gmail.com и 587.

После любых изменений выполните команды из шага 3 раздела 1.

3. Проверка

Отправьте тестовую заявку через сайт. Письмо должно прийти менеджеру в течение нескольких секунд. 
Если его нет во «Входящих», проверьте папку «Спам».

Если письмо не пришло, посмотрите лог:

bash
docker compose exec server tail -n 50 storage/logs/laravel.log