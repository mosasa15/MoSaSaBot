import screeps from './plugins/rollup-plugin-screeps.js';
// 这个rollup-plugin-screeps是修改过的版本, 兼容新版rollup
import clear from 'rollup-plugin-clear';
import copy from 'rollup-plugin-copy';
import fs from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser'; // 压缩代码

let config;
try {
    const secret = JSON.parse(fs.readFileSync('./.secret.json', 'utf-8'));
    config = secret[process.env.DEST];
} catch (e) {
    // ignore if no secret
    config = null;
}

// 根据指定的目标获取对应的配置项
if (!process.env.DEST) console.log("未指定目标, 代码将被编译但不会上传")
else if (!config) { console.log("无效目标，请检查 .secret.json 中是否包含对应配置") }

const runCopy = () => {
    return copy({
        targets: [
            {
                src: 'dist/main.js',
                dest: config.copyPath
            },
            {
                src: 'dist/main.js.map',
                dest: config.copyPath,
                rename: name => name + '.map.js',
                transform: contents => `module.exports = ${contents.toString()};`
            }
        ],
        hook: 'writeBundle',
        verbose: true
    })
}

// 根据指定的配置决定是上传还是复制到文件夹
const pluginDeploy =
    config?.copyPath ? runCopy() :
    config && screeps({ config, dayRun: !config });

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/main.js',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [
        // 清除上次编译成果
        clear({ targets: ["dist"] }),
        // 打包依赖
        resolve(),
        // 模块化依赖
        commonjs(),
        // 编译 ts
        typescript({ tsconfig: './tsconfig.json' }),
        // 压缩混淆代码
        terser({ format: { comments: false, beautify: false }, mangle: true, compress: true }),
        // 执行上传或者复制
        pluginDeploy
    ]
};
