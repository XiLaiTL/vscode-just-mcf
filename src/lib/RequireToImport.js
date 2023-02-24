const { readdirSync, lstatSync, readFileSync, writeFileSync} = require("fs");
const { join, extname } = require("path");

const regexpNames = /await Promise.resolve\(\).then\(\(\) => require\('(.+)'\)\)/g
function requiresToImport(path) {
    const files = readdirSync(path, 'utf-8')
    for (const fileName of files) {
        const pathNew = join(path, fileName)
        const stat =  lstatSync(pathNew)
        if (stat.isDirectory()) {
            requiresToImport(pathNew)
        }
        else if (stat.isFile() && extname(fileName) === ".js") {
            const codes = readFileSync(pathNew, { encoding: 'utf-8' })
            writeFileSync(pathNew, codes.replace(regexpNames,"await import('$1')"), {encoding: "utf8"})
        }
    }
}

const path = join(process.cwd(), process.argv[2])
requiresToImport(path)