export class RoutePlannerFormatter {
    public static toPrettyDistance(meters: number): string {
        if (meters > 10000) {
            return `${(meters / 1000).toFixed(1)} km`
        }

        if (meters > 5000) {
            return `${(meters / 1000).toFixed(2)} km`
        }

        return `${meters} m`
    }

     public static toPrettyTime(sec_num: number): string {
        let hours: number | string = Math.floor(sec_num / 3600);
        let minutes: number | string = Math.floor((sec_num - (hours * 3600)) / 60);

        if (sec_num === 0) {
            return '0'
        }

        if (!hours) {
            return minutes + 'min';
        }

        if (!minutes) {
            return hours + 'h';
        }

        return hours + 'h ' + minutes + 'm';
    }
}