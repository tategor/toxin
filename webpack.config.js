const path = require('path');   // Модуль path применяется, чтобы упростить определение путей к файлам в различных операционных системах.
const fs = require('fs');   // подключаем модуль fs для работы с файловой системой - понадобится для сканирования директории методом readdirSync()
const HtmlWebpackPlugin = require("html-webpack-plugin");   // подкл. плагин HtmlWebpackPlugin для герерации html-файлов (создание, подкл. скриптов/стилей)
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // плагин извлекает CSS в отдельные файлы, создает CSS-файл для каждого JS-файла, содержашего CSS
// Пути     - path.resolve вычисляет путь из сегментов (справа налево, до получения абсолютного)
const pathSrc = path.resolve(__dirname, 'src');
const pathDist = path.resolve(__dirname, 'dist');
const pathPages = path.resolve(__dirname, 'src/pages');   // потом все pug отправлю в папку pages, пока берём из pathSrc

let mode = 'development';
let devtool = 'source-map'; // генерировать карту исходников будет только в dev-режиме, в prod переводим в false
let isProd = false;
if (process.env.NODE_ENV === 'production') {    // NODE_ENV будет завить от команды запуска (npm run dev или npm run build - настройки в package.json)
    mode = 'production';
    devtool = false;
    isProd = true;
}
console.log('mode: ' + mode);
const pages = fs.readdirSync(pathPages);  // возвращается массив строк с путями к файлам/директориям вида ['index.pug',about.pug','components','fonts','images']
const extPages = '.pug'; // задаём расширение файлов, которые будем отдавать на обработку (т.е. переносить в html)
const pageNames = [];   // сюда будем складывать имена страниц для обработки (но без расширения), в результате чего получим массив вида ['index', 'about']
pages.forEach(page => {
    if (page.endsWith(extPages)) {   // фильтруем массив pages, отбираем только pug-файлы и складываем их в массив pageNames
        pageNames.push(page.slice(0,-extPages.length));  // убираем из имени файла расширение ('.pug'/'.html'/...) и добавляем получившуюся строку в массив pageNames
    }
})
console.log(pageNames);
const HWPArray = pageNames.map(name => {
    return new HtmlWebpackPlugin({
        template: `${pathPages}/${name}${extPages}`,   // файлы на входе
        filename: `${name}.html` // html'ки на выходе
    })
})

module.exports = {
    mode: mode, // режим текущей сборки
    devtool: devtool,    // карта исходников (только для dev, для prod будет false)
    optimization: {
        splitChunks: {  // выносим либы и иной повторяющийся код в отдельные файлы
            chunks: "all"
        }
    },
    entry: {
        scripts: `${pathSrc}/index.js`,  // index.js будет скомпилирован в scripts.js
        //user: './src/user.js'   // user.js будет скомпилирован в user.js
    },
    output: {
        path: pathDist,  // задаём директорию для файлов на выходе
        filename: "[name].[contenthash].js",    // задаём выходное имя js-файлов (name - имя исходника без расширения, contenthash - хеш содержимого файла)
        assetModuleFilename: "asset/[hash][ext][query]",    // задаём путь для выходных файлов изображений/шрифтов
        clean: true     // очищаем папку dist перед каждой сборкой
    },
    plugins: [ // подключаем плагины
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css'
        })
    ].concat(HWPArray),
    module: {
        rules: [ // цепочка лоадеров (каждый представляет собой объект с параметрами),
            {
                test: /\.html$/, // проверяем в папке src все файлы с расширением html, при нахождении отдаются на обработку лоудерам
                loader: "html-loader"
            },
            {
                test: /\.(sa|sc|c)ss$/, // проверяем в папке src все файлы с расширениями стилей, при нахождении отдаются на обработку лоудерам (в порядке СНИЗУ-ВВЕРХ)
                use: [
                    (mode === 'development') ? "style-loader" : MiniCssExtractPlugin.loader,  // для npm run start/dev = style-loader (css в DOM-дерево в секцию head), для build (production) = MiniCssExtractPlugin (отдельным файлом)
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    [
                                        "postcss-preset-env", // PostCSS Preset Env includes autoprefixer (добавление префиксов стилям для поддержки старыми браузерами)
                                        {
                                            // Options
                                        }
                                    ]
                                ]
                            }
                        }
                    },
                    "sass-loader"
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i, // проверяем в папке src все файлы с расширениями изображений, при нахождении отдаются на обработку лоудерам
                type: 'asset/resource' // передаем на обработку модулю ресурсов
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i, // проверяем в папке src все файлы с расширениями шрифтов, при нахождении отдаются на обработку лоудерам
                type: 'asset/resource' // передаем на обработку модулю ресурсов
            },
            {
                test: /\.pug$/i, // проверяем в папке src все файлы с расширениями pug, при нахождении отдаются на обработку лоудерам
                loader: 'pug-loader',   // этому лоудеру передаем файлы на обработку
                exclude: /(node_modules|bower_components)/,  // файлы в этих путях игнорируем
            },
            {
                test: /\.m?js$/i, // проверяем в папке src все файлы с расширениями js-скриптов, при нахождении отдаются на обработку лоудерам
                exclude: /node_modules/,  // исключаем проверку в этих папках
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']  // пакет, позволяющий более гибко настроить babel-loader, в том числе теперь можно опираться на browserslist
                    }
                }
            }
        ]
    },
    devServer: {    // настройки dev-server
        open: true,
        hot: true,
        port: 'auto',
        static: {
            directory: './src',
            watch: true
        }
    },
}