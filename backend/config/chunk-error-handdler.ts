import { ErrorHandler, Injectable, NgZone } from '@angular/core';

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
    constructor(private zone: NgZone) { }

    handleError(error: any): void {
        const isChunkError =
            error?.message?.includes('Failed to fetch dynamically imported module') ||
            error?.message?.includes('Importing a module script failed') ||
            error?.message?.includes('Unable to preload CSS');

        if (isChunkError) {
            const reloadCount = parseInt(sessionStorage.getItem('chunkReload') || '0');
            if (reloadCount < 2) {
                sessionStorage.setItem('chunkReload', String(reloadCount + 1));
                this.zone.runOutsideAngular(() => window.location.reload());
            } else {
                sessionStorage.removeItem('chunkReload');
                console.error('Chunk load failed after retries', error);
            }
        } else {
            console.error(error);
        }
    }
}