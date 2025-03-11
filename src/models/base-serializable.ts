export class BaseSerializable {
    public toJSON(): Record<string, any> {
        return BaseSerializable.cleanObject(this);
    }

    private static cleanObject(obj: any): any {
        if (Array.isArray(obj)) {
            // Remove empty arrays, otherwise clean elements recursively
            return obj.length > 0 ? obj.map(BaseSerializable.cleanObject) : undefined;
        } else if (obj !== null && typeof obj === "object") {
            // Remove empty objects and undefined values recursively
            const cleanedObj = Object.entries(obj).reduce((acc, [key, value]) => {
                const cleanedValue = BaseSerializable.cleanObject(value);
                if (cleanedValue !== undefined) {
                    acc[key] = cleanedValue;
                }
                return acc;
            }, {} as Record<string, any>);

            return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
        }
        return obj;
    }
}
