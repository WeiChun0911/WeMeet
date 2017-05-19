const path = require('path')
const webpack = require('webpack')


module.exports = {
    context: path.resolve(__dirname, './app'),
    entry: [
        './main.js',
    ],
    output: {
        path: path.resolve(__dirname, './public/'),
        filename: 'bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [{
            test: /\.js$/,
            use: [{
                loader: 'babel-loader',
                options: {
                    "presets": [
                        "es2015",
                        "react"
                    ]
                }
            }],
            exclude: /node_modules/,
        }, {
            test: /\.css$/,
            use: ['style-loader', 'css-loader?modules'],
        }],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"',
        }),
    ],
}
