import path from "path";
import fs from "fs";

export function loadJson(fileName: string): any {
    const filePath = path.join(__dirname, '',  fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}