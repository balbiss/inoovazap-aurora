const fs = require('fs');
try {
    const data = fs.readFileSync('c:\\Users\\inoov\\Desktop\\SAAS INOOVASAUDE VERDE\\inoovazap-aurora\\debug_rpc_output.json', 'utf16le');
    console.log(data.substring(0, 1000));
} catch (err) {
    console.error(err);
}
