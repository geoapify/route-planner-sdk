export class Utils {
    private static colors = ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
        "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"];

    public static cleanObject(obj: any): any {
        if (Array.isArray(obj)) {
            // Remove empty arrays, otherwise clean elements recursively
            return obj.length > 0 ? obj.map(Utils.cleanObject) : undefined;
        } else if (obj !== null && typeof obj === "object") {
            // Remove empty objects and undefined values recursively
            const cleanedObj = Object.entries(obj).reduce((acc, [key, value]) => {
                const cleanedValue = Utils.cleanObject(value);
                if (cleanedValue !== undefined) {
                    acc[key] = cleanedValue;
                }
                return acc;
            }, {} as Record<string, any>);

            return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
        }
        return obj;
    }

    public static cloneObject(obj: any): any {
        return JSON.parse(JSON.stringify(obj));
    }

    public static getAgentColorByIndex(index: number): string {
        return this.colors[(index % this.colors.length + this.colors.length) % this.colors.length]
    }
}