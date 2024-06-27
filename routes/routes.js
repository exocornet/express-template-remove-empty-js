/* eslint-disable @typescript-eslint/no-var-requires, no-console*/
const { router, app } = require('../configurations/variables');

// # ПОЛУЧЕНИЕ МАРШРУТОВ ДЛЯ ЗАПРОСОВ # //
const INDEX_ROUTE = require('./index.route');

// # РЕГИСТРАЦИЯ МАРШРУТОВ ДЛЯ ЗАПРОСОВ # //
app.use(INDEX_ROUTE);

// # ЭКСПОРТ РОУТЕРА ДЛЯ ИСПОЛЬЗОВАНИЯ В ОСНОВНОМ ФАЙЛЕ ПРИЛОЖЕНИЯ # //
module.exports = router;
