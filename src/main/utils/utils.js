const fs = require('fs');
const path = require('path');

function deleteDirectory(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteDirectory(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    };
}

function deepConvert(input) {
    // Nếu input là Buffer, chuyển sang chuỗi rồi JSON.parse
    if (Buffer.isBuffer(input)) {
        try {
            const jsonStr = input.toString('utf-8');
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Lỗi chuyển Buffer sang JSON:", error);
            return input; // Nếu parse lỗi thì trả về giá trị gốc
        }
    }

    // Nếu input là chuỗi dạng data URI có định dạng base64 chứa JSON
    if (typeof input === 'string' && input.startsWith('data:application/json;base64,')) {
        try {
            const base64Part = input.split(',')[1]; // Lấy phần base64 sau dấu phẩy
            const jsonStr = Buffer.from(base64Part, 'base64').toString('utf-8');
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Lỗi chuyển data URI sang JSON:", error);
            return input;
        }
    }

    // Nếu input là một mảng, duyệt qua từng phần tử
    if (Array.isArray(input)) {
        return input.map(item => deepConvert(item));
    }

    // Nếu input là một object (không null), lặp qua các key
    if (input && typeof input === 'object') {
        const output = {};
        for (const key in input) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                output[key] = deepConvert(input[key]);
            }
        }
        return output;
    }

    // Nếu không phải buffer, mảng hay object, trả về chính input
    return input;
}

module.exports = {
    deleteDirectory,
    deepConvert,
};