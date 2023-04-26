const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: "production",
    entry: {
        popup: path.resolve(__dirname, "./src/popup.js"),
        // background: path.resolve(__dirname, "./src/background.js"),
        content: path.resolve(__dirname, "./src/content.js"),
        // options: path.resolve(__dirname, "./src/options.js"),
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    optimization: {
        // 表示只导出那些外部使用了的那些成员
        //  usedExports: true,
        // 压缩模块
        minimize: false

    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react',
                                {
                                    'plugins': ['@babel/plugin-proposal-class-properties']
                                }
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.html$/,
                use: ['html-loader']
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'popup.html',
            template: 'src/index.html',
            chunks: ['popup']
        }),
        new HtmlWebpackPlugin({
            filename: 'options.html',
            template: 'src/index.html',
            chunks: ['options']
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/manifest.json', to: 'manifest.json' },
                { from: 'src/background.js', to: 'background.js' },
                { from: 'src/assets', to: 'assets' }
            ]
        }),
    ]
}